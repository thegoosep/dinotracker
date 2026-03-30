import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getSubscriptionsForUser, hasUsedTrial } from '@/lib/subscriptions';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const subs = await getSubscriptionsForUser(session.user.id);
  const trialAvailable = !(await hasUsedTrial(session.user.id));

  if (subs.length === 0) {
    return NextResponse.json({ hasSubscription: false, trialAvailable, subscriptions: [] });
  }

  const now = new Date().toISOString();

  // Check if any sub needs a guild assigned (and is still valid)
  const pendingGuild = subs.find(
    s => (s.status === 'active' || s.status === 'pending') && !s.guild_id &&
      !(s.expires_at && s.expires_at <= now)
  );

  // Active subs: check expires_at for all
  const activeSubs = subs.filter(s => {
    if (s.status === 'active') {
      if (s.expires_at && s.expires_at <= now) return false;
      return true;
    }
    if (s.status === 'cancelled' && s.expires_at && s.expires_at > now) return true;
    return false;
  });

  const activeWithGuild = activeSubs.filter(s => !!s.guild_id);

  return NextResponse.json({
    hasSubscription: true,
    trialAvailable,
    pendingGuild: pendingGuild ? pendingGuild.paypal_subscription_id : null,
    activeCount: activeWithGuild.length,
    subscriptions: subs.map(s => ({
      paypal_subscription_id: s.paypal_subscription_id,
      status: s.status,
      guild_id: s.guild_id || null,
      guild_name: s.guild_name || null,
      expires_at: s.expires_at,
      is_trial: s.is_trial || false,
    })),
  });
}
