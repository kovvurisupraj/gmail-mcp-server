# gmail-mcp-server

A production-ready MCP (Model Context Protocol) server that connects Claude AI to your Gmail account, enabling full email management through natural language.

No Google Cloud setup knowledge required — just add it to Claude Desktop and follow the on-screen instructions.

## Features

- **Email Management** — list, read, send, reply, forward, trash, delete, archive, star emails
- **Drafts** — create, list, read, update, delete, and send drafts
- **Labels** — create, list, update, delete labels; add/remove labels from messages
- **Search** — full Gmail search syntax, thread retrieval, pagination
- **Attachments** — list and download attachments, optionally save to disk
- **Settings** — vacation responder management, email filter creation and deletion
- **Batch Operations** — apply label changes to multiple emails at once
- **Multi-Account** — connect multiple Gmail accounts; switch with one env var
- **Auto Token Refresh** — OAuth tokens refreshed and persisted automatically
- **Guided Browser Setup** — first-time setup opens a UI in your browser automatically

## Setup

### 1. Add to Claude Desktop

Open your Claude Desktop config file:

- **macOS/Linux**: `~/.config/claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add this entry and restart Claude Desktop:

```json
{
  "mcpServers": {
    "gmail": {
      "command": "npx",
      "args": ["-y", "gmail-mcp-server"]
    }
  }
}
```

### 2. Connect Your Gmail

Ask Claude anything Gmail-related:

> "Check my Gmail"

A setup page will open in your browser automatically. Follow the on-screen instructions to connect your Gmail account. Takes about 2 minutes. You only do this once.

### Multiple Accounts

Run the auth command again to add more accounts:

```bash
npx gmail-mcp-server auth
```

Then add each account as a separate entry in Claude Desktop config using the `GMAIL_ACCOUNT` env var:

```json
{
  "mcpServers": {
    "gmail-personal": {
      "command": "npx",
      "args": ["-y", "gmail-mcp-server"],
      "env": { "GMAIL_ACCOUNT": "personal@gmail.com" }
    },
    "gmail-work": {
      "command": "npx",
      "args": ["-y", "gmail-mcp-server"],
      "env": { "GMAIL_ACCOUNT": "work@company.com" }
    }
  }
}
```

If only one account is connected, `GMAIL_ACCOUNT` is optional — the server uses it automatically.

## CLI Commands

| Command | Description |
|---------|-------------|
| `npx gmail-mcp-server auth` | Add a Gmail account (opens browser) |
| `npx gmail-mcp-server list-accounts` | List all connected accounts |
| `npx gmail-mcp-server remove-account <email>` | Remove an account and delete its token |

## Tools Reference

### Email Messages

| Tool | Description |
|------|-------------|
| `gmail_list_emails` | List emails with optional query/label filtering and pagination |
| `gmail_get_email` | Get full email content including body, HTML, and attachment metadata |
| `gmail_send_email` | Send a new email (supports HTML, CC, BCC) |
| `gmail_reply_to_email` | Reply to an email with proper threading headers |
| `gmail_forward_email` | Forward an email with optional message prefix |
| `gmail_trash_email` | Move an email to trash |
| `gmail_delete_email` | Permanently delete an email (requires `confirmDelete: true`) |
| `gmail_mark_as_read` | Remove the UNREAD label from a message |
| `gmail_mark_as_unread` | Add the UNREAD label to a message |
| `gmail_archive_email` | Remove from inbox (remove INBOX label) |
| `gmail_star_email` | Add STARRED label to a message |
| `gmail_batch_modify` | Add/remove labels from multiple messages at once |

### Drafts

| Tool | Description |
|------|-------------|
| `gmail_create_draft` | Create a new draft email |
| `gmail_list_drafts` | List all drafts with subject and snippet |
| `gmail_get_draft` | Get full draft content |
| `gmail_update_draft` | Update an existing draft |
| `gmail_delete_draft` | Delete a draft |
| `gmail_send_draft` | Send an existing draft |

### Labels

| Tool | Description |
|------|-------------|
| `gmail_list_labels` | List all labels with counts |
| `gmail_create_label` | Create a label with optional color |
| `gmail_update_label` | Update label name, visibility, or color |
| `gmail_delete_label` | Delete a label |
| `gmail_add_label_to_email` | Apply a label to a message |
| `gmail_remove_label_from_email` | Remove a label from a message |

### Search & Threads

| Tool | Description |
|------|-------------|
| `gmail_search` | Search emails using full Gmail search syntax |
| `gmail_get_thread` | Get all messages in a thread in order |
| `gmail_list_threads` | List threads with optional query filtering |

### Attachments

| Tool | Description |
|------|-------------|
| `gmail_list_attachments` | List all attachments in an email |
| `gmail_get_attachment` | Download attachment as base64 or save to disk |

### Settings

| Tool | Description |
|------|-------------|
| `gmail_get_vacation_responder` | Get vacation/out-of-office settings |
| `gmail_set_vacation_responder` | Configure vacation auto-reply |
| `gmail_disable_vacation_responder` | Turn off auto-reply |
| `gmail_list_filters` | List all email filters |
| `gmail_create_filter` | Create a new email filter with actions |
| `gmail_delete_filter` | Delete an email filter |

## Gmail Search Syntax Examples

Ask Claude using Gmail's full search syntax:

```
# Unread emails from a specific sender
from:boss@example.com is:unread

# Emails with attachments in the last week
has:attachment newer_than:7d

# Large emails over 10MB
larger:10m

# Emails in specific labels
label:work label:urgent

# Starred unread emails
is:starred is:unread
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GMAIL_ACCOUNT` | Only with multiple accounts | Email address of the account to use |

## Token Storage

Credentials and tokens are stored locally at `~/.gmail-mcp/`:

```
~/.gmail-mcp/
├── config.json        ← Google OAuth client credentials
├── accounts.json      ← Registered Gmail accounts
└── tokens/
    ├── personal@gmail.com.json
    └── work@company.com.json
```

These files never leave your machine. To revoke access, run `remove-account` or revoke the app at [myaccount.google.com/permissions](https://myaccount.google.com/permissions).

## Troubleshooting

### Setup page opens but credentials form fails

Make sure you created a **Desktop App** OAuth client in Google Cloud Console, not a Web App.

### "Multiple accounts found. Set GMAIL_ACCOUNT env var"

Add `"GMAIL_ACCOUNT": "your@email.com"` to the `env` section of the relevant Claude Desktop config entry.

### Auth expired / 401 error

Re-run auth for that account:
```bash
npx gmail-mcp-server remove-account your@email.com
npx gmail-mcp-server auth
```

### "Insufficient permissions" / 403 error

The token was created without all required scopes. Remove and re-authenticate:
```bash
npx gmail-mcp-server remove-account your@email.com
npx gmail-mcp-server auth
```

### Gmail rate limit hit / 429 error

Gmail API rate limit reached. Wait 1-2 minutes and retry.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and PR guidelines.

## License

MIT — see [LICENSE](LICENSE)
