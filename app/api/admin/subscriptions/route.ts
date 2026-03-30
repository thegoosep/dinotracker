import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  getAllSubscriptions,
  getSubscriptionByPayPalId,
  updateSubscriptionByPayPalId,
  deleteSubscription,
} from '@/lib/subscriptions';

const ADMIN_USER_ID = '1194421789548351508';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.id !== ADMIN_USER_ID) {
    return null;
  }
  return session;
}

// GET — list all subscriptions
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const subs = await getAllSubscriptions();
  return NextResponse.json({ subscriptions: subs });
}

// POST — add time to a subscription
export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { paypal_subscription_id, add_hours } = await request.json();

  if (!paypal_subscription_id || !add_hours || typeof add_hours !== 'number') {
    return NextResponse.json({ error: 'paypal_subscription_id and add_hours (number) required' }, { status: 400 });
  }

  const sub = await getSubscriptionByPayPalId(paypal_subscription_id);
  if (!sub) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
  }

  const base = sub.expires_at ? new Date(sub.expires_at) : new Date();
  const newExpiry = new Date(base.getTime() + add_hours * 60 * 60 * 1000);

  await updateSubscriptionByPayPalId(paypal_subscription_id, {
    expires_at: newExpiry.toISOString(),
    status: 'active',
  });

  return NextResponse.json({ success: true, expires_at: newExpiry.toISOString() });
}

// DELETE — remove a subscription
export async function DELETE(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { paypal_subscription_id } = await request.json();

  if (!paypal_subscription_id) {
    return NextResponse.json({ error: 'paypal_subscription_id required' }, { status: 400 });
  }

  await deleteSubscription(paypal_subscription_id);
  return NextResponse.json({ success: true });
}
