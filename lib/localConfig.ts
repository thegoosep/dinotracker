/**
 * File-based config storage fallback when Firebase is not available.
 * Saves/loads config to/from a local JSON file.
 */
import * as fs from 'fs';
import * as path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'data', 'dino-monitor-config.json');

function ensureDir() {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function loadLocalConfig(): Record<string, any> | null {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('[LocalConfig] Failed to load config:', e);
  }
  return null;
}

export function saveLocalConfig(config: Record<string, any>): boolean {
  try {
    ensureDir();
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('[LocalConfig] Failed to save config:', e);
    return false;
  }
}
