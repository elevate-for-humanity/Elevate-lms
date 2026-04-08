/**
 * Email client shim — routes through SendGrid.
 * Maintains the same API shape as the old Resend client so existing
 * callers (import { resend } from '@/lib/resend') work unchanged.
 */
export const resend = {
  emails: {
    send: async (data: { from: string; to: string | string[]; subject: string; html?: string; text?: string }) => {
      // Hydrate secrets from Supabase app_secrets before reading env vars.
      // This is a no-op after the first call (cached for 5 min).
      const { hydrateProcessEnv } = await import('@/lib/secrets');
      await hydrateProcessEnv();

      const apiKey = process.env.SENDGRID_API_KEY;
      if (!apiKey) throw new Error('SENDGRID_API_KEY not configured');

      const toArr = Array.isArray(data.to) ? data.to : [data.to];
      const fromParsed = parseFrom(data.from);

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          personalizations: [{ to: toArr.map((email) => ({ email })) }],
          from: fromParsed,
          subject: data.subject,
          content: [
            ...(data.text ? [{ type: 'text/plain', value: data.text }] : []),
            ...(data.html ? [{ type: 'text/html', value: data.html }] : []),
          ],
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`SendGrid error ${response.status}: ${JSON.stringify(err)}`);
      }

      // SendGrid returns 202 with empty body; return a compatible shape
      return { id: `sg_${Date.now()}` };
    },
  },
};

function parseFrom(from: string): { email: string; name?: string } {
  const match = from.match(/^(.+?)\s*<(.+?)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { email: from };
}

/**
 * Resend SDK compatibility shim.
 * Files that `import { Resend } from 'resend'` and `new Resend(key)` will
 * be caught at build time. Those files should be migrated to use
 * `import { resend } from '@/lib/resend'` or `import { sendEmail } from '@/lib/email/sendgrid'`.
 */
