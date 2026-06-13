import { getGmailClient } from '../auth.js';
import { parseHeaders, extractBody } from '../utils/email.js';

export const searchToolDefinitions = [
  {
    name: 'gmail_search',
    description: 'Search emails using Gmail search syntax',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Gmail search query (e.g. "from:boss@example.com is:unread")' },
        maxResults: { type: 'number', description: 'Maximum results to return (default: 10)' },
        pageToken: { type: 'string', description: 'Page token for pagination' },
      },
      required: ['query'],
    },
  },
  {
    name: 'gmail_get_thread',
    description: 'Get all messages in an email thread',
    inputSchema: {
      type: 'object' as const,
      properties: {
        threadId: { type: 'string', description: 'The thread ID' },
      },
      required: ['threadId'],
    },
  },
  {
    name: 'gmail_list_threads',
    description: 'List email threads with optional filtering',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Gmail search query to filter threads' },
        maxResults: { type: 'number', description: 'Maximum threads to return (default: 10)' },
        pageToken: { type: 'string', description: 'Page token for pagination' },
      },
    },
  },
];

function formatApiError(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: number }).code;
    if (code === 401) return 'Auth expired. Run: npx gmail-mcp-server auth';
    if (code === 403) return 'Insufficient permissions. Check your OAuth scopes.';
    if (code === 429) return 'Gmail rate limit hit. Wait a moment and retry.';
  }
  return error instanceof Error ? error.message : String(error);
}

export async function handleSearchTool(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  try {
    const gmail = await getGmailClient();

    switch (name) {
      case 'gmail_search': {
        const listRes = await gmail.users.messages.list({
          userId: 'me',
          q: args.query as string,
          maxResults: (args.maxResults as number) ?? 10,
          pageToken: args.pageToken as string | undefined,
        });

        const messages = listRes.data.messages ?? [];
        if (messages.length === 0) {
          return { content: [{ type: 'text', text: JSON.stringify({ messages: [], nextPageToken: null }) }] };
        }

        const details = await Promise.all(
          messages.map(m =>
            gmail.users.messages.get({
              userId: 'me',
              id: m.id!,
              format: 'metadata',
              metadataHeaders: ['Subject', 'From', 'Date'],
            })
          )
        );

        const results = details.map(r => {
          const h = parseHeaders(r.data.payload?.headers);
          return {
            id: r.data.id,
            threadId: r.data.threadId,
            subject: h['subject'] ?? '(no subject)',
            from: h['from'] ?? '',
            date: h['date'] ?? '',
            snippet: r.data.snippet ?? '',
          };
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ messages: results, nextPageToken: listRes.data.nextPageToken ?? null }),
          }],
        };
      }

      case 'gmail_get_thread': {
        const res = await gmail.users.threads.get({
          userId: 'me',
          id: args.threadId as string,
          format: 'full',
        });

        const messages = (res.data.messages ?? []).map(msg => {
          const h = parseHeaders(msg.payload?.headers);
          return {
            id: msg.id,
            subject: h['subject'] ?? '(no subject)',
            from: h['from'] ?? '',
            to: h['to'] ?? '',
            date: h['date'] ?? '',
            body: extractBody(msg.payload),
            snippet: msg.snippet ?? '',
            labelIds: msg.labelIds ?? [],
          };
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ threadId: args.threadId, messageCount: messages.length, messages }),
          }],
        };
      }

      case 'gmail_list_threads': {
        const listRes = await gmail.users.threads.list({
          userId: 'me',
          q: args.query as string | undefined,
          maxResults: (args.maxResults as number) ?? 10,
          pageToken: args.pageToken as string | undefined,
        });

        const threads = (listRes.data.threads ?? []).map(t => ({
          id: t.id,
          snippet: t.snippet ?? '',
          historyId: t.historyId,
        }));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ threads, nextPageToken: listRes.data.nextPageToken ?? null }),
          }],
        };
      }

      default:
        return { isError: true, content: [{ type: 'text', text: `Unknown tool: ${name}` }] };
    }
  } catch (error) {
    return { isError: true, content: [{ type: 'text', text: formatApiError(error) }] };
  }
}
