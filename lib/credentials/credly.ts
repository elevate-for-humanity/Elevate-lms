/**
 * Credly badge issuance service
 *
 * Wraps the Credly v1 API for issuing Open Badges to learners.
 * Badge issuance is enqueued via job_queue rather than called inline
 * to avoid blocking user-facing flows on third-party latency.
 *
 * Required env vars:
 *   CREDLY_API_KEY          — Credly API key (Bearer token)
 *   CREDLY_ORGANIZATION_ID  — Credly organization slug/ID
 *
 * Docs: https://www.credly.com/docs/issuing_badges
 */

import { logger } from '@/lib/logger';

const CREDLY_BASE = 'https://api.credly.com/v1';

export interface CredlyIssuanceParams {
  badge_template_id: string;   // Credly badge template ID (from credentials.credly_badge_template_id)
  recipient_email: string;
  recipient_name: string;
  issued_at?: string;          // ISO date string, defaults to now
  expires_at?: string;         // ISO date string, null = no expiry
  locale?: string;
}

export interface CredlyIssuanceResult {
  success: boolean;
  badge_url?: string;
  credly_id?: string;
  error?: string;
}

/**
 * Issue a single badge via Credly API.
 * Returns success/failure — caller is responsible for retry logic via job queue.
 */
export async function issueCredlyBadge(
  params: CredlyIssuanceParams
): Promise<CredlyIssuanceResult> {
  const apiKey = process.env.CREDLY_API_KEY;
  const orgId  = process.env.CREDLY_ORGANIZATION_ID;

  if (!apiKey || !orgId) {
    logger.warn('Credly credentials not configured — badge issuance skipped');
    return { success: false, error: 'Credly not configured' };
  }

  const body = {
    badge_template_id: params.badge_template_id,
    issued_to_first_name: params.recipient_name.split(' ')[0] ?? params.recipient_name,
    issued_to_last_name:  params.recipient_name.split(' ').slice(1).join(' ') || '-',
    issued_to_email:      params.recipient_email,
    issued_at:            params.issued_at ?? new Date().toISOString().split('T')[0],
    expires_at:           params.expires_at ?? null,
    locale:               params.locale ?? 'en',
  };

  try {
    const res = await fetch(
      `${CREDLY_BASE}/organizations/${orgId}/badges`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      logger.error('Credly badge issuance failed', { status: res.status, body: text });
      return { success: false, error: `Credly API error: ${res.status}` };
    }

    const data = await res.json();
    const issued = data?.data;

    return {
      success: true,
      badge_url: issued?.badge_url ?? issued?.image?.url,
      credly_id: issued?.id,
    };
  } catch (err: any) {
    logger.error('Credly badge issuance threw', { error: err?.message });
    return { success: false, error: 'Network error contacting Credly' };
  }
}

/**
 * Revoke a previously issued Credly badge.
 * Used when learner_credentials.status transitions to 'revoked'.
 */
export async function revokeCredlyBadge(
  credly_badge_id: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.CREDLY_API_KEY;
  const orgId  = process.env.CREDLY_ORGANIZATION_ID;

  if (!apiKey || !orgId) {
    return { success: false, error: 'Credly not configured' };
  }

  try {
    const res = await fetch(
      `${CREDLY_BASE}/organizations/${orgId}/badges/${credly_badge_id}/revoke`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: reason ?? 'Revoked by platform administrator' }),
      }
    );

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      logger.error('Credly badge revocation failed', { status: res.status, body: text });
      return { success: false, error: `Credly API error: ${res.status}` };
    }

    return { success: true };
  } catch (err: any) {
    logger.error('Credly badge revocation threw', { error: err?.message });
    return { success: false, error: 'Network error contacting Credly' };
  }
}
