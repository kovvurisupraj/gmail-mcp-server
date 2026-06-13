import { gmail_v1 } from 'googleapis';
import { getGmailClient } from '../auth.js';
import {
  encodeEmail,
  extractBody,
  extractHtmlBody,
  extractAttachmentMeta,
  parseHeaders,
} from '../utils/email.js';

export const messageToolDefinitions = [
  {
    name: 'gmail_list_emails',
    description: 'List emails from Gmail inbox with optional filtering',
    inputSchema: {
      type: 'object' as const,
      properties: {
        maxResults: { type: 'number', description: 'Maximum number of emails to return (default: 10)' },
        query: { type: 'string', description: 'Gmail search query string (e.g. "is:unread from:boss@example.com")' },
        labelIds: { type: 'array', items: { type: 'string' }, description: 'Filter by label IDs' },
        pageToken: { type: 'string', description: 'Page token for pagination' },
      },
    },
  },
  {
    name: 'gmail_get_email',
    description: 'Get the full content of an email by message ID',
    inputSchema: {
      type: 'object' as const,
      properties: {
        messageId: { type: 'string', description: 'The Gmail message ID' },
      },
      required: ['messageId'],
    },
  },
  {
    name: 'gmail_send_email',
    description: 'Send a new email',
    inputSchema: {
      type: 'object' as const,
      properties: {
        to: { type: 'string', description: 'Recipient email address(es), comma-separated' },
        subject: { type: 'string', description: 'Email subject' },
        body: { type: 'string', description: 'Email body content' },
        cc: { type: 'string', description: 'CC recipient(s), comma-separated' },
        bcc: { type: 'string', description: 'BCC recipient(s), comma-separated' },
        isHtml: { type: 'boolean', description: 'Whether the body is HTML (default: false)' },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  {
    name: 'gmail_reply_to_email',
    description: 'Reply to an existing email thread',
    inputSchema: {
      type: 'object' as const,
      properties: {
        messageId: { type: 'string', description: 'The message ID to reply to' },
        body: { type: 'string', description: 'Reply body content' },
        isHtml: { type: 'boolean', description: 'Whether the body is HTML (default: false)' },
      },
      required: ['messageId', 'body'],
    },
  },
  {
    name: 'gmail_forward_email',
    description: 'Forward an email to another recipient',
    inputSchema: {
      type: 'object' as const,
      properties: {
        messageId: { type: 'string', description: 'The message ID to forward' },
        to: { type: 'string', description: 'Recipient to forward to' },
        body: { type: 'string', description: 'Optional message to prepend before the forwarded content' },
      },
      required: ['messageId', 'to'],
    },
  },
  {
    name: 'gmail_trash_email',
    description: 'Move an email to trash',
    inputSchema: {
      type: 'object' as const,
      properties: {
        messageId: { type: 'string', description: 'The message ID to trash' },
      },
      required: ['messageId'],
    },
  },
  {
    name: 'gmail_delete_email',
    description: 'Permanently delete an email (cannot be undone)',
    inputSchema: {
      type: 'object' as const,
      properties: {
        messageId: { type: 'string', description: 'The message ID to permanently delete' },
        confirmDelete: { type: 'boolean', description: 'Must be set to true to confirm permanent deletion' },
      },
      required: ['messageId', 'confirmDelete'],
    },
  },
  {
    name: 'gmail_mark_as_read',
    description: 'Mark an email as read',
    inputSchema: {
      type: 'object' as const,
      properties: {
        messageId: { type: 'string', description: 'The message ID to mark as read' },
      },
      required: ['messageId'],
    },
  },
  {
    name: 'gmail_mark_as_unread',
    description: 'Mark an email as unread',
    inputSchema: {
      type: 'object' as const,
      properties: {
        messageId: { type: 'string', description: 'The message ID to mark as unread' },
      },
      required: ['messageId'],
    },
  },
  {
    name: 'gmail_archive_email',
    description: 'Archive an email (remove from inbox)',
    inputSchema: {
      type: 'object' as const,
      properties: {
        messageId: { type: 'string', description: 'The message ID to archive' },
      },
      required: ['messageId'],
    },
  },
  {
    name: 'gmail_star_email',
    description: 'Star an email',
    inputSchema: {
      type: 'object' as const,
      properties: {
        messageId: { type: 'string', description: 'The message ID to star' },
      },
      required: ['messageId'],
    },
  },
  {
    name: 'gmail_batch_modify',
    description: 'Apply label changes to multiple emails at once',
    inputSchema: {
      type: 'object' as const,
      properties: {
        messageIds: { type: 'array', items: { type: 'string' }, description: 'Array of message IDs to modify' },
        addLabelIds: { type: 'array', items: { type: 'string' }, description: 'Label IDs to add' },
        removeLabelIds: { type: 'array', items: { type: 'string' }, description: 'Label IDs to remove' },
      },
      required: ['messageIds'],
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

export async function handleMessageTool(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  try {
    const gmail = await getGmailClient();

    switch (name) {
      case 'gmail_list_emails': {
        const maxResults = (args.maxResults as number) ?? 10;
        const query = args.query as string | undefined;
        const labelIds = args.labelIds as string[] | undefined;
        const pageToken = args.pageToken as string | undefined;

        const listRes = await gmail.users.messages.list({
          userId: 'me',
          maxResults,
          q: query,
          labelIds,
          pageToken,
        });

        const messages = listRes.data.messages ?? [];
        if (messages.length === 0) {
          return { content: [{ type: 'text', text: JSON.stringify({ emails: [], nextPageToken: null }) }] };
        }

        const details = await Promise.all(
          messages.map(m =>
            gmail.users.messages.get({ userId: 'me', id: m.id!, format: 'metadata',
              metadataHeaders: ['Subject', 'From', 'Date'] })
          )
        );

        const emails = details.map(r => {
          const h = parseHeaders(r.data.payload?.headers);
          return {
            id: r.data.id,
            threadId: r.data.threadId,
            subject: h['subject'] ?? '(no subject)',
            from: h['from'] ?? '',
            date: h['date'] ?? '',
            snippet: r.data.snippet ?? '',
            labelIds: r.data.labelIds ?? [],
          };
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ emails, nextPageToken: listRes.data.nextPageToken ?? null }),
          }],
        };
      }

      case 'gmail_get_email': {
        const messageId = args.messageId as string;
        const res = await gmail.users.messages.get({ userId: 'me', id: messageId, format: 'full' });
        const msg = res.data;
        const h = parseHeaders(msg.payload?.headers);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              id: msg.id,
              threadId: msg.threadId,
              subject: h['subject'] ?? '(no subject)',
              from: h['from'] ?? '',
              to: h['to'] ?? '',
              cc: h['cc'] ?? '',
              date: h['date'] ?? '',
              body: extractBody(msg.payload),
              htmlBody: extractHtmlBody(msg.payload),
              attachments: extractAttachmentMeta(msg.payload),
              labelIds: msg.labelIds ?? [],
            }),
          }],
        };
      }

      case 'gmail_send_email': {
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

        const res = await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
        return { content: [{ type: 'text', text: JSON.stringify({ id: res.data.id, threadId: res.data.threadId, status: 'sent' }) }] };
      }

      case 'gmail_reply_to_email': {
        const origRes = await gmail.users.messages.get({ userId: 'me', id: args.messageId as string, format: 'metadata',
          metadataHeaders: ['Subject', 'From', 'Message-ID', 'References'] });
        const origHeaders = parseHeaders(origRes.data.payload?.headers);
        const subject = origHeaders['subject'] ?? '';
        const replySubject = subject.startsWith('Re:') ? subject : `Re: ${subject}`;
        const messageId = origHeaders['message-id'] ?? '';
        const references = origHeaders['references']
          ? `${origHeaders['references']} ${messageId}`
          : messageId;

        const raw = encodeEmail(
          {
            to: origHeaders['from'] ?? '',
            subject: replySubject,
            'In-Reply-To': messageId,
            References: references,
          },
          args.body as string,
          (args.isHtml as boolean) ?? false
        );

        const res = await gmail.users.messages.send({
          userId: 'me',
          requestBody: { raw, threadId: origRes.data.threadId ?? undefined },
        });
        return { content: [{ type: 'text', text: JSON.stringify({ id: res.data.id, threadId: res.data.threadId, status: 'sent' }) }] };
      }

      case 'gmail_forward_email': {
        const origRes = await gmail.users.messages.get({ userId: 'me', id: args.messageId as string, format: 'full' });
        const origMsg = origRes.data;
        const origHeaders = parseHeaders(origMsg.payload?.headers);
        const origBody = extractBody(origMsg.payload);
        const originalFrom = origHeaders['from'] ?? '';
        const originalDate = origHeaders['date'] ?? '';
        const originalSubject = origHeaders['subject'] ?? '';

        const forwardHeader = `---------- Forwarded message ----------\nFrom: ${originalFrom}\nDate: ${originalDate}\nSubject: ${originalSubject}\n\n`;
        const prefixBody = args.body ? `${args.body as string}\n\n` : '';
        const fullBody = prefixBody + forwardHeader + origBody;

        const raw = encodeEmail(
          { to: args.to as string, subject: `Fwd: ${originalSubject}` },
          fullBody,
          false
        );

        const res = await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
        return { content: [{ type: 'text', text: JSON.stringify({ id: res.data.id, status: 'forwarded' }) }] };
      }

      case 'gmail_trash_email': {
        const res = await gmail.users.messages.trash({ userId: 'me', id: args.messageId as string });
        return { content: [{ type: 'text', text: JSON.stringify({ id: res.data.id, status: 'trashed' }) }] };
      }

      case 'gmail_delete_email': {
        if (args.confirmDelete !== true) {
          return {
            isError: true,
            content: [{ type: 'text', text: 'Must set confirmDelete: true to permanently delete an email. This action cannot be undone.' }],
          };
        }
        await gmail.users.messages.delete({ userId: 'me', id: args.messageId as string });
        return { content: [{ type: 'text', text: JSON.stringify({ status: 'permanently deleted' }) }] };
      }

      case 'gmail_mark_as_read': {
        const res = await gmail.users.messages.modify({
          userId: 'me', id: args.messageId as string,
          requestBody: { removeLabelIds: ['UNREAD'] },
        });
        return { content: [{ type: 'text', text: JSON.stringify({ id: res.data.id, status: 'marked as read' }) }] };
      }

      case 'gmail_mark_as_unread': {
        const res = await gmail.users.messages.modify({
          userId: 'me', id: args.messageId as string,
          requestBody: { addLabelIds: ['UNREAD'] },
        });
        return { content: [{ type: 'text', text: JSON.stringify({ id: res.data.id, status: 'marked as unread' }) }] };
      }

      case 'gmail_archive_email': {
        const res = await gmail.users.messages.modify({
          userId: 'me', id: args.messageId as string,
          requestBody: { removeLabelIds: ['INBOX'] },
        });
        return { content: [{ type: 'text', text: JSON.stringify({ id: res.data.id, status: 'archived' }) }] };
      }

      case 'gmail_star_email': {
        const res = await gmail.users.messages.modify({
          userId: 'me', id: args.messageId as string,
          requestBody: { addLabelIds: ['STARRED'] },
        });
        return { content: [{ type: 'text', text: JSON.stringify({ id: res.data.id, status: 'starred' }) }] };
      }

      case 'gmail_batch_modify': {
        await gmail.users.messages.batchModify({
          userId: 'me',
          requestBody: {
            ids: args.messageIds as string[],
            addLabelIds: (args.addLabelIds as string[]) ?? [],
            removeLabelIds: (args.removeLabelIds as string[]) ?? [],
          },
        });
        return { content: [{ type: 'text', text: JSON.stringify({ status: 'batch modify complete', count: (args.messageIds as string[]).length }) }] };
      }

      default:
        return { isError: true, content: [{ type: 'text', text: `Unknown tool: ${name}` }] };
    }
  } catch (error) {
    return { isError: true, content: [{ type: 'text', text: formatApiError(error) }] };
  }
}
