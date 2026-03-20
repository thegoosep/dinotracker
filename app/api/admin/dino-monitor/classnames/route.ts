import { NextResponse } from 'next/server';
import { getServerList, downloadSave } from '@/lib/nitrado';
import { listAllClassNames } from '@/lib/arkParser';
import { loadLocalConfig } from '@/lib/localConfig';

export const maxDuration = 300;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'structures';
    const mapParam = searchParams.get('map') || 'Scorched';

    const localConfig = loadLocalConfig();
    const servers = await getServerList();
    const configNameMap = new Map((localConfig?.servers || []).map((s: any) => [String(s.service_id), s.name]));
    const toCheck = servers.filter(s => configNameMap.has(s.service_id));

    const server = toCheck.find(s => s.map?.toLowerCase().includes(mapParam.toLowerCase())) || toCheck[0];
    if (!server) return NextResponse.json({ error: 'No servers found' }, { status: 404 });

    console.log(`[ClassNames] Downloading save from ${server.name} (${server.map})...`);
    const saveData = await downloadSave(server.service_id, server);
    console.log(`[ClassNames] Parsing ${(saveData.length / 1024 / 1024).toFixed(1)} MB...`);

    const allNames = listAllClassNames(saveData);
    console.log(`[ClassNames] Found ${allNames.length} unique class names`);

    // Filter based on what the user wants
    let filtered: string[];
    if (filter === 'all') {
      filtered = allNames;
    } else if (filter === 'structures') {
      // Structures, terminals, nodes, vaults, obelisks, crates, etc.
      filtered = allNames.filter(n => {
        const lower = n.toLowerCase();
        return (
          lower.includes('structure') ||
          lower.includes('terminal') ||
          lower.includes('obelisk') ||
          lower.includes('tribute') ||
          lower.includes('supplycrate') ||
          lower.includes('vault') ||
          lower.includes('node') ||
          lower.includes('vein') ||
          lower.includes('artifact') ||
          lower.includes('beacon') ||
          lower.includes('explorer') ||
          lower.includes('cave') ||
          lower.includes('gate') ||
          lower.includes('lamp') ||
          lower.includes('light') ||
          lower.includes('pillar') ||
          lower.includes('rock') ||
          lower.includes('prop_') ||
          lower.includes('static') ||
          lower.includes('wall') ||
          lower.includes('fence') ||
          lower.includes('sign')
        ) && !lower.includes('character_bp');
      });
    } else {
      filtered = allNames.filter(n => n.toLowerCase().includes(filter.toLowerCase()));
    }

    return NextResponse.json({
      server: server.name,
      map: server.map,
      total_objects: allNames.length,
      filtered_count: filtered.length,
      filter,
      classNames: filtered,
    });
  } catch (error) {
    console.error('[ClassNames] Failed:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
