import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

/**
 * Read ssn_last4 for a user from the isolated secure_identity table.
 * Uses service_role client — caller must verify authorization.
 */
export async function getSSNLast4(userId: string): Promise<string | null> {
  const db = createAdminClient();
  if (!db) return null;

  const { data, error } = await db
    .from('secure_identity')
    .select('ssn_last4')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data.ssn_last4;
}

/**
 * Store ssn_last4 (and optionally ssn_hash) for a user.
 * Upserts into secure_identity table.
 */
export async function storeSSNData(
  userId: string,
  ssnLast4: string,
  ssnHash?: string
): Promise<boolean> {
  const db = createAdminClient();
  if (!db) return false;

  const { error } = await db
    .from('secure_identity')
    .upsert(
      {
        user_id: userId,
        ssn_last4: ssnLast4,
        ...(ssnHash ? { ssn_hash: ssnHash } : {}),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    logger.error('[SecureIdentity] Store failed', error);
    return false;
  }
  return true;
}

/**
 * Check if a user has SSN on file (without revealing the value).
 */
export async function hasSSNOnFile(userId: string): Promise<boolean> {
  const db = createAdminClient();
  if (!db) return false;

  const { data } = await db
    .from('secure_identity')
    .select('ssn_last4')
    .eq('user_id', userId)
    .single();

  return !!(data?.ssn_last4);
}
