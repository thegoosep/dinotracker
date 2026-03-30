import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { hasUsedTrial, createSubscription, getSubscriptionByPayPalId } from '@/lib/subscriptions';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const userId = session.user.id;

  // Check if user already used their trial
  const used = await hasUsedTrial(userId);
  if (used) {
    return NextResponse.json({ error: 'Free trial already used' }, { status: 403 });
  }

  const trialId = `trial_${userId}`;

  // Double-check the doc doesn't already exist
  const existing = await getSubscriptionByPayPalId(trialId);
  if (existing) {
    return NextResponse.json({ error: 'Free trial already used' }, { status: 403 });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

  await createSubscription({
    discord_user_id: userId,
    discord_username: session.user.name || '',
    paypal_subscription_id: trialId,
    guild_id: '',
    guild_name: '',
    status: 'active',
    plan_id: 'free_trial',
    price: 0,
    currency: 'USD',
    created_at: now.toISOString(),
    activated_at: now.toISOString(),
    cancelled_at: null,
    expires_at: expiresAt.toISOString(),
    last_payment_at: null,
    paypal_payer_email: '',
    is_trial: true,
  });

  return NextResponse.json({ success: true });
}
