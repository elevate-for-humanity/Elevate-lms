/**
 * External credential verification service
 *
 * Provider abstraction so future authorities can be added without changing
 * call sites. Each provider implements VerificationProvider.
 *
 * Current providers:
 *   - comptia: CompTIA CertMetrics verification API
 *   - manual:  Falls back to stored verification_url (human-click)
 *
 * Verification results are stored on learner_credentials:
 *   last_verified_at, verification_source, external_verification_id
 *
 * Never block user-facing flows on this — call async or from job queue.
 */

import { logger } from '@/lib/logger';

export type VerificationStatus = 'verified' | 'not_found' | 'expired' | 'revoked' | 'error';

export interface VerificationResult {
  status: VerificationStatus;
  verified_at?: string;
  external_id?: string;
  expiry_date?: string;
  raw?: Record<string, unknown>;
  error?: string;
}

export interface VerificationProvider {
  name: string;
  verify(params: VerifyParams): Promise<VerificationResult>;
}

export interface VerifyParams {
  recipient_email: string;
  credential_name: string;       // e.g. "CompTIA A+"
  credential_abbreviation?: string; // e.g. "A+"
  external_id?: string;          // cert number if known
}

// =============================================================================
// CompTIA CertMetrics provider
// Docs: https://certmetrics.com/comptia/public/verify.aspx
// CompTIA provides a public verification endpoint — no API key required for
// basic lookups. For bulk/automated use, a partner agreement is recommended.
// =============================================================================
const CompTIAProvider: VerificationProvider = {
  name: 'comptia',

  async verify(params: VerifyParams): Promise<VerificationResult> {
    // CompTIA public verification URL (form-based, no JSON API publicly documented)
    // For production: use CompTIA's partner API if available, or scrape the
    // verification page. This implementation uses the public lookup endpoint.
    const verifyUrl = 'https://certmetrics.com/comptia/public/verify.aspx';

    try {
      // Build form data for CompTIA verification
      const formData = new URLSearchParams({
        code: params.external_id ?? '',
        email: params.recipient_email,
      });

      const res = await fetch(verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        return { status: 'error', error: `CompTIA verification returned ${res.status}` };
      }

      const html = await res.text();

      // Parse response — CompTIA returns HTML with verification result
      if (html.includes('Certification Verified') || html.includes('verified')) {
        // Extract expiry if present
        const expiryMatch = html.match(/Expir(?:es|ation)[^:]*:\s*([A-Za-z]+ \d{1,2},? \d{4})/i);
        return {
          status: 'verified',
          verified_at: new Date().toISOString(),
          expiry_date: expiryMatch?.[1],
          raw: { source: 'comptia_certmetrics' },
        };
      }

      if (html.includes('not found') || html.includes('No records')) {
        return { status: 'not_found' };
      }

      if (html.includes('expired') || html.includes('Expired')) {
        return { status: 'expired' };
      }

      // Inconclusive — treat as error so caller can fall back to manual
      return { status: 'error', error: 'CompTIA response inconclusive' };
    } catch (err: any) {
      if (err?.name === 'TimeoutError') {
        return { status: 'error', error: 'CompTIA verification timed out' };
      }
      logger.error('CompTIA verification threw', { error: err?.message });
      return { status: 'error', error: 'Network error contacting CompTIA' };
    }
  },
};

// =============================================================================
// Manual fallback provider — returns a link for human verification
// =============================================================================
const ManualProvider: VerificationProvider = {
  name: 'manual',
  async verify(_params: VerifyParams): Promise<VerificationResult> {
    return {
      status: 'error',
      error: 'Manual verification required — use verification_url',
    };
  },
};

// =============================================================================
// Registry — add new providers here
// =============================================================================
const PROVIDERS: Record<string, VerificationProvider> = {
  comptia: CompTIAProvider,
  manual: ManualProvider,
};

/**
 * Verify a credential using the appropriate provider.
 * Falls back to 'manual' if the provider is unknown.
 */
export async function verifyCredential(
  providerName: string,
  params: VerifyParams
): Promise<VerificationResult> {
  const provider = PROVIDERS[providerName.toLowerCase()] ?? ManualProvider;

  logger.info('Verifying credential', {
    provider: provider.name,
    credential: params.credential_name,
    email: params.recipient_email,
  });

  return provider.verify(params);
}

/**
 * List available verification providers.
 */
export function listVerificationProviders(): string[] {
  return Object.keys(PROVIDERS);
}
