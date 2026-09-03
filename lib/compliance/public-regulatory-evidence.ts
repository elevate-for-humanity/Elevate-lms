import 'server-only';
import { requireAdminClient } from '@/lib/supabase/admin';

export type PublicRegulatoryEvidence = {
  slug: string;
  title: string;
  jurisdiction: string;
  authority: string;
  statusType: string;
  statusValue: string;
  sourceReference: string | null;
  sourceUrl: string | null;
  effectiveDate: string | null;
  expirationDate: string | null;
  verifiedAt: string | null;
};

/**
 * Public approval claims are data, not marketing constants.
 * Only rows explicitly approved for public claims are returned.
 */
export async function listPublicRegulatoryEvidence(): Promise<PublicRegulatoryEvidence[]> {
  const db = await requireAdminClient();
  const { data, error } = await db
    .from('program_regulatory_status')
    .select('jurisdiction, authority, status_type, status_value, source_reference, source_url, effective_date, expiration_date, verified_at, programs!inner(slug,title)')
    .eq('public_claim_allowed', true)
    .order('authority', { ascending: true })
    .order('status_type', { ascending: true });

  if (error) throw new Error(`PUBLIC_REGULATORY_EVIDENCE_FAILED:${error.message}`);

  return (data ?? []).flatMap((row: any) => {
    const program = Array.isArray(row.programs) ? row.programs[0] : row.programs;
    if (!program?.slug || !program?.title) return [];
    return [{
      slug: String(program.slug),
      title: String(program.title),
      jurisdiction: String(row.jurisdiction ?? ''),
      authority: String(row.authority ?? ''),
      statusType: String(row.status_type ?? ''),
      statusValue: String(row.status_value ?? ''),
      sourceReference: row.source_reference ?? null,
      sourceUrl: row.source_url ?? null,
      effectiveDate: row.effective_date ?? null,
      expirationDate: row.expiration_date ?? null,
      verifiedAt: row.verified_at ?? null,
    }];
  });
}
