import type { SupabaseClient } from '@supabase/supabase-js';
import type { TenantSiteClaim } from '@/lib/tenant/site-types';

type WebsiteClaimRow = {
  claim_key: string;
  claim_text: string;
  claim_value: unknown;
  evidence_reference: string | null;
  evidence_url: string | null;
  verified_at: string | null;
};

export async function loadVerifiedWebsiteClaims(
  db: SupabaseClient<any>,
  websiteId: string,
): Promise<TenantSiteClaim[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await db
    .from('website_claim_registry')
    .select('claim_key,claim_text,claim_value,evidence_reference,evidence_url,verified_at')
    .eq('website_id', websiteId)
    .eq('status', 'verified')
    .eq('public_claim_allowed', true)
    .or(`valid_from.is.null,valid_from.lte.${today}`)
    .or(`valid_through.is.null,valid_through.gte.${today}`);
  if (error) throw error;

  return ((data ?? []) as WebsiteClaimRow[]).map((claim) => ({
    key: claim.claim_key,
    text: claim.claim_text,
    value: claim.claim_value,
    source: claim.evidence_url || claim.evidence_reference,
    verifiedAt: claim.verified_at,
    status: 'verified' as const,
  }));
}
