/**
 * Creates $12.99/month plan.
 * Run: npx tsx scripts/create-monthly-plan.ts
 */
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq > 0) {
      const key = trimmed.slice(0, eq);
      const val = trimmed.slice(eq + 1);
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const PAYPAL_BASE = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';

async function getToken(): Promise<string> {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');
  const resp = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  if (!resp.ok) throw new Error(`Auth failed: ${resp.status} ${await resp.text()}`);
  return (await resp.json()).access_token;
}

async function main() {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    console.error('Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in .env.local first.');
    process.exit(1);
  }

  console.log(`Using PayPal API: ${PAYPAL_BASE}`);
  const token = await getToken();
  console.log('Authenticated.\n');

  // Create product
  console.log('Creating product...');
  const productResp = await fetch(`${PAYPAL_BASE}/v1/catalogs/products`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Dino Tracker Monitoring',
      type: 'SERVICE',
      description: 'ARK dino monitoring service with Discord alerts',
    }),
  });
  if (!productResp.ok) throw new Error(`Product failed: ${productResp.status} ${await productResp.text()}`);
  const product = await productResp.json();
  console.log(`Product created: ${product.id}\n`);

  // $12.99/month
  console.log('Creating $12.99/month plan...');
  const monthlyResp = await fetch(`${PAYPAL_BASE}/v1/billing/plans`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product_id: product.id,
      name: 'Dino Tracker Monthly',
      description: 'Monthly dino monitoring - one server',
      billing_cycles: [{
        frequency: { interval_unit: 'MONTH', interval_count: 1 },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0,
        pricing_scheme: { fixed_price: { value: '12.99', currency_code: 'USD' } },
      }],
      payment_preferences: { auto_bill_outstanding: true, payment_failure_threshold: 3 },
    }),
  });
  if (!monthlyResp.ok) throw new Error(`Monthly plan failed: ${monthlyResp.status} ${await monthlyResp.text()}`);
  const monthly = await monthlyResp.json();
  console.log(`Monthly plan: ${monthly.id}`);
  console.log(`\nSet in .env.local:\nPAYPAL_PLAN_MONTHLY=${monthly.id}`);
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });
