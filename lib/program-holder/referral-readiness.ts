import type { SupabaseClient } from '@supabase/supabase-js';
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
