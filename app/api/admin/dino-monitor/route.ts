import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { CONFIG } from '@/lib/config';
import { loadLocalConfig, saveLocalConfig } from '@/lib/localConfig';

const CONFIG_DOC = 'config';
const COLLECTION = 'dino_monitor';

const DEFAULT_CONFIG = {
  nitrado_token: CONFIG.NITRADO_TOKEN || '',
  discord_servers: [] as any[],
  discord_webhook_url: '',
  poll_interval_seconds: 60,
  min_points: 35,
  max_level: 180,
  species_thresholds: {} as Record<string, any>,
  servers: [] as any[],
};

export async function GET() {
  try {
    let data: Record<string, any> | null = null;

    if (adminDb) {
      const doc = await adminDb.collection(COLLECTION).doc(CONFIG_DOC).get();
      if (doc.exists) data = doc.data()!;
    } else {
      data = loadLocalConfig();
    }

    if (!data) {
      return NextResponse.json({ config: DEFAULT_CONFIG });
    }

    // Migrate legacy single-server config to discord_servers array
    let discordServers = data.discord_servers || [];
    if (discordServers.length === 0) {
      const guildId = data.discord_guild_id || CONFIG.DISCORD_GUILD_ID || '';
      const channelId = data.discord_forum_channel_id || CONFIG.DISCORD_FORUM_CHANNEL_ID || '';
      if (guildId && channelId) {
        discordServers = [{ guild_id: guildId, guild_name: '', forum_channel_id: channelId, forum_channel_name: '' }];
      }
    }

    return NextResponse.json({
      config: {
        ...DEFAULT_CONFIG,
        ...data,
        nitrado_token: CONFIG.NITRADO_TOKEN || data.nitrado_token || '',
        discord_servers: discordServers,
      },
    });
  } catch (error) {
    console.error('Failed to fetch dino monitor config:', error);
    return NextResponse.json({ config: DEFAULT_CONFIG });
  }
}

export async function PUT(request: Request) {
  try {
    const config = await request.json();

    const rawThresholds = config.species_thresholds || {};
    const species_thresholds: Record<string, { hp: number | null; melee: number | null }> = {};
    for (const [key, val] of Object.entries(rawThresholds)) {
      const v = val as any;
      species_thresholds[key] = {
        hp: v.hp === null ? null : (parseInt(v.hp) || 35),
        melee: v.melee === null ? null : (parseInt(v.melee) || 35),
      };
    }

    const configData: Record<string, any> = {
      nitrado_token: config.nitrado_token || '',
      discord_webhook_url: config.discord_webhook_url || '',
      discord_servers: config.discord_servers || [],
      poll_interval_seconds: parseInt(config.poll_interval_seconds) || 60,
      min_points: parseInt(config.min_points) || 35,
      max_level: parseInt(config.max_level) || 180,
      species_thresholds,
      servers: (config.servers || []).map((s: any) => ({
        service_id: String(s.service_id || ''),
        name: String(s.name || ''),
      })),
      updatedAt: new Date().toISOString(),
    };

    if (adminDb) {
      await adminDb.collection(COLLECTION).doc(CONFIG_DOC).set(configData, { merge: true });
    } else {
      saveLocalConfig(configData);
    }

    return NextResponse.json({ success: true, config: configData });
  } catch (error) {
    console.error('Failed to save dino monitor config:', error);
    return NextResponse.json(
      { error: 'Failed to save config' },
      { status: 500 }
    );
  }
}
