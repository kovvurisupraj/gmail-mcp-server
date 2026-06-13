import { messageToolDefinitions, handleMessageTool } from './messages.js';
import { draftToolDefinitions, handleDraftTool } from './drafts.js';
import { labelToolDefinitions, handleLabelTool } from './labels.js';
import { searchToolDefinitions, handleSearchTool } from './search.js';
import { attachmentToolDefinitions, handleAttachmentTool } from './attachments.js';
import { settingsToolDefinitions, handleSettingsTool } from './settings.js';
import { getGmailClient } from '../auth.js';
import { startSetupServer } from '../setup/server.js';

export const allToolDefinitions = [
  ...messageToolDefinitions,
  ...draftToolDefinitions,
  ...labelToolDefinitions,
  ...searchToolDefinitions,
  ...attachmentToolDefinitions,
  ...settingsToolDefinitions,
];

const messageToolNames = new Set(messageToolDefinitions.map(t => t.name));
const draftToolNames = new Set(draftToolDefinitions.map(t => t.name));
const labelToolNames = new Set(labelToolDefinitions.map(t => t.name));
const searchToolNames = new Set(searchToolDefinitions.map(t => t.name));
const attachmentToolNames = new Set(attachmentToolDefinitions.map(t => t.name));
const settingsToolNames = new Set(settingsToolDefinitions.map(t => t.name));

type ToolResult = { content: Array<{ type: string; text: string }>; isError?: boolean };

export async function dispatchTool(
  name: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  // Pre-flight: verify auth before routing to any tool handler.
  // Intercepts setup/auth errors and returns user-friendly guidance
  // without modifying any individual tool file.
  try {
    await getGmailClient();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    if (message === 'SETUP_REQUIRED') {
      startSetupServer().catch(() => { /* fire-and-forget; ignore if already running */ });
      return {
        content: [{
          type: 'text',
          text: '⚙️ Gmail MCP Server needs setup. I\'ve opened a setup page in your browser. Follow the instructions there, then come back and try again.',
        }],
        isError: false,
      };
    }

    if (message.startsWith('AUTH_REQUIRED')) {
      startSetupServer().catch(() => { /* fire-and-forget */ });
      return {
        content: [{
          type: 'text',
          text: '🔐 No Gmail account connected yet. I\'ve opened the sign-in page in your browser. Sign in with your Gmail account, then come back and try again.',
        }],
        isError: false,
      };
    }

    if (message.includes('Multiple accounts')) {
      return {
        content: [{
          type: 'text',
          text: `📬 ${message}\n\nAdd GMAIL_ACCOUNT to your Claude Desktop config env block.`,
        }],
        isError: false,
      };
    }

    return {
      isError: true,
      content: [{ type: 'text', text: message }],
    };
  }

  // Route to the appropriate handler (each handler calls getGmailClient internally)
  if (messageToolNames.has(name)) return handleMessageTool(name, args);
  if (draftToolNames.has(name)) return handleDraftTool(name, args);
  if (labelToolNames.has(name)) return handleLabelTool(name, args);
  if (searchToolNames.has(name)) return handleSearchTool(name, args);
  if (attachmentToolNames.has(name)) return handleAttachmentTool(name, args);
  if (settingsToolNames.has(name)) return handleSettingsTool(name, args);

  return {
    isError: true,
    content: [{ type: 'text', text: `Unknown tool: ${name}` }],
  };
}
