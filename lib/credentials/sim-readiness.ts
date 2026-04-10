// Server-only: computes and stamps sim readiness scores onto learner_credentials.
// Called before issuing a credential to surface pre-exam performance data.
import 'server-only';
import { getAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export interface SimReadiness {
  sim_attempts_total: number;
  sims_passed:        number;
  sims_available:     number;
  best_scores:        { sim_key: string; best_score: number | null; passed: boolean }[];
  readiness_pct:      number;
}

// Returns the learner's sim readiness for a given credential.
// readiness_pct = (sims_passed / sims_available) * 100
export async function getSimReadiness(
  learnerId: string,
  credentialId: string,
): Promise<SimReadiness | null> {
  const db = await getAdminClient();
  const { data, error } = await db.rpc('sim_readiness_score', {
    p_learner_id:   learnerId,
    p_credential_id: credentialId,
  });

  if (error) {
    logger.error('sim_readiness_score RPC error', error);
    return null;
  }

  return data as SimReadiness;
}

// Stamps the current sim readiness into learner_credentials.metadata.
// Call this when issuing or updating a credential record.
export async function stampSimReadiness(
  learnerCredentialId: string,
  learnerId: string,
  credentialId: string,
): Promise<void> {
  const readiness = await getSimReadiness(learnerId, credentialId);
  if (!readiness) return;

  const db = await getAdminClient();

  // Read existing metadata first to merge rather than overwrite.
  const { data: existing } = await db
    .from('learner_credentials')
    .select('metadata')
    .eq('id', learnerCredentialId)
    .single();

  const merged = {
    ...(existing?.metadata ?? {}),
    sim_readiness:            readiness,
    sim_readiness_stamped_at: new Date().toISOString(),
  };

  const { error } = await db
    .from('learner_credentials')
    .update({ metadata: merged })
    .eq('id', learnerCredentialId);

  if (error) {
    logger.error('stampSimReadiness update error', error);
  }
}
