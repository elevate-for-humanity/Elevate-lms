import type { SupabaseClient } from '@supabase/supabase-js';

export type LearnerCredentialSignal = {
  name: string;
  source: 'user_certifications' | 'certifications' | 'credentials_attained' | 'user_credentials';
  issuedAt?: string | null;
  expiresAt?: string | null;
};

function normalize(value: unknown) {
  return String(value || '').trim();
}

function addUnique(target: LearnerCredentialSignal[], signal: LearnerCredentialSignal) {
  const name = normalize(signal.name);
  if (!name) return;
  const key = name.toLowerCase();
  if (target.some((item) => item.name.toLowerCase() === key)) return;
  target.push({ ...signal, name });
}

/**
 * Read-only compatibility authority for career matching.
 *
 * Credential issuance is still owned by the existing credential/certificate
 * services. This adapter prevents career features from treating one legacy
 * table as the sole truth while credential consolidation is completed.
 */
export async function getLearnerCredentialSignals(
  supabase: SupabaseClient,
  userId: string,
): Promise<LearnerCredentialSignal[]> {
  const [userCerts, certifications, attained, credentials] = await Promise.all([
    supabase
      .from('user_certifications')
      .select('certification_name, certification_type, earned_date, status')
      .eq('user_id', userId)
      .eq('status', 'active'),
    supabase
      .from('certifications')
      .select('name, credential_id, issue_date, expiry_date, is_active')
      .eq('user_id', userId)
      .eq('is_active', true),
    supabase
      .from('credentials_attained')
      .select('credential, issue_date')
      .eq('user_id', userId),
    supabase
      .from('user_credentials')
      .select('credential_id, awarded_at, expires_at, status')
      .eq('user_id', userId)
      .eq('status', 'active'),
  ]);

  const signals: LearnerCredentialSignal[] = [];

  for (const row of userCerts.data || []) {
    addUnique(signals, {
      name: normalize(row.certification_name || row.certification_type),
      source: 'user_certifications',
      issuedAt: row.earned_date,
    });
  }

  for (const row of certifications.data || []) {
    addUnique(signals, {
      name: normalize(row.name || row.credential_id),
      source: 'certifications',
      issuedAt: row.issue_date,
      expiresAt: row.expiry_date,
    });
  }

  for (const row of attained.data || []) {
    addUnique(signals, {
      name: normalize(row.credential),
      source: 'credentials_attained',
      issuedAt: row.issue_date,
    });
  }

  for (const row of credentials.data || []) {
    addUnique(signals, {
      name: normalize(row.credential_id),
      source: 'user_credentials',
      issuedAt: row.awarded_at,
      expiresAt: row.expires_at,
    });
  }

  const now = Date.now();
  return signals.filter((signal) => !signal.expiresAt || new Date(signal.expiresAt).getTime() >= now);
}
