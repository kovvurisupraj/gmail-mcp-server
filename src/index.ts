#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { allToolDefinitions, dispatchTool } from './tools/index.js';
import { listAccounts, removeAccount } from './utils/token.js';
import { startSetupServer } from './setup/server.js';

(async () => {
  const args = process.argv.slice(2);

  // --- CLI commands ---

  if (args[0] === 'auth') {
    await startSetupServer();
    // HTTP server keeps the event loop alive — no process.exit() needed
    return;
  }

  if (args[0] === 'list-accounts') {
    const accounts = listAccounts();
    if (accounts.length === 0) {
      console.log('No accounts connected. Run: npx gmail-mcp-server auth');
    } else {
      console.log('Connected accounts:\n');
      for (const a of accounts) {
        const date = new Date(a.addedAt).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
        console.log(`  • ${a.email.padEnd(40)} (added ${date})`);
      }
      console.log('');
    }
    process.exit(0);
  }

  if (args[0] === 'remove-account') {
    const email = args[1];
    if (!email) {
      console.error('Usage: npx gmail-mcp-server remove-account <email>');
      process.exit(1);
    }
    removeAccount(email);
    console.log(`✅ Removed ${email}`);
    process.exit(0);
  }

  // --- Normal MCP server start ---

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pkg = require('../../package.json') as { name: string; version: string };

  const server = new Server(
    { name: pkg.name, version: pkg.version },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: allToolDefinitions,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: callArgs } = request.params;
    const safeArgs = (callArgs ?? {}) as Record<string, unknown>;

    try {
      const result = await dispatchTool(name, safeArgs);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        isError: true,
        content: [{ type: 'text', text: message }],
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.stderr.write('gmail-mcp-server started. Ready to accept connections.\n');
})();
