import { NextResponse } from 'next/server';
import { getServerList, downloadSave, getSaveFileInfo } from '@/lib/nitrado';
import { parseArkSave, ue4ToLatLon, classNameToSpeciesId } from '@/lib/arkParser';
import { buildDinoAlertEmbed, getOrCreateServerThreads, sendEmbedToThread, getMapDisplayName } from '@/lib/discord';
import { adminDb } from '@/lib/firebaseAdmin';
import { loadLocalConfig } from '@/lib/localConfig';
import { log } from '@/lib/saveMonitor';

export const maxDuration = 300; // 5 min timeout for Vercel

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const targetServiceId = body.service_id; // optional: scan a specific server

    // Load thresholds from config (Firestore or local file)
    let speciesThresholds: Record<string, { hp: number | null; melee: number | null }> = {};
    let minPoints = 35;
    let maxLevel = 180;

    if (adminDb) {
      const configDoc = await adminDb.collection('dino_monitor').doc('config').get();
      const config = configDoc.data();
      if (config) {
        speciesThresholds = config.species_thresholds || {};
        minPoints = config.min_points || 35;
        maxLevel = config.max_level || 180;
      }
    } else {
      const localConfig = loadLocalConfig();
      if (localConfig) {
        speciesThresholds = localConfig.species_thresholds || {};
        minPoints = localConfig.min_points || 35;
        maxLevel = localConfig.max_level || 180;
      }
    }

    log(`[Scan] Config loaded: ${Object.keys(speciesThresholds).length} species thresholds, minPoints=${minPoints}, maxLevel=${maxLevel}`);

    // Get server list, filter to only configured servers, overlay configured names
    const servers = await getServerList();
    const localConfig = loadLocalConfig();
    const configNameMap = new Map((localConfig?.servers || []).map((s: any) => [String(s.service_id), s.name]));
    const namedServers = servers
      .filter(s => configNameMap.has(s.service_id))
      .map(s => ({ ...s, name: configNameMap.get(s.service_id) || s.name }));
    const toScan = targetServiceId
      ? namedServers.filter(s => s.service_id === targetServiceId)
      : namedServers;

    if (toScan.length === 0) {
      return NextResponse.json({ error: 'No servers found to scan' }, { status: 404 });
    }

    const baseUrl = process.env.NEXTAUTH_URL || `https://${process.env.VERCEL_URL}` || 'http://localhost:3001';
    const allResults: any[] = [];

    for (const server of toScan) {
      log(`[Scan] === Scanning ${server.name} (${getMapDisplayName(server.map)}) ===`);

      try {
        // Get save file timestamp
        const saveInfo = await getSaveFileInfo(server.service_id, server);
        const saveTimestamp = saveInfo?.modified_at
          ? new Date(saveInfo.modified_at * 1000).toISOString()
          : undefined;

        // Download save file
        log(`[Scan] Downloading save from ${server.name}...`);
        const saveData = await downloadSave(server.service_id, server, saveInfo);
        log(`[Scan] Parsing save file (${(saveData.length / 1024 / 1024).toFixed(1)} MB)...`);

        // Parse for wild dinos
        const wildDinos = parseArkSave(saveData);
        log(`[Scan] Found ${wildDinos.length} wild dinos`);

        // Filter by thresholds and collect embeds
        const monitoredSpeciesIds = Object.keys(speciesThresholds);
        const serverEmbeds: any[] = [];
        const serverResults: any[] = [];

        for (const dino of wildDinos) {
          const speciesId = classNameToSpeciesId(dino.className);

          // Check if this species is monitored
          const threshold = speciesThresholds[speciesId];
          if (!threshold && monitoredSpeciesIds.length > 0) continue;

          // Skip if over max level (probably not a natural wild)
          if (dino.level > maxLevel) continue;

          // ARK stat indices: 0=HP, 1=Stam, 2=Torpidity, 3=Oxygen, 4=Food, 5=Water, 6=Temp, 7=Weight, 8=Melee, 9=Speed
          const hpPoints = dino.wildStats[0] || 0;
          const meleePoints = dino.wildStats[8] || 0;
          const actualHp = dino.currentStats[0] || 0;

          // Check thresholds
          const hpThreshold = threshold?.hp ?? minPoints;
          const meleeThreshold = threshold?.melee ?? minPoints;

          const hpExceeds = hpThreshold !== null && hpPoints >= hpThreshold;
          const meleeExceeds = meleeThreshold !== null && meleePoints >= meleeThreshold;

          if (!hpExceeds && !meleeExceeds) continue;

          log(`[Scan] ALERT: ${speciesId} Lvl ${dino.level} — HP: ${hpPoints}, Melee: ${meleePoints} on ${server.name}`);

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
            scannedAt: saveTimestamp,
          }));

          serverResults.push({
            species: speciesId,
            level: dino.level,
            hp_points: hpPoints,
            melee_points: meleePoints,
            location,
            server_name: server.name,
            service_id: server.service_id,
            scanned_at: new Date().toISOString(),
            is_female: dino.isFemale,
            class_name: dino.className,
          });
        }

        // Send all embeds for this server in batches of 10 (Discord limit)
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

        allResults.push(...serverResults);

        log(`[Scan] ${server.name}: ${alertCount} alerts sent`);
      } catch (error) {
        log(`[Scan] ERROR scanning ${server.name}: ${error}`);
      }
    }

    log(`[Scan] Complete: ${toScan.length} servers scanned, ${allResults.length} rare dinos found`);

    return NextResponse.json({
      success: true,
      servers_scanned: toScan.length,
      results: allResults.length,
      alerts: allResults,
    });
  } catch (error) {
    log(`[Scan] FAILED: ${error}`);
    return NextResponse.json(
      { error: 'Scan failed', details: String(error) },
      { status: 500 }
    );
  }
}
