import { NextResponse } from 'next/server';
import { startMonitor, stopMonitor, getMonitorStatus } from '@/lib/saveMonitor';

// GET — check monitor status
export async function GET() {
  return NextResponse.json(getMonitorStatus());
}

// POST — start or stop the monitor
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || 'start';

    if (action === 'start') {
      const interval = body.interval || 30;
      const result = startMonitor(interval);
      return NextResponse.json({ success: true, ...result });
    } else if (action === 'stop') {
      const result = stopMonitor();
      return NextResponse.json({ success: true, ...result });
    } else {
      return NextResponse.json({ error: 'Invalid action. Use "start" or "stop".' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
