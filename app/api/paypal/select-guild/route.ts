import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getPendingGuildSubscription, updateSubscriptionByPayPalId } from '@/lib/subscriptions';
import { adminDb } from '@/lib/firebaseAdmin';
import { loadLocalConfig, saveLocalConfig } from '@/lib/localConfig';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { guild_id, guild_name, forum_channel_id } = await request.json();

  if (!guild_id) {
    return NextResponse.json({ error: 'guild_id is required' }, { status: 400 });
  }

  // Find the subscription that needs a guild
  const sub = await getPendingGuildSubscription(session.user.id);
  if (!sub) {
    return NextResponse.json({ error: 'No subscription awaiting guild selection' }, { status: 403 });
  }

  // Bind guild to subscription
  await updateSubscriptionByPayPalId(sub.paypal_subscription_id, {
    guild_id,
    guild_name: guild_name || '',
  });

  // Also create the discord_servers config entry so the monitor knows about this guild
  try {
    const COLLECTION = 'dino_monitor';
    const CONFIG_DOC = 'config';

    let config: Record<string, any> = {};
    if (adminDb) {
      const doc = await adminDb.collection(COLLECTION).doc(CONFIG_DOC).get();
      if (doc.exists) config = doc.data()!;
    } else {
      config = loadLocalConfig() || {};
    }

    const discordServers = config.discord_servers || [];
    const exists = discordServers.some((s: any) => s.guild_id === guild_id);
    if (!exists) {
      const newServer = {
        guild_id,
        guild_name: guild_name || '',
        forum_channel_id: forum_channel_id || '',
        forum_channel_name: '',
      };

      const updated = {
        ...config,
        discord_servers: [...discordServers, newServer],
      };

      if (adminDb) {
        await adminDb.collection(COLLECTION).doc(CONFIG_DOC).set(updated, { merge: true });
      } else {
        saveLocalConfig(updated);
      }
    }
  } catch (error) {
    console.error('[SelectGuild] Failed to update config:', error);
  }

  return NextResponse.json({ success: true });
}
