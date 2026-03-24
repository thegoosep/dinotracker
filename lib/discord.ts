import { CONFIG } from './config';
import { loadLocalConfig } from './localConfig';
import { adminDb } from './firebaseAdmin';
import { getSpeciesById } from './species';
import * as fs from 'fs';
import * as path from 'path';

// Cache Firestore config in memory to avoid async reads in sync functions
let firestoreConfigCache: Record<string, any> | null = null;
let firestoreCacheTime = 0;
const CACHE_TTL = 30_000; // 30 seconds

async function loadFirestoreConfig(): Promise<Record<string, any> | null> {
  if (!adminDb) return null;
  const now = Date.now();
  if (firestoreConfigCache && (now - firestoreCacheTime) < CACHE_TTL) {
    return firestoreConfigCache;
  }
  try {
    const doc = await adminDb.collection('dino_monitor').doc('config').get();
    if (doc.exists) {
      firestoreConfigCache = doc.data()!;
      firestoreCacheTime = now;
      return firestoreConfigCache;
    }
  } catch (e) {
    console.error('[Discord] Failed to load Firestore config:', e);
  }
  return null;
}

function getConfigSync(): Record<string, any> | null {
  // Use cached Firestore config if available, otherwise local
  if (firestoreConfigCache && (Date.now() - firestoreCacheTime) < CACHE_TTL) {
    return firestoreConfigCache;
  }
  return loadLocalConfig();
}

interface DiscordEmbed {
  title: string;
  description: string;
  color: number;
  thumbnail?: { url: string };
  footer?: { text: string };
  timestamp?: string;
  _iconFile?: string; // internal: icon filename for attachment
}

const PURPLE_COLOR = 0xa855f7;

const MAP_DISPLAY_NAMES: Record<string, string> = {
  'TheIsland': 'The Island',
  'TheCenter': 'The Center',
  'ScorchedEarth_P': 'Scorched Earth',
  'Ragnarok': 'Ragnarok',
  'Aberration_P': 'Aberration',
  'Extinction': 'Extinction',
  'Valguero_P': 'Valguero',
  'Genesis': 'Genesis',
  'Gen2': 'Genesis 2',
  'CrystalIsles': 'Crystal Isles',
  'LostIsland': 'Lost Island',
  'Fjordur': 'Fjordur',
};

export function getMapDisplayName(mapId: string): string {
  return MAP_DISPLAY_NAMES[mapId] || mapId;
}
const API_BASE = 'https://discord.com/api/v10';

function getBotToken(): string {
  const localConfig = loadLocalConfig();
  return localConfig?.discord_bot_token || CONFIG.DISCORD_BOT_TOKEN || '';
}

interface DiscordServer {
  guild_id: string;
  guild_name: string;
  forum_channel_id: string;
  forum_channel_name: string;
  embed_color?: string;
  nitrado_token?: string;
  servers?: Array<{ service_id: string; name: string }>;
  species_thresholds?: Record<string, { hp: number | null; melee: number | null }>;
}

async function getDiscordServers(): Promise<DiscordServer[]> {
  // Try Firestore first
  const fbConfig = await loadFirestoreConfig();
  if (fbConfig) {
    const servers = fbConfig.discord_servers;
    if (Array.isArray(servers) && servers.length > 0) return servers;
  }
  // Fallback to local config
  const localConfig = loadLocalConfig();
  const servers = localConfig?.discord_servers;
  if (Array.isArray(servers) && servers.length > 0) return servers;
  // Fallback to legacy single-server config
  const guildId = localConfig?.discord_guild_id || CONFIG.DISCORD_GUILD_ID || '';
  const channelId = localConfig?.discord_forum_channel_id || CONFIG.DISCORD_FORUM_CHANNEL_ID || '';
  if (guildId && channelId) {
    return [{ guild_id: guildId, guild_name: '', forum_channel_id: channelId, forum_channel_name: '' }];
  }
  return [];
}

function getBotHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bot ${getBotToken()}`,
  };
}

// Cache of server name -> thread ID so we don't re-create threads
const threadCache = new Map<string, string>();

async function discordRequest(url: string, options: RequestInit): Promise<Response> {
  let resp = await fetch(url, options);

  // Handle rate limits
  if (resp.status === 429) {
    const data = await resp.json();
    const retryAfter = (data.retry_after || 1) * 1000;
    console.log(`[Discord] Rate limited, waiting ${retryAfter}ms...`);
    await new Promise(resolve => setTimeout(resolve, retryAfter));
    resp = await fetch(url, options);
  }

  return resp;
}

/**
 * Find or create a forum thread for a given server name in a specific guild+channel.
 */
async function findOrCreateThread(serverName: string, guildId: string, forumChannelId: string): Promise<string | null> {
  const cacheKey = `${guildId}:${serverName}`;
  const cached = threadCache.get(cacheKey);
  if (cached) {
    try {
      const checkResp = await discordRequest(`${API_BASE}/channels/${cached}`, {
        method: 'GET',
        headers: getBotHeaders(),
      });
      if (checkResp.ok) return cached;
    } catch { /* thread gone, recreate */ }
    threadCache.delete(cacheKey);
  }

  // Search active threads in the guild
  try {
    const activeResp = await discordRequest(
      `${API_BASE}/guilds/${guildId}/threads/active`,
      { method: 'GET', headers: getBotHeaders() }
    );

    if (activeResp.ok) {
      const data = await activeResp.json();
      const threads = data.threads || [];
      for (const thread of threads) {
        if (thread.parent_id === forumChannelId && thread.name === serverName) {
          threadCache.set(cacheKey, thread.id);
          return thread.id;
        }
      }
    }
  } catch (error) {
    console.error('[Discord] Failed to list active threads:', error);
  }

  // Create new forum post
  try {
    const createResp = await discordRequest(
      `${API_BASE}/channels/${forumChannelId}/threads`,
      {
        method: 'POST',
        headers: getBotHeaders(),
        body: JSON.stringify({
          name: serverName,
          message: { content: `Rare dino alerts for **${serverName}**` },
        }),
      }
    );

    if (createResp.ok) {
      const threadData = await createResp.json();
      threadCache.set(cacheKey, threadData.id);
      console.log(`[Discord] Created forum thread "${serverName}" in guild ${guildId} (${threadData.id})`);
      return threadData.id;
    } else {
      const errText = await createResp.text();
      console.error(`[Discord] Failed to create thread: ${createResp.status} ${errText}`);
    }
  } catch (error) {
    console.error('[Discord] Failed to create forum thread:', error);
  }

  return null;
}

export interface ServerThread {
  threadId: string;
  embedColor?: number;
}

/**
 * Get thread IDs for a server name across all configured Discord guilds.
 * If guildId and forumChannelId are provided, only creates thread for that specific guild+channel.
 */
export async function getOrCreateServerThreads(serverName: string, guildId?: string, forumChannelId?: string): Promise<ServerThread[]> {
  // If specific guild and channel provided, use those directly
  if (guildId && forumChannelId) {
    const threadId = await findOrCreateThread(serverName, guildId, forumChannelId);
    if (threadId) {
      // Get embed color from guild config if available
      const discordServers = await getDiscordServers();
      const guild = discordServers.find(ds => ds.guild_id === guildId);
      const color = guild?.embed_color ? parseInt(guild.embed_color.replace('#', ''), 16) : undefined;
      return [{ threadId, embedColor: color }];
    }
    return [];
  }

  // Otherwise, use all configured guilds (or filter by guildId if provided)
  const discordServers = await getDiscordServers();
  const filtered = guildId ? discordServers.filter(ds => ds.guild_id === guildId) : discordServers;
  const threads: ServerThread[] = [];
  for (const ds of filtered) {
    const threadId = await findOrCreateThread(serverName, ds.guild_id, ds.forum_channel_id);
    if (threadId) {
      const color = ds.embed_color ? parseInt(ds.embed_color.replace('#', ''), 16) : undefined;
      threads.push({ threadId, embedColor: color });
    }
  }
  return threads;
}

/** Legacy single-thread helper (returns first match) */
export async function getOrCreateServerThread(serverName: string): Promise<string | null> {
  const threads = await getOrCreateServerThreads(serverName);
  return threads[0]?.threadId || null;
}

/**
 * Send an embed to a specific thread (channel).
 * Attaches icon files from public/icons/ so thumbnails display in Discord.
 */
export async function sendEmbedToThread(threadId: string, embeds: DiscordEmbed[]): Promise<boolean> {
  try {
    // Collect unique icon files needed
    const iconFiles = new Map<string, Buffer>();
    const iconsDir = path.join(process.cwd(), 'public', 'icons');

    for (const embed of embeds) {
      const iconFile = embed._iconFile;
      if (iconFile && !iconFiles.has(iconFile)) {
        const filePath = path.join(iconsDir, iconFile);
        try {
          iconFiles.set(iconFile, fs.readFileSync(filePath));
        } catch {
          // Icon file not found, skip
        }
      }
    }

    // Clean internal field before sending
    const cleanEmbeds = embeds.map(({ _iconFile, ...rest }) => rest);

    // If we have icon files, send as multipart/form-data
    if (iconFiles.size > 0) {
      const boundary = '----DinoTracker' + Date.now();
      const parts: Buffer[] = [];

      // JSON payload part
      const attachments = Array.from(iconFiles.keys()).map((filename, i) => ({
        id: i,
        filename,
      }));
      const payload = JSON.stringify({ embeds: cleanEmbeds, attachments });

      parts.push(Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="payload_json"\r\nContent-Type: application/json\r\n\r\n${payload}\r\n`
      ));

      // File parts
      let fileIndex = 0;
      for (const [filename, data] of iconFiles) {
        parts.push(Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="files[${fileIndex}]"; filename="${filename}"\r\nContent-Type: image/png\r\n\r\n`
        ));
        parts.push(data);
        parts.push(Buffer.from('\r\n'));
        fileIndex++;
      }

      parts.push(Buffer.from(`--${boundary}--\r\n`));

      const body = Buffer.concat(parts);

      const resp = await discordRequest(
        `${API_BASE}/channels/${threadId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bot ${getBotToken()}`,
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
          },
          body,
        }
      );
      return resp.ok;
    }

    // No icons — send as plain JSON
    const resp = await discordRequest(
      `${API_BASE}/channels/${threadId}/messages`,
      {
        method: 'POST',
        headers: getBotHeaders(),
        body: JSON.stringify({ embeds: cleanEmbeds }),
      }
    );
    return resp.ok;
  } catch (error) {
    console.error('[Discord] Failed to send embed:', error);
    return false;
  }
}

/**
 * Send a dino alert to ALL configured Discord servers' forum threads.
 */
export async function sendDinoAlert(
  serverName: string,
  embed: DiscordEmbed,
  guildId?: string,
): Promise<boolean> {
  const threads = await getOrCreateServerThreads(serverName, guildId);
  if (threads.length === 0) {
    console.error(`[Discord] Could not get any threads for "${serverName}"`);
    return false;
  }
  let success = false;
  for (const { threadId, embedColor } of threads) {
    const coloredEmbed = embedColor !== undefined ? { ...embed, color: embedColor } : embed;
    const sent = await sendEmbedToThread(threadId, [coloredEmbed]);
    if (sent) success = true;
  }
  return success;
}

export function buildDinoAlertEmbed(params: {
  species: string;
  level: number;
  hpPoints: number;
  meleePoints: number;
  actualHp?: number;
  serverName: string;
  mapName?: string;
  location?: { lat?: number; lon?: number; x?: number; y?: number };
  scannedAt?: string;
  baseUrl: string;
}): DiscordEmbed {
  const speciesData = getSpeciesById(params.species);
  const speciesName = speciesData?.name || params.species;
  const iconFile = speciesData?.icon || '';

  const coords = params.location
    ? params.location.lat !== undefined
      ? `${params.location.lat} Lat, ${params.location.lon} Long`
      : `${Math.round(params.location.x || 0)}, ${Math.round(params.location.y || 0)}`
    : 'Unknown';

  const timestamp = params.scannedAt
    ? `<t:${Math.floor(new Date(params.scannedAt).getTime() / 1000)}:R>`
    : `<t:${Math.floor(Date.now() / 1000)}:R>`;

  const hpDisplay = params.actualHp
    ? `> HP: \` ${params.hpPoints} \` (${Math.round(params.actualHp).toLocaleString()})`
    : `> HP: \` ${params.hpPoints} \``;
  const meleeDisplay = `> Melee: \` ${params.meleePoints} \``;

  const description = [
    `**Dino: __ ${speciesName} __**`,
    `**Map: __ ${params.mapName || params.serverName} __**`,
    `**Cords: \` ${coords} \`**`,
    `**Last seen: ${timestamp}**`,
    `> **Stats**`,
    hpDisplay,
    meleeDisplay,
    `> Level: \` ${params.level} \``,
  ].join('\n');

  const embed: DiscordEmbed = {
    title: 'Rare Dino Found',
    description,
    color: PURPLE_COLOR,
    footer: { text: 'Warning: Dino may have moved or been killed' },
    timestamp: new Date().toISOString(),
  };

  if (iconFile) {
    embed.thumbnail = { url: `attachment://${iconFile}` };
    embed._iconFile = iconFile;
  }

  return embed;
}
