import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getSubscriptionDetails } from '@/lib/paypal';
import { createSubscription, getSubscriptionByPayPalId } from '@/lib/subscriptions';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const { searchParams } = new URL(request.url);
  const subscriptionId = searchParams.get('subscription_id');

  if (!subscriptionId) {
    return NextResponse.redirect(new URL('/?paypal=error', request.url));
  }

  try {
    // Verify with PayPal
    const details = await getSubscriptionDetails(subscriptionId);

    // Only create if this specific PayPal subscription doesn't exist yet
    const existing = await getSubscriptionByPayPalId(subscriptionId);

    if (!existing) {
      await createSubscription({
        discord_user_id: session.user.id,
        discord_username: session.user.name || '',
        paypal_subscription_id: subscriptionId,
        guild_id: '',
        guild_name: '',
        status: details.status === 'ACTIVE' ? 'active' : 'pending',
        plan_id: details.plan_id || '',
        price: parseFloat(details.billing_info?.last_payment?.amount?.value) || 0,
        currency: 'USD',
        created_at: new Date().toISOString(),
        activated_at: details.status === 'ACTIVE' ? new Date().toISOString() : null,
        cancelled_at: null,
        expires_at: null,
        last_payment_at: null,
        paypal_payer_email: details.subscriber?.email_address || '',
      });
    }

    return NextResponse.redirect(new URL('/?subscription=success', request.url));
  } catch (error) {
    console.error('[PayPal] Subscription success handler error:', error);
    return NextResponse.redirect(new URL('/?paypal=error', request.url));
  }
}
