# Contributing to gmail-mcp-server

Thank you for your interest in contributing! This document covers how to get started.

## Development Setup

1. **Fork and clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/gmail-mcp-server.git
cd gmail-mcp-server
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment**

```bash
cp .env.example .env
# Edit .env with your Google OAuth credentials
```

4. **Run authentication setup**

```bash
npm run auth
```

5. **Build the project**

```bash
npm run build
```

6. **Start in development mode**

```bash
npm run dev
```

## Project Structure

```
src/
  index.ts          — MCP server entry point and request routing
  auth.ts           — Google OAuth2 client setup and token management
  tools/
    index.ts        — Aggregates all tools and routes dispatch
    messages.ts     — Email CRUD operations
    drafts.ts       — Draft management
    labels.ts       — Label management
    search.ts       — Search and thread tools
    attachments.ts  — Attachment listing and download
    settings.ts     — Vacation responder and filters
  utils/
    email.ts        — RFC 2822 encoding, MIME body extraction
    token.ts        — Token file persistence
scripts/
  auth-setup.ts     — Interactive OAuth authorization flow
```

## Adding a New Tool

1. Choose the appropriate tool file in `src/tools/` (or create a new one)
2. Add the tool definition to the `*ToolDefinitions` array with a proper `inputSchema`
3. Add a `case` for the tool name in the handler switch statement
4. Export the definition and handler from `src/tools/index.ts`
5. Test it manually by running the server locally and using Claude Desktop

**Tool naming convention:** All tools must be prefixed with `gmail_`.

**Error handling:** Always wrap tool logic in try/catch and return `{ isError: true, content: [...] }` on failure.

## Pull Request Process

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/my-new-tool
   ```

2. **Make your changes** — keep PRs focused on a single feature or fix

3. **Build and verify** there are no TypeScript errors:
   ```bash
   npm run build
   ```

4. **Test manually** using Claude Desktop or MCP Inspector

5. **Push and open a PR** against the `main` branch

6. **Fill in the PR template** — describe what changed and why

## Code Style

- TypeScript strict mode is enabled — no `any` types
- All tool input schemas must have `type: 'object' as const`
- All `console.log` must be `process.stderr.write(...)` in the server context
- Error messages should be user-friendly and actionable
- No unnecessary comments — code should be self-documenting

## Reporting Issues

Use the GitHub issue templates:
- **Bug report** — for unexpected errors or broken functionality
- **Feature request** — for new Gmail API features you'd like exposed

## License

By contributing, you agree your contributions will be licensed under the MIT License.
