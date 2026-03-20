import { CONFIG } from './config';
import * as zlib from 'zlib';

function getAuthHeaders(token?: string) {
  const t = token || CONFIG.NITRADO_TOKEN;
  return {
    Authorization: `Bearer ${t}`,
    'Content-Type': 'application/json',
  };
}

interface NitradoServer {
  service_id: string;
  name: string;
  status: string;
  map: string;
  saves_dir: string;
  ftproot: string;
  username: string;
}

export async function getServerList(token?: string): Promise<NitradoServer[]> {
  const headers = getAuthHeaders(token);
  const resp = await fetch('https://api.nitrado.net/services', {
    headers,
  });
  const data = await resp.json();
  const services = data?.data?.services || [];

  const servers: NitradoServer[] = [];
  for (const svc of services) {
    if (svc.type !== 'gameserver') continue;
    // Get detailed server info
    try {
      const detailResp = await fetch(
        `https://api.nitrado.net/services/${svc.id}/gameservers`,
        { headers }
      );
      const detailData = await detailResp.json();
      if (detailData?.status !== 'success') continue;

      const gs = detailData.data.gameserver;
      const noftp = gs?.game_specific?.path || '';
      const username = gs?.username || '';
      const configSettings = gs?.settings?.config || {};
      const mapStr = configSettings.map || '';
      const mapName = mapStr.includes(',') ? mapStr.split(',').pop()! : (mapStr || 'TheIsland');

      servers.push({
        service_id: String(svc.id),
        name: svc.details?.name || `Server ${svc.id}`,
        status: gs?.status || svc.status || 'unknown',
        map: mapName,
        saves_dir: `${noftp}ShooterGame/Saved/SavedArks/`,
        ftproot: `/games/${username}/ftproot/`,
        username,
      });
    } catch (error) {
      console.error(`Failed to get details for service ${svc.id}:`, error);
    }
  }

  return servers;
}

export interface SaveFileInfo {
  name: string;
  path: string; // full path to the file
  size: number;
  modified_at: number; // unix timestamp
}

/**
 * Find the newest save file for this server's map.
 * Checks both plain {Map}.ark and timestamped {Map}_*.ark.gz backups,
 * returning whichever was modified most recently.
 */
export async function getSaveFileInfo(serviceId: string, server: NitradoServer, token?: string): Promise<SaveFileInfo | null> {
  try {
    const headers = getAuthHeaders(token);
    const resp = await fetch(
      `https://api.nitrado.net/services/${serviceId}/gameservers/file_server/list?dir=${encodeURIComponent(server.saves_dir)}`,
      { headers }
    );
    const data = await resp.json();
    if (data?.status !== 'success') return null;

    const mapName = server.map;
    const entries = data.data?.entries || [];

    // Find all save files for this map: {Map}.ark and {Map}_*.ark.gz
    const candidates = entries.filter((e: any) =>
      e.type === 'file' && (
        e.name === `${mapName}.ark` ||
        (e.name.startsWith(`${mapName}_`) && e.name.endsWith('.ark.gz'))
      )
    );

    if (candidates.length === 0) return null;

    // Pick the most recently modified one
    candidates.sort((a: any, b: any) => (b.modified_at || 0) - (a.modified_at || 0));
    const best = candidates[0];

    return {
      name: best.name,
      path: `${server.saves_dir}${best.name}`,
      size: best.size || 0,
      modified_at: best.modified_at || 0,
    };
  } catch (error) {
    console.error(`[Nitrado] Failed to check save info for ${server.name}:`, error);
    return null;
  }
}

export async function downloadSave(serviceId: string, server: NitradoServer, saveInfo?: SaveFileInfo | null, token?: string): Promise<Buffer> {
  const headers = getAuthHeaders(token);
  // Find the newest save file (use provided info to avoid double API call)
  if (!saveInfo) saveInfo = await getSaveFileInfo(serviceId, server, token);
  const fileName = saveInfo?.name || `${server.map}.ark`;
  const arkPath = `${server.saves_dir}${fileName}`;
  const tempName = `${server.map}.ark`; // always use plain name for temp copy
  const tempPath = `${server.ftproot}${tempName}`;

  console.log(`[Download] Copying ${fileName} to ftproot for ${server.name}...`);

  // Copy save to ftproot
  const copyResp = await fetch(
    `https://api.nitrado.net/services/${serviceId}/gameservers/file_server/copy`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        source_path: arkPath,
        target_path: server.ftproot,
        target_name: tempName,
      }),
    }
  );
  const copyData = await copyResp.json();
  if (copyData?.status !== 'success') {
    throw new Error(`Copy failed: ${JSON.stringify(copyData)}`);
  }

  // Get download URL
  console.log(`[Download] Getting download URL...`);
  const dlResp = await fetch(
    `https://api.nitrado.net/services/${serviceId}/gameservers/file_server/download?file=${encodeURIComponent(tempPath)}`,
    { headers }
  );
  const dlData = await dlResp.json();
  if (dlData?.status !== 'success') {
    throw new Error(`Download URL failed: ${JSON.stringify(dlData)}`);
  }

  const tokenObj = dlData.data?.token || {};
  const url = tokenObj.url;
  const dlToken = tokenObj.token;

  // Download the file
  console.log(`[Download] Downloading ${fileName}...`);
  const fileHeaders: Record<string, string> = {};
  if (dlToken) fileHeaders['token'] = dlToken;

  const fileResp = await fetch(url, { headers: fileHeaders });
  if (!fileResp.ok) {
    throw new Error(`Download failed: HTTP ${fileResp.status}`);
  }

  const arrayBuffer = await fileResp.arrayBuffer();
  let raw = Buffer.from(arrayBuffer);
  console.log(`[Download] Got ${raw.length} bytes (${(raw.length / 1024 / 1024).toFixed(1)} MB)`);

  // Cleanup temp file (fire and forget)
  fetch(
    `https://api.nitrado.net/services/${serviceId}/gameservers/file_server/delete`,
    {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ path: tempPath }),
    }
  ).catch(() => {});

  // Decompress if gzipped
  try {
    const decompressed = zlib.gunzipSync(raw);
    console.log(`[Download] Decompressed: ${(decompressed.length / 1024 / 1024).toFixed(1)} MB`);
    return decompressed;
  } catch {
    console.log(`[Download] Not gzipped, using raw`);
    return raw;
  }
}
