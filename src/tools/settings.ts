import { getGmailClient } from '../auth.js';

export const settingsToolDefinitions = [
  {
    name: 'gmail_get_vacation_responder',
    description: 'Get the current vacation/out-of-office auto-reply settings',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'gmail_set_vacation_responder',
    description: 'Configure vacation/out-of-office auto-reply',
    inputSchema: {
      type: 'object' as const,
      properties: {
        enableAutoReply: { type: 'boolean', description: 'Whether to enable the auto-reply' },
        responseSubject: { type: 'string', description: 'Subject of the auto-reply' },
        responseBodyPlainText: { type: 'string', description: 'Plain text body of the auto-reply' },
        startTime: { type: 'string', description: 'Start time as Unix timestamp in milliseconds (optional)' },
        endTime: { type: 'string', description: 'End time as Unix timestamp in milliseconds (optional)' },
      },
      required: ['enableAutoReply'],
    },
  },
  {
    name: 'gmail_disable_vacation_responder',
    description: 'Disable the vacation/out-of-office auto-reply',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'gmail_list_filters',
    description: 'List all email filters',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'gmail_create_filter',
    description: 'Create a new email filter',
    inputSchema: {
      type: 'object' as const,
      properties: {
        from: { type: 'string', description: 'Filter emails from this address' },
        to: { type: 'string', description: 'Filter emails sent to this address' },
        subject: { type: 'string', description: 'Filter emails with this subject' },
        hasWords: { type: 'string', description: 'Filter emails containing these words' },
        doesNotHaveWords: { type: 'string', description: 'Filter emails not containing these words' },
        hasAttachment: { type: 'boolean', description: 'Filter emails with attachments' },
        action: {
          type: 'object',
          description: 'Action to apply to matched emails',
          properties: {
            addLabelIds: { type: 'array', items: { type: 'string' }, description: 'Label IDs to add' },
            removeLabelIds: { type: 'array', items: { type: 'string' }, description: 'Label IDs to remove' },
            forward: { type: 'string', description: 'Email address to forward to' },
          },
        },
      },
    },
  },
  {
    name: 'gmail_delete_filter',
    description: 'Delete an email filter',
    inputSchema: {
      type: 'object' as const,
      properties: {
        filterId: { type: 'string', description: 'The filter ID to delete' },
      },
      required: ['filterId'],
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

export async function handleSettingsTool(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  try {
    const gmail = await getGmailClient();

    switch (name) {
      case 'gmail_get_vacation_responder': {
        const res = await gmail.users.settings.getVacation({ userId: 'me' });
        return { content: [{ type: 'text', text: JSON.stringify(res.data) }] };
      }

      case 'gmail_set_vacation_responder': {
        const res = await gmail.users.settings.updateVacation({
          userId: 'me',
          requestBody: {
            enableAutoReply: args.enableAutoReply as boolean,
            responseSubject: args.responseSubject as string | undefined,
            responseBodyPlainText: args.responseBodyPlainText as string | undefined,
            startTime: args.startTime as string | undefined,
            endTime: args.endTime as string | undefined,
          },
        });
        return { content: [{ type: 'text', text: JSON.stringify({ status: 'vacation responder updated', ...res.data }) }] };
      }

      case 'gmail_disable_vacation_responder': {
        const res = await gmail.users.settings.updateVacation({
          userId: 'me',
          requestBody: { enableAutoReply: false },
        });
        return { content: [{ type: 'text', text: JSON.stringify({ status: 'vacation responder disabled', ...res.data }) }] };
      }

      case 'gmail_list_filters': {
        const res = await gmail.users.settings.filters.list({ userId: 'me' });
        return { content: [{ type: 'text', text: JSON.stringify({ filters: res.data.filter ?? [] }) }] };
      }

      case 'gmail_create_filter': {
        const action = args.action as {
          addLabelIds?: string[];
          removeLabelIds?: string[];
          forward?: string;
        } | undefined;

        const res = await gmail.users.settings.filters.create({
          userId: 'me',
          requestBody: {
            criteria: {
              from: args.from as string | undefined,
              to: args.to as string | undefined,
              subject: args.subject as string | undefined,
              query: args.hasWords as string | undefined,
              negatedQuery: args.doesNotHaveWords as string | undefined,
              hasAttachment: args.hasAttachment as boolean | undefined,
            },
            action: action ? {
              addLabelIds: action.addLabelIds,
              removeLabelIds: action.removeLabelIds,
              forward: action.forward,
            } : undefined,
          },
        });
        return { content: [{ type: 'text', text: JSON.stringify({ id: res.data.id, status: 'filter created' }) }] };
      }

      case 'gmail_delete_filter': {
        await gmail.users.settings.filters.delete({
          userId: 'me',
          id: args.filterId as string,
        });
        return { content: [{ type: 'text', text: JSON.stringify({ status: 'filter deleted' }) }] };
      }

      default:
        return { isError: true, content: [{ type: 'text', text: `Unknown tool: ${name}` }] };
    }
  } catch (error) {
    return { isError: true, content: [{ type: 'text', text: formatApiError(error) }] };
  }
}
