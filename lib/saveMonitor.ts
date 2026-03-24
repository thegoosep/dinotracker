/**
 * Server-side save file monitor.
 * - Checks Nitrado every 30s for new save files (fast detection).
 * - Also does a full scan every 5 minutes regardless (guaranteed periodic results).
 * - Uses globalThis to persist state across Next.js hot reloads.
 */
import { getServerList, getSaveFileInfo, downloadSave } from './nitrado';
import { parseArkSave, ue4ToLatLon, classNameToSpeciesId } from './arkParser';
import { buildDinoAlertEmbed, getOrCreateServerThreads, sendEmbedToThread, getMapDisplayName } from './discord';
import { loadLocalConfig } from './localConfig';

interface MonitorState {
  running: boolean;
  intervalId: NodeJS.Timeout | null;
  lastSaves: Record<string, number>; // service_id -> last modified_at
  lastCheck: string | null;
  lastScan: string | null;
  lastFullScan: number; // timestamp of last full scan
  scanCount: number;
  alertCount: number;
  log: string[];
  scanning: boolean; // prevent overlapping scans
}

const MAX_LOG = 500;
const FULL_SCAN_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

function getState(): MonitorState {
  if (!(globalThis as any).__saveMonitor) {
    (globalThis as any).__saveMonitor = {
      running: false,
      intervalId: null,
      lastSaves: {},
      lastCheck: null,
      lastScan: null,
      lastFullScan: 0,
      scanCount: 0,
      alertCount: 0,
      log: [],
      scanning: false,
    };
  }
  return (globalThis as any).__saveMonitor;
}

export function log(msg: string) {
  const state = getState();
  const ts = new Date().toLocaleTimeString();
  const line = `[${ts}] ${msg}`;
  console.log(`[Monitor] ${msg}`);
  state.log.push(line);
  if (state.log.length > MAX_LOG) state.log.shift();
}

async function scanServer(
  server: any,
  speciesThresholds: Record<string, any>,
  minPoints: number,
  maxLevel: number,
  baseUrl: string,
  guildId: string,
  forumChannelId: string,
  saveModifiedAt?: number,
  saveInfo?: any,
  token?: string
): Promise<{ alerts: number; found: number }> {
  log(`Downloading save: ${server.name} (${getMapDisplayName(server.map)})...`);
  const saveData = await downloadSave(server.service_id, server, saveInfo, token);
  log(`Parsing save file (${(saveData.length / 1024 / 1024).toFixed(1)} MB)...`);
  const wildDinos = parseArkSave(saveData);
  log(`${server.name} (${getMapDisplayName(server.map)}): ${wildDinos.length} wild dinos found`);

  const monitoredSpeciesIds = Object.keys(speciesThresholds);
  const serverEmbeds: any[] = [];

  for (const dino of wildDinos) {
    const speciesId = classNameToSpeciesId(dino.className);
    const threshold = speciesThresholds[speciesId];
    if (!threshold && monitoredSpeciesIds.length > 0) continue;
    if (dino.level > maxLevel) continue;

    const hpPoints = dino.wildStats[0] || 0;
    const meleePoints = dino.wildStats[8] || 0;
    const actualHp = dino.currentStats[0] || 0;

    const hpThreshold = threshold ? threshold.hp : minPoints;
    const meleeThreshold = threshold ? threshold.melee : minPoints;

    const hpExceeds = hpThreshold !== null && hpPoints >= hpThreshold;
    const meleeExceeds = meleeThreshold !== null && meleePoints >= meleeThreshold;

    if (!hpExceeds && !meleeExceeds) continue;

    log(`ALERT: ${speciesId} Lvl ${dino.level} — HP: ${hpPoints}, Melee: ${meleePoints} on ${server.name}`);

    const location = ue4ToLatLon(dino.x, dino.y, server.map);

    serverEmbeds.push(buildDinoAlertEmbed({
      species: speciesId,
      level: dino.level,
      hpPoints,
      meleePoints,
      actualHp,
      serverName: server.name,
      mapName: getMapDisplayName(server.map),
      location,
      baseUrl,
      scannedAt: saveModifiedAt ? new Date(saveModifiedAt * 1000).toISOString() : undefined,
    }));
  }

  let alertCount = 0;
  if (serverEmbeds.length > 0) {
    // Post to THIS GUILD'S forum only
    const threads = await getOrCreateServerThreads(server.name, guildId, forumChannelId);
    for (const { threadId, embedColor } of threads) {
      for (let i = 0; i < serverEmbeds.length; i += 10) {
        const batch = serverEmbeds.slice(i, i + 10).map(e =>
          embedColor !== undefined ? { ...e, color: embedColor } : e
        );
        const sent = await sendEmbedToThread(threadId, batch);
        if (sent) alertCount += batch.length;
        if (i + 10 < serverEmbeds.length) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    }
  }

  return { alerts: alertCount, found: serverEmbeds.length };
}

async function checkAndScan() {
  const state = getState();
  if (!state.running) return;
  if (state.scanning) {
    log('Scan still in progress, skipping this check');
    return;
  }

  state.scanning = true;
  state.lastCheck = new Date().toISOString();

  try {
    const localConfig = loadLocalConfig();
    if (!localConfig) { log('No config found, skipping'); return; }

    const minPoints = localConfig.min_points || 35;
    const maxLevel = localConfig.max_level || 180;
    const discordServers = localConfig.discord_servers || [];

    if (discordServers.length === 0) { log('No guilds configured'); return; }

    const baseUrl = process.env.NEXTAUTH_URL || `https://${process.env.VERCEL_URL}` || 'http://localhost:3001';
    const now = Date.now();
    const forceFullScan = (now - state.lastFullScan) >= FULL_SCAN_INTERVAL_MS;

    let totalServersChecked = 0;
    let totalAlerts = 0;

    // Process each guild independently
    for (const guild of discordServers) {
      const guildToken = guild.nitrado_token;
      const guildServers = guild.servers || [];
      const guildThresholds = guild.species_thresholds || {};

      if (!guildToken) {
        log(`Skipping guild ${guild.guild_name} (no Nitrado token)`);
        continue;
      }

      if (guildServers.length === 0) {
        log(`Skipping guild ${guild.guild_name} (no servers configured)`);
        continue;
      }

      // Get all available servers from Nitrado for this guild's token
      let availableServers: any[] = [];
      try {
        availableServers = await getServerList(guildToken);
      } catch (error) {
        log(`Failed to fetch servers for guild ${guild.guild_name}: ${error}`);
        continue;
      }

      // Filter to only configured servers
      const serversToCheck = availableServers.filter(s =>
        guildServers.some((gs: any) => gs.service_id === s.service_id)
      ).map(s => ({
        ...s,
        name: guildServers.find((gs: any) => gs.service_id === s.service_id)?.name || s.name,
      }));

      if (serversToCheck.length === 0) {
        log(`No matching servers on Nitrado for guild ${guild.guild_name}`);
        continue;
      }

      if (forceFullScan) {
        // Full scan of all servers for this guild
        log(`Full scan for guild ${guild.guild_name} (${serversToCheck.length} servers)...`);

        for (const server of serversToCheck) {
          totalServersChecked++;
          try {
            // Update saved timestamps while we're at it
            const info = await getSaveFileInfo(server.service_id, server, guildToken);
            if (info) state.lastSaves[`${guild.guild_id}:${server.service_id}`] = info.modified_at;

            const { alerts, found } = await scanServer(
              server,
              guildThresholds,
              minPoints,
              maxLevel,
              baseUrl,
              guild.guild_id,
              guild.forum_channel_id,
              info?.modified_at,
              info,
              guildToken
            );
            totalAlerts += alerts;
            state.alertCount += alerts;
            state.scanCount++;
            log(`${server.name} (${getMapDisplayName(server.map)}, ${guild.guild_name}): ${alerts} alerts sent (${found} found)`);
          } catch (error) {
            log(`Error scanning ${server.name} for guild ${guild.guild_name}: ${error}`);
          }
        }
      } else {
        // Quick check — only scan servers with new saves
        for (const server of serversToCheck) {
          totalServersChecked++;
          try {
            const info = await getSaveFileInfo(server.service_id, server, guildToken);
            if (!info) continue;

            const cacheKey = `${guild.guild_id}:${server.service_id}`;
            const lastModified = state.lastSaves[cacheKey] || 0;
            if (info.modified_at <= lastModified) continue;

            log(`New save: ${server.name} (${getMapDisplayName(server.map)}, ${guild.guild_name}) — modified_at changed`);
            state.lastSaves[cacheKey] = info.modified_at;

            const { alerts, found } = await scanServer(
              server,
              guildThresholds,
              minPoints,
              maxLevel,
              baseUrl,
              guild.guild_id,
              guild.forum_channel_id,
              info.modified_at,
              info,
              guildToken
            );
            totalAlerts += alerts;
            state.alertCount += alerts;
            state.scanCount++;
            log(`${server.name} (${getMapDisplayName(server.map)}, ${guild.guild_name}): ${alerts} alerts sent (${found} found)`);
          } catch (error) {
            log(`Error checking ${server.name} for guild ${guild.guild_name}: ${error}`);
          }
        }
      }
    }

    if (forceFullScan) {
      state.lastFullScan = now;
      state.lastScan = new Date().toISOString();
      log(`Full scan complete: ${totalAlerts} total alerts across ${totalServersChecked} servers`);
    } else {
      if (totalAlerts > 0) {
        state.lastScan = new Date().toISOString();
      }
      log(`Checked ${totalServersChecked} servers — ${totalAlerts > 0 ? `${totalAlerts} alerts sent` : 'no new saves'}`);
    }
  } finally {
    state.scanning = false;
  }
}

export function startMonitor(intervalSeconds = 30) {
  const state = getState();
  if (state.running) {
    return { already_running: true };
  }

  state.running = true;
  state.lastFullScan = 0; // force a full scan on first run
  log(`Starting monitor — checking every ${intervalSeconds}s, full scan every 5 min`);

  // Run first check immediately
  checkAndScan();

  // Then poll on interval
  state.intervalId = setInterval(() => {
    checkAndScan();
  }, intervalSeconds * 1000);

  return { started: true };
}

export function stopMonitor() {
  const state = getState();
  if (!state.running) {
    return { already_stopped: true };
  }

  state.running = false;
  if (state.intervalId) {
    clearInterval(state.intervalId);
    state.intervalId = null;
  }
  log('Monitor stopped');
  return { stopped: true };
}

export function getMonitorStatus() {
  const state = getState();
  const nextFullScan = state.lastFullScan > 0
    ? Math.max(0, Math.round((FULL_SCAN_INTERVAL_MS - (Date.now() - state.lastFullScan)) / 1000))
    : 0;
  return {
    running: state.running,
    scanning: state.scanning,
    lastCheck: state.lastCheck,
    lastScan: state.lastScan,
    nextFullScanIn: nextFullScan,
    scanCount: state.scanCount,
    alertCount: state.alertCount,
    trackedServers: Object.keys(state.lastSaves).length,
    log: state.log,
  };
}

// Auto-start monitor on server boot
if (!getState().running) {
  startMonitor(60);
}
