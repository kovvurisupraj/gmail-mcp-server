import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Credentials } from 'google-auth-library';

const TOKEN_DIR = path.join(os.homedir(), '.gmail-mcp');
const TOKENS_DIR = path.join(TOKEN_DIR, 'tokens');
const ACCOUNTS_FILE = path.join(TOKEN_DIR, 'accounts.json');

export interface Account {
  email: string;
  addedAt: string;
}

interface AccountsFile {
  accounts: Account[];
}

export function saveToken(tokens: Credentials, email: string): void {
  if (!fs.existsSync(TOKENS_DIR)) {
    fs.mkdirSync(TOKENS_DIR, { recursive: true });
  }
  fs.writeFileSync(
    path.join(TOKENS_DIR, `${email}.json`),
    JSON.stringify(tokens, null, 2),
    'utf-8'
  );
}

export function loadToken(email: string): Credentials | null {
  const tokenPath = path.join(TOKENS_DIR, `${email}.json`);
  if (!fs.existsSync(tokenPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(tokenPath, 'utf-8')) as Credentials;
  } catch {
    return null;
  }
}

export function registerAccount(email: string): void {
  const data = readAccountsFile();
  if (!data.accounts.some(a => a.email === email)) {
    data.accounts.push({ email, addedAt: new Date().toISOString() });
    writeAccountsFile(data);
  }
}

export function removeAccount(email: string): void {
  const data = readAccountsFile();
  data.accounts = data.accounts.filter(a => a.email !== email);
  writeAccountsFile(data);

  const tokenPath = path.join(TOKENS_DIR, `${email}.json`);
  if (fs.existsSync(tokenPath)) {
    fs.unlinkSync(tokenPath);
  }
}

export function listAccounts(): Account[] {
  return readAccountsFile().accounts;
}

function readAccountsFile(): AccountsFile {
  if (!fs.existsSync(ACCOUNTS_FILE)) return { accounts: [] };
  try {
    return JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf-8')) as AccountsFile;
  } catch {
    return { accounts: [] };
  }
}

function writeAccountsFile(data: AccountsFile): void {
  if (!fs.existsSync(TOKEN_DIR)) {
    fs.mkdirSync(TOKEN_DIR, { recursive: true });
  }
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}
