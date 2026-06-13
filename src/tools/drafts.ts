import { getGmailClient } from '../auth.js';
import { encodeEmail, parseHeaders, extractBody, extractHtmlBody } from '../utils/email.js';

export const draftToolDefinitions = [
  {
    name: 'gmail_create_draft',
    description: 'Create a new email draft',
    inputSchema: {
      type: 'object' as const,
      properties: {
        to: { type: 'string', description: 'Recipient email address(es)' },
        subject: { type: 'string', description: 'Email subject' },
        body: { type: 'string', description: 'Email body content' },
        cc: { type: 'string', description: 'CC recipients' },
        bcc: { type: 'string', description: 'BCC recipients' },
        isHtml: { type: 'boolean', description: 'Whether body is HTML' },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  {
    name: 'gmail_list_drafts',
    description: 'List all email drafts',
    inputSchema: {
      type: 'object' as const,
      properties: {
        maxResults: { type: 'number', description: 'Maximum drafts to return' },
        pageToken: { type: 'string', description: 'Page token for pagination' },
      },
    },
  },
  {
    name: 'gmail_get_draft',
    description: 'Get the full content of a draft by ID',
    inputSchema: {
      type: 'object' as const,
      properties: {
        draftId: { type: 'string', description: 'The draft ID' },
      },
      required: ['draftId'],
    },
  },
  {
    name: 'gmail_update_draft',
    description: 'Update an existing draft',
    inputSchema: {
      type: 'object' as const,
      properties: {
        draftId: { type: 'string', description: 'The draft ID to update' },
        to: { type: 'string', description: 'New recipient' },
        subject: { type: 'string', description: 'New subject' },
        body: { type: 'string', description: 'New body' },
        cc: { type: 'string', description: 'New CC' },
        bcc: { type: 'string', description: 'New BCC' },
        isHtml: { type: 'boolean', description: 'Whether body is HTML' },
      },
      required: ['draftId', 'to', 'subject', 'body'],
    },
  },
  {
    name: 'gmail_delete_draft',
    description: 'Delete a draft by ID',
    inputSchema: {
      type: 'object' as const,
      properties: {
        draftId: { type: 'string', description: 'The draft ID to delete' },
      },
      required: ['draftId'],
    },
  },
  {
    name: 'gmail_send_draft',
    description: 'Send an existing draft',
    inputSchema: {
      type: 'object' as const,
      properties: {
        draftId: { type: 'string', description: 'The draft ID to send' },
      },
      required: ['draftId'],
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

export async function handleDraftTool(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  try {
    const gmail = await getGmailClient();

    switch (name) {
      case 'gmail_create_draft': {
        const raw = encodeEmail(
          {
            to: args.to as string,
            subject: args.subject as string,
            cc: args.cc as string | undefined,
            bcc: args.bcc as string | undefined,
          },
          args.body as string,
          (args.isHtml as boolean) ?? false
        );

        const res = await gmail.users.drafts.create({
          userId: 'me',
          requestBody: { message: { raw } },
        });
        return { content: [{ type: 'text', text: JSON.stringify({ id: res.data.id, status: 'draft created' }) }] };
      }

      case 'gmail_list_drafts': {
        const listRes = await gmail.users.drafts.list({
          userId: 'me',
          maxResults: (args.maxResults as number) ?? 20,
          pageToken: args.pageToken as string | undefined,
        });

        const draftList = listRes.data.drafts ?? [];
        if (draftList.length === 0) {
          return { content: [{ type: 'text', text: JSON.stringify({ drafts: [] }) }] };
        }

        const details = await Promise.all(
          draftList.map(d =>
            gmail.users.drafts.get({ userId: 'me', id: d.id!, format: 'metadata' })
          )
        );

        const drafts = details.map(r => {
          const msg = r.data.message;
          const headers: Record<string, string> = {};
          for (const h of msg?.payload?.headers ?? []) {
            if (h.name && h.value) headers[h.name.toLowerCase()] = h.value;
          }
          return {
            id: r.data.id,
            messageId: msg?.id,
            subject: headers['subject'] ?? '(no subject)',
            to: headers['to'] ?? '',
            snippet: msg?.snippet ?? '',
          };
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ drafts, nextPageToken: listRes.data.nextPageToken ?? null }),
          }],
        };
      }

      case 'gmail_get_draft': {
        const res = await gmail.users.drafts.get({ userId: 'me', id: args.draftId as string, format: 'full' });
        const msg = res.data.message;
        const h = parseHeaders(msg?.payload?.headers);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              id: res.data.id,
              messageId: msg?.id,
              subject: h['subject'] ?? '(no subject)',
              to: h['to'] ?? '',
              cc: h['cc'] ?? '',
              body: extractBody(msg?.payload),
              htmlBody: extractHtmlBody(msg?.payload),
            }),
          }],
        };
      }

      case 'gmail_update_draft': {
        const raw = encodeEmail(
          {
            to: args.to as string,
            subject: args.subject as string,
            cc: args.cc as string | undefined,
            bcc: args.bcc as string | undefined,
          },
          args.body as string,
          (args.isHtml as boolean) ?? false
        );

        const res = await gmail.users.drafts.update({
          userId: 'me',
          id: args.draftId as string,
          requestBody: { message: { raw } },
        });
        return { content: [{ type: 'text', text: JSON.stringify({ id: res.data.id, status: 'draft updated' }) }] };
      }

      case 'gmail_delete_draft': {
        await gmail.users.drafts.delete({ userId: 'me', id: args.draftId as string });
        return { content: [{ type: 'text', text: JSON.stringify({ status: 'draft deleted' }) }] };
      }

      case 'gmail_send_draft': {
        const res = await gmail.users.drafts.send({
          userId: 'me',
          requestBody: { id: args.draftId as string },
        });
        return { content: [{ type: 'text', text: JSON.stringify({ id: res.data.id, threadId: res.data.threadId, status: 'draft sent' }) }] };
      }

      default:
        return { isError: true, content: [{ type: 'text', text: `Unknown tool: ${name}` }] };
    }
  } catch (error) {
    return { isError: true, content: [{ type: 'text', text: formatApiError(error) }] };
  }
}
