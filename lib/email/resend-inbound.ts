import { logger } from '@/lib/logger';

// Where to forward inbound emails. Map recipient prefixes to Gmail.
export const FORWARD_MAP: Record<string, string> = {
  info: 'elevate4humanityedu@gmail.com',
  support: 'elevate4humanityedu@gmail.com',
  admissions: 'elevate4humanityedu@gmail.com',
  enrollment: 'elevate4humanityedu@gmail.com',
};
export const DEFAULT_FORWARD = 'elevate4humanityedu@gmail.com';

export interface ResendReceivedEmail {
  id: string;
  from: string;
  to: string[];
  subject: string;
  html: string | null;
  text: string | null;
  reply_to: string[];
}

/**
 * Fetch the full received email content from Resend's API.
 * Returns null if RESEND_API_KEY is not configured or the request fails.
 */
export async function fetchReceivedEmail(emailId: string): Promise<ResendReceivedEmail | null> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.warn('[Resend Inbound] RESEND_API_KEY not set — cannot fetch email body');
    return null;
  }

  const resp = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    logger.error('[Resend Inbound] Failed to fetch received email', { emailId, status: resp.status, body });
    return null;
  }

  return resp.json() as Promise<ResendReceivedEmail>;
}

/**
 * Resolve the forwarding destination from a list of recipient addresses.
 * Matches on the local-part prefix against FORWARD_MAP; falls back to DEFAULT_FORWARD.
 */
export function resolveForwardTarget(toAddresses: string[]): string {
  for (const addr of toAddresses) {
    const prefix = addr.split('@')[0]?.toLowerCase();
    if (prefix && FORWARD_MAP[prefix]) {
      return FORWARD_MAP[prefix];
    }
  }
  return DEFAULT_FORWARD;
}
