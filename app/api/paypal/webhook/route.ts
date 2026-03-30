import { NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/paypal';
import { updateSubscriptionByPayPalId } from '@/lib/subscriptions';

export async function POST(request: Request) {
  const rawBody = await request.text();
  const headers = Object.fromEntries(request.headers.entries());

  // Verify signature
  const isValid = await verifyWebhookSignature(headers, rawBody);
  if (!isValid) {
    console.error('[PayPal Webhook] Invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const eventType = event.event_type as string;
  const resource = event.resource;

  console.log(`[PayPal Webhook] Event: ${eventType}, Subscription: ${resource.id}`);

  try {
    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await updateSubscriptionByPayPalId(resource.id, {
          status: 'active',
          activated_at: new Date().toISOString(),
        });
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await updateSubscriptionByPayPalId(resource.id, {
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          expires_at: resource.billing_info?.next_billing_time || new Date().toISOString(),
        });
        break;

      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await updateSubscriptionByPayPalId(resource.id, {
          status: 'suspended',
        });
        break;

      case 'BILLING.SUBSCRIPTION.EXPIRED':
        await updateSubscriptionByPayPalId(resource.id, {
          status: 'expired',
          expires_at: new Date().toISOString(),
        });
        break;

      case 'PAYMENT.SALE.COMPLETED':
        if (resource.billing_agreement_id) {
          await updateSubscriptionByPayPalId(resource.billing_agreement_id, {
            last_payment_at: new Date().toISOString(),
          });
        }
        break;

      default:
        console.log(`[PayPal Webhook] Unhandled event type: ${eventType}`);
    }
  } catch (error) {
    console.error('[PayPal Webhook] Processing error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
