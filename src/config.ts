import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.gmail-mcp');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export interface GmailMCPConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export function loadConfig(): GmailMCPConfig | null {
  if (!fs.existsSync(CONFIG_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8')) as GmailMCPConfig;
  } catch {
    return null;
  }
}

export function saveConfig(config: GmailMCPConfig): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

export function configExists(): boolean {
  const config = loadConfig();
  return !!(config?.clientId && config?.clientSecret);
}
