import { NextResponse } from 'next/server';
import { CONFIG } from '@/lib/config';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = body.nitrado_token || CONFIG.NITRADO_TOKEN;

    if (!token) {
      return NextResponse.json({ error: 'Nitrado token is required' }, { status: 400 });
    }

    const resp = await fetch('https://api.nitrado.net/services', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json(
        { error: `Nitrado API error (${resp.status}): ${text}` },
        { status: 502 }
      );
    }

    const data = await resp.json();
    const services = data?.data?.services || [];

    const servers = services
      .filter((svc: any) => svc.type === 'gameserver')
      .map((svc: any) => ({
        service_id: String(svc.id),
        name: svc.details?.name || `Server ${svc.id}`,
        game: svc.details?.game || '',
        status: svc.status || 'unknown',
      }));

    return NextResponse.json({ servers });
  } catch (error) {
    console.error('Failed to fetch Nitrado servers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch servers' },
      { status: 500 }
    );
  }
}
