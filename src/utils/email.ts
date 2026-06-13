import { gmail_v1 } from 'googleapis';

export interface EmailHeaders {
  to: string;
  subject: string;
  from?: string;
  cc?: string;
  bcc?: string;
  'In-Reply-To'?: string;
  References?: string;
  'Content-Type'?: string;
}

export function encodeEmail(
  headers: EmailHeaders,
  body: string,
  isHtml: boolean
): string {
  const contentType = isHtml ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8';
  const effectiveContentType = headers['Content-Type'] ?? contentType;

  const headerLines = [
    `To: ${headers.to}`,
    `Subject: ${headers.subject}`,
  ];

  if (headers.from) headerLines.push(`From: ${headers.from}`);
  if (headers.cc) headerLines.push(`Cc: ${headers.cc}`);
  if (headers.bcc) headerLines.push(`Bcc: ${headers.bcc}`);
  if (headers['In-Reply-To']) headerLines.push(`In-Reply-To: ${headers['In-Reply-To']}`);
  if (headers.References) headerLines.push(`References: ${headers.References}`);

  headerLines.push(`Content-Type: ${effectiveContentType}`);
  headerLines.push('MIME-Version: 1.0');

  const message = headerLines.join('\r\n') + '\r\n\r\n' + body;

  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function parseHeaders(
  headers: gmail_v1.Schema$MessagePartHeader[] | undefined | null
): Record<string, string> {
  const result: Record<string, string> = {};
  if (!headers) return result;
  for (const h of headers) {
    if (h.name && h.value) {
      result[h.name.toLowerCase()] = h.value;
    }
  }
  return result;
}

export function extractBody(
  payload: gmail_v1.Schema$MessagePart | undefined | null
): string {
  if (!payload) return '';

  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8');
  }

  if (payload.parts) {
    // Prefer text/plain in multipart/alternative
    if (payload.mimeType === 'multipart/alternative') {
      const plainPart = payload.parts.find(p => p.mimeType === 'text/plain');
      if (plainPart) return extractBody(plainPart);
    }

    // Search recursively through all parts
    for (const part of payload.parts) {
      const text = extractBody(part);
      if (text) return text;
    }
  }

  return '';
}

export function extractHtmlBody(
  payload: gmail_v1.Schema$MessagePart | undefined | null
): string {
  if (!payload) return '';

  if (payload.mimeType === 'text/html' && payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8');
  }

  if (payload.parts) {
    // Prefer text/html in multipart/alternative
    if (payload.mimeType === 'multipart/alternative') {
      const htmlPart = payload.parts.find(p => p.mimeType === 'text/html');
      if (htmlPart) return extractHtmlBody(htmlPart);
    }

    for (const part of payload.parts) {
      const html = extractHtmlBody(part);
      if (html) return html;
    }
  }

  return '';
}

export interface AttachmentMeta {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
}

export function extractAttachmentMeta(
  payload: gmail_v1.Schema$MessagePart | undefined | null
): AttachmentMeta[] {
  const attachments: AttachmentMeta[] = [];

  function walk(part: gmail_v1.Schema$MessagePart): void {
    if (
      part.filename &&
      part.filename.length > 0 &&
      part.body?.attachmentId
    ) {
      attachments.push({
        id: part.body.attachmentId,
        filename: part.filename,
        mimeType: part.mimeType ?? 'application/octet-stream',
        size: part.body.size ?? 0,
      });
    }
    if (part.parts) {
      for (const child of part.parts) {
        walk(child);
      }
    }
  }

  if (payload) walk(payload);
  return attachments;
}
