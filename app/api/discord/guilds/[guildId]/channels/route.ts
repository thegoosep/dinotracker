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
    return NextResponse.json({ error: 'No bot token configured' }, { status: 400 });
  }

  const resp = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
    headers: { Authorization: `Bot ${botToken}` },
  });

  if (!resp.ok) {
    if (resp.status === 403 || resp.status === 401) {
      return NextResponse.json({ error: 'Bot does not have access to this guild' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 502 });
  }

  const channels = await resp.json();

  // Type 15 = forum channel
  const forumChannels = channels
    .filter((ch: any) => ch.type === 15)
    .map((ch: any) => ({
      id: ch.id,
      name: ch.name,
    }));

  return NextResponse.json({ channels: forumChannels });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const { guildId } = await params;
  const body = await request.json().catch(() => ({}));
  const name = body.name || 'dino-alerts';

  const localConfig = loadLocalConfig();
  const botToken = localConfig?.discord_bot_token || CONFIG.DISCORD_BOT_TOKEN;

  if (!botToken) {
    return NextResponse.json({ error: 'No bot token configured' }, { status: 400 });
  }

  // Create a forum channel (type 15)
  const resp = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${botToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      type: 15,
      topic: 'Rare dino alerts from Dino Tracker',
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    return NextResponse.json({ error: `Failed to create channel: ${errText}` }, { status: resp.status });
  }

  const channel = await resp.json();
  return NextResponse.json({ channel: { id: channel.id, name: channel.name } });
}
