/**
 * POST /api/accreditation/report
 *
 * Generates the accreditation report JSON downloaded by the
 * /accreditation/report page: standards, evidence, and outcome counts
 * assembled live from production data.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return safeError('Unauthorized', 401);

  const db = await requireAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return safeError('Forbidden', 403);
  }

  const [standards, evidence, enrollments, certificates, completions, programs] =
    await Promise.all([
      db.from('accreditation_standards').select('*').order('created_at', { ascending: true }),
      db.from('accreditation_evidence').select('id, standard_id, created_at'),
      db.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      db.from('certificates').select('id', { count: 'exact', head: true }),
      db.from('completions').select('id', { count: 'exact', head: true }),
      db.from('programs').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ]);

  if (standards.error) return safeInternalError(standards.error, 'Failed to load standards');
  if (evidence.error) return safeInternalError(evidence.error, 'Failed to load evidence');

  const evidenceByStandard = new Map<string, number>();
  for (const e of evidence.data ?? []) {
    if (e.standard_id) {
      evidenceByStandard.set(e.standard_id, (evidenceByStandard.get(e.standard_id) ?? 0) + 1);
    }
  }

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    generated_by: user.id,
    summary: {
      standards: (standards.data ?? []).length,
      evidence_items: (evidence.data ?? []).length,
      active_enrollments: enrollments.count ?? 0,
      certificates_issued: certificates.count ?? 0,
      completions: completions.count ?? 0,
      active_programs: programs.count ?? 0,
    },
    standards: (standards.data ?? []).map((s: Record<string, unknown>) => ({
      ...s,
      evidence_count: evidenceByStandard.get(String(s.id)) ?? 0,
    })),
  });
}
