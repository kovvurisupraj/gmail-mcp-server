import { google } from 'googleapis';
import { gmail_v1 } from 'googleapis';
import { loadConfig } from './config.js';
import { loadToken, saveToken, listAccounts } from './utils/token.js';

export async function getGmailClient(): Promise<gmail_v1.Gmail> {
  // 1. Require saved config (CLIENT_ID + CLIENT_SECRET)
  const config = loadConfig();
  if (!config) {
    throw new Error('SETUP_REQUIRED');
  }

  const oAuth2Client = new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri
  );

  // 2. Resolve which Gmail account to use
  const accountEmail = process.env.GMAIL_ACCOUNT;
  const accounts = listAccounts();

  let email: string;
  if (accountEmail) {
    email = accountEmail;
  } else if (accounts.length === 1) {
    email = accounts[0].email;
  } else if (accounts.length > 1) {
    throw new Error(
      `Multiple accounts found. Set GMAIL_ACCOUNT env var to one of: ${accounts.map(a => a.email).join(', ')}`
    );
  } else {
    throw new Error('AUTH_REQUIRED');
  }

  // 3. Load saved token
  const token = loadToken(email);
  if (!token) {
    throw new Error(`AUTH_REQUIRED:${email}`);
  }

  oAuth2Client.setCredentials(token);

  // 4. Auto-persist refreshed tokens
  oAuth2Client.on('tokens', (tokens) => {
    const merged = { ...token, ...tokens };
    saveToken(merged, email);
  });

  return google.gmail({ version: 'v1', auth: oAuth2Client });
}
