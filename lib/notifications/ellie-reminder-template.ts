import type { EmailTemplate } from './templates';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function getEllieReminderTemplate(data: Record<string, unknown>): EmailTemplate {
  const recipientName = typeof data.recipient_name === 'string' && data.recipient_name.trim()
    ? data.recipient_name.trim()
    : 'there';
  const message = typeof data.message === 'string' ? data.message.trim() : '';
  const safeName = escapeHtml(recipientName);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');

  return {
    subject: 'Action needed on your Elevate record',
    html: `<!doctype html><html><body style="font-family:Arial,sans-serif;line-height:1.6;color:#222"><p>Hi ${safeName},</p><p>${safeMessage}</p><p>If you have already completed this step, no additional action is needed while your record updates.</p></body></html>`,
    text: `Hi ${recipientName},\n\n${message}\n\nIf you have already completed this step, no additional action is needed while your record updates.`,
  };
}
