/**
 * Server-side helper for calling /api/email/send with the internal secret.
 * Use this instead of calling the endpoint directly — it attaches the
 * x-internal-secret header required since the route was locked.
 *
 * Only call from server-side code (server actions, API routes, lib/).
 * Never import this in client components.
 */

import { logger } from '@/lib/logger';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export async function sendInternalEmail(payload: {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // In local dev without CRON_SECRET set, skip silently rather than crashing
    logger.warn('[sendInternalEmail] CRON_SECRET not set — email skipped');
    return { ok: false, error: 'CRON_SECRET not configured' };
  }

  try {
    const res = await fetch(`${SITE_URL}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': secret,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return res.ok ? { ok: true } : { ok: false, error: data.error ?? 'Send failed' };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
