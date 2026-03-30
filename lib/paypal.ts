const PAYPAL_BASE = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';

let cachedToken: { token: string; expires: number } | null = null;

export async function getPayPalAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expires) return cachedToken.token;

  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const resp = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!resp.ok) {
    throw new Error(`PayPal auth failed: ${resp.status} ${await resp.text()}`);
  }

  const data = await resp.json();
  cachedToken = {
    token: data.access_token,
    expires: Date.now() + (data.expires_in - 60) * 1000,
  };
  return data.access_token;
}

export async function getSubscriptionDetails(subscriptionId: string) {
  const token = await getPayPalAccessToken();
  const resp = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!resp.ok) {
    throw new Error(`PayPal subscription fetch failed: ${resp.status}`);
  }

  return resp.json();
}

export async function verifyWebhookSignature(
  headers: Record<string, string>,
  rawBody: string
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    console.warn('[PayPal] No PAYPAL_WEBHOOK_ID set, skipping verification');
    return true;
  }

  const token = await getPayPalAccessToken();
  const resp = await fetch(`${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth_algo: headers['paypal-auth-algo'],
      cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: webhookId,
      webhook_event: JSON.parse(rawBody),
    }),
  });

  if (!resp.ok) return false;

  const data = await resp.json();
  return data.verification_status === 'SUCCESS';
}

export async function createProduct(): Promise<string> {
  const token = await getPayPalAccessToken();
  const resp = await fetch(`${PAYPAL_BASE}/v1/catalogs/products`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Dino Tracker Monitoring',
      type: 'SERVICE',
      description: 'ARK dino monitoring service with Discord alerts',
    }),
  });

  if (!resp.ok) {
    throw new Error(`Failed to create product: ${resp.status} ${await resp.text()}`);
  }

  const data = await resp.json();
  return data.id;
}

export async function createPlan(productId: string): Promise<string> {
  const token = await getPayPalAccessToken();
  const resp = await fetch(`${PAYPAL_BASE}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_id: productId,
      name: 'Dino Tracker Monthly',
      description: 'Monthly dino monitoring for one ARK server',
      billing_cycles: [
        {
          frequency: { interval_unit: 'MONTH', interval_count: 1 },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: { value: '14.99', currency_code: 'USD' },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        payment_failure_threshold: 3,
      },
    }),
  });

  if (!resp.ok) {
    throw new Error(`Failed to create plan: ${resp.status} ${await resp.text()}`);
  }

  const data = await resp.json();
  return data.id;
}
