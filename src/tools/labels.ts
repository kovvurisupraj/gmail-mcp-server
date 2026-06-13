import { getGmailClient } from '../auth.js';

export const labelToolDefinitions = [
  {
    name: 'gmail_list_labels',
    description: 'List all Gmail labels',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'gmail_create_label',
    description: 'Create a new Gmail label',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Label name' },
        labelListVisibility: {
          type: 'string',
          enum: ['labelShow', 'labelShowIfUnread', 'labelHide'],
          description: 'Label list visibility',
        },
        messageListVisibility: {
          type: 'string',
          enum: ['show', 'hide'],
          description: 'Message list visibility',
        },
        color: {
          type: 'object',
          description: 'Label color',
          properties: {
            backgroundColor: { type: 'string', description: 'Background color hex (e.g. #000000)' },
            textColor: { type: 'string', description: 'Text color hex (e.g. #ffffff)' },
          },
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'gmail_update_label',
    description: 'Update an existing label',
    inputSchema: {
      type: 'object' as const,
      properties: {
        labelId: { type: 'string', description: 'The label ID to update' },
        name: { type: 'string', description: 'New label name' },
        labelListVisibility: { type: 'string', enum: ['labelShow', 'labelShowIfUnread', 'labelHide'] },
        messageListVisibility: { type: 'string', enum: ['show', 'hide'] },
        color: {
          type: 'object',
          properties: {
            backgroundColor: { type: 'string' },
            textColor: { type: 'string' },
          },
        },
      },
      required: ['labelId'],
    },
  },
  {
    name: 'gmail_delete_label',
    description: 'Delete a Gmail label',
    inputSchema: {
      type: 'object' as const,
      properties: {
        labelId: { type: 'string', description: 'The label ID to delete' },
      },
      required: ['labelId'],
    },
  },
  {
    name: 'gmail_add_label_to_email',
    description: 'Add a label to an email',
    inputSchema: {
      type: 'object' as const,
      properties: {
        messageId: { type: 'string', description: 'The message ID' },
        labelId: { type: 'string', description: 'The label ID to add' },
      },
      required: ['messageId', 'labelId'],
    },
  },
  {
    name: 'gmail_remove_label_from_email',
    description: 'Remove a label from an email',
    inputSchema: {
      type: 'object' as const,
      properties: {
        messageId: { type: 'string', description: 'The message ID' },
        labelId: { type: 'string', description: 'The label ID to remove' },
      },
      required: ['messageId', 'labelId'],
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

export async function handleLabelTool(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  try {
    const gmail = await getGmailClient();

    switch (name) {
      case 'gmail_list_labels': {
        const res = await gmail.users.labels.list({ userId: 'me' });
        const labels = (res.data.labels ?? []).map(l => ({
          id: l.id,
          name: l.name,
          type: l.type,
          messagesTotal: l.messagesTotal,
          messagesUnread: l.messagesUnread,
        }));
        return { content: [{ type: 'text', text: JSON.stringify({ labels }) }] };
      }

      case 'gmail_create_label': {
        const color = args.color as { backgroundColor?: string; textColor?: string } | undefined;
        const res = await gmail.users.labels.create({
          userId: 'me',
          requestBody: {
            name: args.name as string,
            labelListVisibility: args.labelListVisibility as string | undefined,
            messageListVisibility: args.messageListVisibility as string | undefined,
            color: color ? { backgroundColor: color.backgroundColor, textColor: color.textColor } : undefined,
          },
        });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ id: res.data.id, name: res.data.name, status: 'label created' }),
          }],
        };
      }

      case 'gmail_update_label': {
        const color = args.color as { backgroundColor?: string; textColor?: string } | undefined;
        const res = await gmail.users.labels.update({
          userId: 'me',
          id: args.labelId as string,
          requestBody: {
            name: args.name as string | undefined,
            labelListVisibility: args.labelListVisibility as string | undefined,
            messageListVisibility: args.messageListVisibility as string | undefined,
            color: color ? { backgroundColor: color.backgroundColor, textColor: color.textColor } : undefined,
          },
        });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ id: res.data.id, name: res.data.name, status: 'label updated' }),
          }],
        };
      }

      case 'gmail_delete_label': {
        await gmail.users.labels.delete({ userId: 'me', id: args.labelId as string });
        return { content: [{ type: 'text', text: JSON.stringify({ status: 'label deleted' }) }] };
      }

      case 'gmail_add_label_to_email': {
        const res = await gmail.users.messages.modify({
          userId: 'me',
          id: args.messageId as string,
          requestBody: { addLabelIds: [args.labelId as string] },
        });
        return { content: [{ type: 'text', text: JSON.stringify({ id: res.data.id, status: 'label added' }) }] };
      }

      case 'gmail_remove_label_from_email': {
        const res = await gmail.users.messages.modify({
          userId: 'me',
          id: args.messageId as string,
          requestBody: { removeLabelIds: [args.labelId as string] },
        });
        return { content: [{ type: 'text', text: JSON.stringify({ id: res.data.id, status: 'label removed' }) }] };
      }

      default:
        return { isError: true, content: [{ type: 'text', text: `Unknown tool: ${name}` }] };
    }
  } catch (error) {
    return { isError: true, content: [{ type: 'text', text: formatApiError(error) }] };
  }
}
