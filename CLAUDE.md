# CLAUDE.md — gmail-mcp-server

Project context for Claude Code sessions.

## What This Project Is

A production-ready npm-publishable MCP (Model Context Protocol) server that connects Claude AI to Gmail. Users add it to Claude Desktop and get 30 Gmail tools available via natural language.

## Project Structure

```
src/
  index.ts              Entry point — CLI routing + MCP server start
  auth.ts               getGmailClient() — loads config + token, returns Gmail client
  config.ts             Load/save ~/.gmail-mcp/config.json (OAuth credentials)
  setup/
    server.ts           Express server — browser-based first-time setup UI
    ui.ts               Self-contained HTML for the setup page (returned as string)
  tools/
    index.ts            dispatchTool() — pre-flight auth check + routes to handlers
    messages.ts         12 email tools (list, get, send, reply, forward, trash, etc.)
    drafts.ts           6 draft tools
    labels.ts           6 label tools
    search.ts           3 search/thread tools
    attachments.ts      2 attachment tools
    settings.ts         6 settings tools (vacation responder, filters)
  utils/
    email.ts            RFC 2822 encoding, MIME body extraction helpers
    token.ts            Multi-account token storage (per-email JSON files)
    port.ts             findAvailablePort(start) — tries 3000–3010
scripts/
  auth-setup.ts         Thin shim — now forwards to startSetupServer()
```

## Key Architecture Decisions

### Auth flow
- Credentials (`CLIENT_ID`, `CLIENT_SECRET`) live in `~/.gmail-mcp/config.json`
- Per-account tokens live in `~/.gmail-mcp/tokens/{email}.json`
- `accounts.json` is the registry of connected accounts
- `getGmailClient()` throws `'SETUP_REQUIRED'` (no config) or `'AUTH_REQUIRED'` (no token)
- Those errors are caught in `dispatchTool()` in tools/index.ts — auto-opens the setup browser UI

### Setup server
- Express server on port 3000 (tries 3001–3010 if busy)
- GET `/` → shows setup form (or redirects to `/auth/start` if config already exists)
- POST `/setup` → saves CLIENT_ID + CLIENT_SECRET to config.json
- GET `/auth/start` → generates Google OAuth URL, redirects browser to Google
- GET `/callback` → exchanges code for token, saves to disk, shuts server down
- `serverRunning` guard prevents multiple instances
- When called fire-and-forget from a tool handler, the MCP server keeps running in parallel

### Pre-flight auth check
`dispatchTool()` calls `getGmailClient()` once before routing to the tool handler to intercept setup/auth errors cleanly. If auth succeeds, the tool handler calls `getGmailClient()` again internally (two calls per request — acceptable trade-off that avoids modifying any tool file).

### bin path
`dist/src/index.js` — tsconfig `rootDir` is `./` (covers both `src/` and `scripts/`), so output mirrors source structure under `dist/`.

### `open` package pinned to v8
`open@9+` is ESM-only and incompatible with our `module: CommonJS` TypeScript target. `open@8` is the last CJS-compatible release and is functionally identical for our use case.

## Token + Config Storage

```
~/.gmail-mcp/
├── config.json         { clientId, clientSecret, redirectUri }
├── accounts.json       { accounts: [{ email, addedAt }] }
└── tokens/
    └── {email}.json    Google OAuth Credentials object
```

## Environment Variables

| Variable | Where set | Description |
|----------|-----------|-------------|
| `GMAIL_ACCOUNT` | Claude Desktop config env | Selects which account to use when multiple are connected |

## Claude Desktop Config

Minimal (single account, auto-detected):
```json
{ "mcpServers": { "gmail": { "command": "npx", "args": ["-y", "gmail-mcp-server"] } } }
```

Multi-account:
```json
{
  "mcpServers": {
    "gmail-personal": { "command": "npx", "args": ["-y", "gmail-mcp-server"], "env": { "GMAIL_ACCOUNT": "personal@gmail.com" } },
    "gmail-work":     { "command": "npx", "args": ["-y", "gmail-mcp-server"], "env": { "GMAIL_ACCOUNT": "work@company.com" } }
  }
}
```

## CLI Commands

```bash
npx gmail-mcp-server auth                          # browser-based OAuth setup
npx gmail-mcp-server list-accounts                 # show connected accounts
npx gmail-mcp-server remove-account email@x.com   # remove account + token
```

## Tool Rules

- All tool names are prefixed `gmail_`
- All inputSchemas use `type: 'object' as const`
- `gmail_delete_email` requires `confirmDelete: true`
- All tool handlers wrap logic in try/catch and return `{ isError: true, content: [...] }` on failure
- API error codes: 401 → "Auth expired", 403 → "Insufficient permissions", 429 → "Rate limit hit"

## Build

```bash
npm run build    # tsc — must produce zero errors
npm run dev      # ts-node src/index.ts
npm run auth     # ts-node scripts/auth-setup.ts (forwards to startSetupServer)
```

## Do Not Change (invariants)

- Individual tool definitions and handlers in `src/tools/messages.ts`, `drafts.ts`, `labels.ts`, `search.ts`, `attachments.ts`, `settings.ts`
- StdioServerTransport setup in `src/index.ts`
- `tsconfig.json`
- `.github/workflows/ci.yml`
- Tool name prefixes (`gmail_*`)
- Gmail API 401/403/429 error handling inside tool handlers
