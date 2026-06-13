#!/usr/bin/env node
// Deprecated entry point kept for backwards compat with `npm run auth`.
// Auth is now handled by the browser-based setup server in src/setup/server.ts.
import { startSetupServer } from '../src/setup/server.js';

export async function runAuthFlow(): Promise<void> {
  await startSetupServer();
}

if (require.main === module) {
  startSetupServer().catch((err: unknown) => {
    console.error('Auth setup failed:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}
