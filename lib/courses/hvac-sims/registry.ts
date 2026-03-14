// Server-only: enriches static sim content with DB metadata (difficulty,
// passing_score, credential_id, version). Call from server components or
// API routes — never from client components or the static loader.
import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { LOADED_SIMS } from './loader';
import type { TroubleshootingSim } from './schema';

export interface SimWithMeta extends TroubleshootingSim {
  db_id:          string;
  difficulty:     'beginner' | 'intermediate' | 'advanced';
  passing_score:  number;
  credential_id:  string | null;
  version:        number;
  is_active:      boolean;
}

// Returns all active sims merged with DB metadata.
// Falls back to JSON-only data if the DB row is missing (safe for local dev).
export async function getSimsWithMeta(): Promise<SimWithMeta[]> {
  const db = createAdminClient();
  const { data: rows } = await db
    .from('training_simulations')
    .select('id, sim_key, difficulty, passing_score, credential_id, version, is_active')
    .eq('is_active', true)
    .order('sort_order');

  const metaByKey = new Map((rows ?? []).map((r: any) => [r.sim_key, r]));

  return LOADED_SIMS.map((sim): SimWithMeta => {
    const meta = metaByKey.get(sim.id);
    return {
      ...sim,
      db_id:         meta?.id          ?? '',
      difficulty:    meta?.difficulty   ?? 'intermediate',
      passing_score: meta?.passing_score ?? 70,
      credential_id: meta?.credential_id ?? null,
      version:       meta?.version       ?? 1,
      is_active:     meta?.is_active     ?? true,
    };
  });
}

// Returns a single sim with metadata by sim_key (e.g. 'sim-07').
export async function getSimWithMeta(simKey: string): Promise<SimWithMeta | undefined> {
  const sims = await getSimsWithMeta();
  return sims.find((s) => s.id === simKey);
}
