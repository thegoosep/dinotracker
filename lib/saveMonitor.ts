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
    const threads = await getOrCreateServerThreads(server.name);
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

    const speciesThresholds = localConfig.species_thresholds || {};
    const minPoints = localConfig.min_points || 35;
    const maxLevel = localConfig.max_level || 180;
    const configServers = localConfig.servers || [];
    const discordServers = localConfig.discord_servers || [];
    const globalToken = localConfig.nitrado_token || '';

    if (configServers.length === 0) { log('No servers configured'); return; }

    // Collect unique Nitrado tokens from discord servers (fall back to global)
    const tokens = new Set<string>();
    for (const ds of discordServers) {
      tokens.add(ds.nitrado_token || globalToken);
    }
    if (tokens.size === 0 && globalToken) tokens.add(globalToken);

    // Build a set of configured service_ids with their names
    const configNameMap = new Map(configServers.map((s: any) => [String(s.service_id), s.name]));

    // Fetch game servers from each unique token
    const toCheck: Array<{ server: any; token: string }> = [];
    for (const token of tokens) {
      if (!token) continue;
      try {
        const servers = await getServerList(token);
        for (const s of servers) {
          if (configNameMap.has(s.service_id)) {
            toCheck.push({
              server: { ...s, name: configNameMap.get(s.service_id) || s.name },
              token,
            });
          }
        }
      } catch (error) {
        log(`Failed to get server list for token: ${error}`);
      }
    }

    if (toCheck.length === 0) { log('No matching servers on Nitrado'); return; }

    const baseUrl = process.env.NEXTAUTH_URL || `https://${process.env.VERCEL_URL}` || 'http://localhost:3001';
    const now = Date.now();
    const forceFullScan = (now - state.lastFullScan) >= FULL_SCAN_INTERVAL_MS;

    if (forceFullScan) {
      // Full scan of all servers
      log(`Full scan starting (${toCheck.length} servers)...`);
      let totalAlerts = 0;

      for (const { server, token } of toCheck) {
        try {
          // Update saved timestamps while we're at it
          const info = await getSaveFileInfo(server.service_id, server, token);
          if (info) state.lastSaves[server.service_id] = info.modified_at;

          const { alerts, found } = await scanServer(server, speciesThresholds, minPoints, maxLevel, baseUrl, info?.modified_at, info, token);
          totalAlerts += alerts;
          state.alertCount += alerts;
          state.scanCount++;
          log(`${server.name} (${getMapDisplayName(server.map)}): ${alerts} alerts sent (${found} found)`);
        } catch (error) {
          log(`Error scanning ${server.name}: ${error}`);
        }
      }

      state.lastFullScan = now;
      state.lastScan = new Date().toISOString();
      log(`Full scan complete: ${totalAlerts} total alerts across ${toCheck.length} servers`);
    } else {
      // Quick check — only scan servers with new saves
      let newSavesFound = 0;

      for (const { server, token } of toCheck) {
        try {
          const info = await getSaveFileInfo(server.service_id, server, token);
          if (!info) continue;

          const lastModified = state.lastSaves[server.service_id] || 0;
          if (info.modified_at <= lastModified) continue;

          newSavesFound++;
          log(`New save: ${server.name} (${getMapDisplayName(server.map)}) — modified_at changed`);
          state.lastSaves[server.service_id] = info.modified_at;

          const { alerts, found } = await scanServer(server, speciesThresholds, minPoints, maxLevel, baseUrl, info.modified_at, info, token);
          state.alertCount += alerts;
          state.scanCount++;
          log(`${server.name} (${getMapDisplayName(server.map)}): ${alerts} alerts sent (${found} found)`);
        } catch (error) {
          log(`Error checking ${server.name}: ${error}`);
        }
      }

      if (newSavesFound === 0) {
        log(`Checked ${toCheck.length} servers — no new saves`);
      } else {
        state.lastScan = new Date().toISOString();
        log(`${newSavesFound} new saves processed`);
      }
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
