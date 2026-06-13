import express, { Request, Response } from 'express';
import { google } from 'googleapis';
import open from 'open';
import { loadConfig, saveConfig } from '../config.js';
import { saveToken, registerAccount, listAccounts, removeAccount, loadToken } from '../utils/token.js';
import { findAvailablePort } from '../utils/port.js';
import { getSetupHTML, getDashboardHTML } from './ui.js';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.settings.basic',
  'https://www.googleapis.com/auth/userinfo.email',
];

let serverRunning = false;

export async function startSetupServer(): Promise<void> {
  if (serverRunning) return;
  serverRunning = true;

  const port = await findAvailablePort(3000);
  const app = express();
  app.use(express.json());

  // GET / — 3-way routing based on setup state
  app.get('/', (_req: Request, res: Response) => {
    const config = loadConfig();
    if (!config) {
      res.send(getSetupHTML(port, false));
    } else if (listAccounts().length === 0) {
      res.send(getSetupHTML(port, true));
    } else {
      res.send(getDashboardHTML());
    }
  });

  // POST /setup — save Google OAuth credentials
  app.post('/setup', (req: Request, res: Response) => {
    const { clientId, clientSecret } = req.body as { clientId?: string; clientSecret?: string };

    if (!clientId?.trim() || !clientSecret?.trim()) {
      res.json({ success: false, error: 'Client ID and Client Secret are required.' });
      return;
    }

    try {
      saveConfig({
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        redirectUri: `http://localhost:${port}/callback`,
      });
      res.json({ success: true });
    } catch (err) {
      res.json({
        success: false,
        error: err instanceof Error ? err.message : 'Failed to save credentials.',
      });
    }
  });

  // GET /auth/start — redirect to Google OAuth consent screen
  app.get('/auth/start', (_req: Request, res: Response) => {
    const config = loadConfig();
    if (!config) {
      res.redirect('/');
      return;
    }

    // Keep redirectUri in sync with the current port
    saveConfig({ ...config, redirectUri: `http://localhost:${port}/callback` });

    const oAuth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      `http://localhost:${port}/callback`
    );

    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
    });

    res.redirect(authUrl);
  });

  // GET /callback — exchange code, save token, redirect to dashboard
  app.get('/callback', async (req: Request, res: Response) => {
    const code = req.query['code'] as string | undefined;

    if (!code) {
      res.status(400).send('Missing authorization code.');
      return;
    }

    const config = loadConfig();
    if (!config) {
      res.status(400).send('Configuration not found. Please restart setup.');
      return;
    }

    try {
      const oAuth2Client = new google.auth.OAuth2(
        config.clientId,
        config.clientSecret,
        `http://localhost:${port}/callback`
      );

      const { tokens } = await oAuth2Client.getToken(code);
      oAuth2Client.setCredentials(tokens);

      const oauth2 = google.oauth2({ version: 'v2', auth: oAuth2Client });
      const userInfo = await oauth2.userinfo.get();
      const email = userInfo.data.email!;

      saveToken(tokens, email);
      registerAccount(email);

      process.stderr.write(`\n✅ Authenticated as ${email}\n`);

      res.redirect('/?connected=' + encodeURIComponent(email));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      res.status(500).send(
        `<p style="font-family:sans-serif;padding:40px">Authentication failed: ${message}. <a href="/">Try again</a></p>`
      );
    }
  });

  // GET /config — return current accounts with token expiry for the dashboard
  app.get('/config', (_req: Request, res: Response) => {
    const config = loadConfig();
    const accounts = listAccounts().map((a) => {
      const token = loadToken(a.email);
      return {
        email: a.email,
        addedAt: a.addedAt,
        tokenExpiry: token?.expiry_date ?? null,
      };
    });
    res.json({ accounts, hasConfig: !!config });
  });

  // DELETE /accounts/:email — remove a connected account
  app.delete('/accounts/:email', (req: Request, res: Response) => {
    const email = decodeURIComponent(String(req.params['email'] ?? ''));
    if (!email) {
      res.status(400).json({ success: false, error: 'Email required.' });
      return;
    }
    try {
      removeAccount(email);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : 'Failed to remove account.',
      });
    }
  });

  // Start listening — resolves once the port is bound and browser is opened
  await new Promise<void>((resolve, reject) => {
    const httpServer = app.listen(port, async () => {
      const config = loadConfig();
      const hasAccounts = listAccounts().length > 0;
      // Skip straight to OAuth if credentials exist but no account is connected yet
      const startPath = config && !hasAccounts ? '/auth/start' : '/';
      try {
        await open(`http://localhost:${port}${startPath}`);
      } catch {
        process.stderr.write(
          `\nCould not auto-open browser. Visit: http://localhost:${port}${startPath}\n`
        );
      }
      resolve();
    });

    httpServer.on('error', (err: Error) => {
      serverRunning = false;
      reject(err);
    });
  });
}
