import type { SupabaseClient } from '@supabase/supabase-js';
// CI re-trigger: the push to 34f4d17a created no workflow runs for this head; this comment-only commit re-runs the full check suite on the current branch.
import { ACHIEVE_HOLDER_ID } from './achieve-holder';

export async function programHolderReferralsReady(
  db: SupabaseClient,
  holderId: string,
  holder?: { features?: unknown; mou_signed?: boolean | null } | null,
): Promise<boolean> {
  if (holderId !== ACHIEVE_HOLDER_ID) return true;
  if (holder === undefined) {
    const { data, error } = await db.from('program_holders')
      .select('features,mou_signed').eq('id', holderId).maybeSingle();
    if (error) return false;
    holder = data;
  }
  if (!holder?.mou_signed) return false;
  const { data, error } = await db.rpc('achieve_cna_referral_ready_v1', {
    p_features: holder.features ?? null, p_mou_signed: true,
  });
  return !error && data === true;
}
