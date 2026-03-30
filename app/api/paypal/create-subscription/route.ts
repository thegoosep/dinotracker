import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getPayPalAccessToken } from '@/lib/paypal';

const PAYPAL_BASE = process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { plan } = await request.json().catch(() => ({ plan: 'monthly' }));

  const planId = plan === 'quarterly'
    ? process.env.PAYPAL_PLAN_QUARTERLY
    : process.env.PAYPAL_PLAN_MONTHLY;

  if (!planId) {
    return NextResponse.json({ error: 'PayPal plan not configured' }, { status: 500 });
  }

  try {
    const token = await getPayPalAccessToken();
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001';

    const resp = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan_id: planId,
        application_context: {
          brand_name: 'Dino Tracker',
          return_url: `${baseUrl}/api/paypal/subscription-success`,
          cancel_url: `${baseUrl}?paypal=cancelled`,
          user_action: 'SUBSCRIBE_NOW',
        },
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error('[PayPal] Create subscription failed:', text);
      return NextResponse.json({ error: 'PayPal API error' }, { status: 502 });
    }

    const data = await resp.json();
    const approvalLink = data.links?.find((l: any) => l.rel === 'approve')?.href;

    return NextResponse.json({
      approvalUrl: approvalLink,
      subscriptionId: data.id,
    });
  } catch (error) {
    console.error('[PayPal] Create subscription error:', error);
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
  }
}
