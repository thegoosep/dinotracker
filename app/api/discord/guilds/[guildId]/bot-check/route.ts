import { NextResponse } from 'next/server';
import { CONFIG } from '@/lib/config';
import { loadLocalConfig } from '@/lib/localConfig';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const { guildId } = await params;

  const localConfig = loadLocalConfig();
  const botToken = localConfig?.discord_bot_token || CONFIG.DISCORD_BOT_TOKEN;

  if (!botToken) {
    return NextResponse.json({ botInGuild: false });
  }

  try {
    // List bot's guilds and check if the target guild is in the list
    const resp = await fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: { Authorization: `Bot ${botToken}` },
    });
    if (!resp.ok) return NextResponse.json({ botInGuild: false });
    const guilds = await resp.json();
    const found = guilds.some((g: any) => g.id === guildId);
    return NextResponse.json({ botInGuild: found });
  } catch {
    return NextResponse.json({ botInGuild: false });
  }
}
