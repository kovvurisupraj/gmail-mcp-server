import * as fs from 'fs';
import * as path from 'path';
import { getGmailClient } from '../auth.js';
import { extractAttachmentMeta } from '../utils/email.js';

export const attachmentToolDefinitions = [
  {
    name: 'gmail_list_attachments',
    description: 'List all attachments in an email',
    inputSchema: {
      type: 'object' as const,
      properties: {
        messageId: { type: 'string', description: 'The message ID to list attachments from' },
      },
      required: ['messageId'],
    },
  },
  {
    name: 'gmail_get_attachment',
    description: 'Download an attachment from an email',
    inputSchema: {
      type: 'object' as const,
      properties: {
        messageId: { type: 'string', description: 'The message ID containing the attachment' },
        attachmentId: { type: 'string', description: 'The attachment ID' },
        outputPath: { type: 'string', description: 'Optional file path to save the attachment to disk' },
      },
      required: ['messageId', 'attachmentId'],
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

export async function handleAttachmentTool(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  try {
    const gmail = await getGmailClient();

    switch (name) {
      case 'gmail_list_attachments': {
        const res = await gmail.users.messages.get({
          userId: 'me',
          id: args.messageId as string,
          format: 'full',
        });

        const attachments = extractAttachmentMeta(res.data.payload);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ messageId: args.messageId, attachments }),
          }],
        };
      }

      case 'gmail_get_attachment': {
        const res = await gmail.users.messages.attachments.get({
          userId: 'me',
          messageId: args.messageId as string,
          id: args.attachmentId as string,
        });

        const data = res.data.data;
        if (!data) {
          return { isError: true, content: [{ type: 'text', text: 'No attachment data returned' }] };
        }

        // Normalize base64url to standard base64
        const base64 = data.replace(/-/g, '+').replace(/_/g, '/');

        const outputPath = args.outputPath as string | undefined;
        if (outputPath) {
          const resolvedPath = outputPath.startsWith('~')
            ? path.join(process.env.HOME ?? process.env.USERPROFILE ?? '', outputPath.slice(1))
            : outputPath;

          const dir = path.dirname(resolvedPath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }

          fs.writeFileSync(resolvedPath, Buffer.from(base64, 'base64'));
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'saved',
                outputPath: resolvedPath,
                size: res.data.size,
              }),
            }],
          };
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              data: base64,
              mimeType: 'application/octet-stream',
              size: res.data.size,
            }),
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
