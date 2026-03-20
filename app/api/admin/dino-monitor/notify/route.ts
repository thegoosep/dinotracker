import { NextResponse } from 'next/server';
import { buildDinoAlertEmbed, sendDinoAlert } from '@/lib/discord';

export async function POST(request: Request) {
  try {
    const { results, guild_id } = await request.json();

    if (!results || !Array.isArray(results) || results.length === 0) {
      return NextResponse.json({ error: 'No results provided' }, { status: 400 });
    }

    const baseUrl = process.env.NEXTAUTH_URL || `https://${process.env.VERCEL_URL}` || 'http://localhost:3001';

    let sent = 0;
    for (const result of results) {
      const embed = buildDinoAlertEmbed({
        species: result.species,
        level: result.level,
        hpPoints: result.hp_points,
        meleePoints: result.melee_points,
        serverName: result.server_name || 'Test Server',
        location: result.location,
        scannedAt: result.scanned_at,
        baseUrl,
      });

      const success = await sendDinoAlert(result.server_name || 'Test Server', embed, guild_id);
      if (success) sent++;

      // Small delay to avoid rate limits
      if (results.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return NextResponse.json({ success: true, sent, total: results.length });
  } catch (error) {
    console.error('Failed to send notifications:', error);
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    );
  }
}
