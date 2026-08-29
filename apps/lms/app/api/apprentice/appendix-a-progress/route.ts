import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getRegisteredProgramStandard, resolveRegisteredProgramContract } from '@/lib/apprenticeship/registered-program-contract';
import { resolvePortalPreviewSubject } from '@/lib/admin/portal-preview';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const db = await requireAdminClient();
  const subject = await resolvePortalPreviewSubject(db, user?.id);
  if (!subject.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: enrollments, error } = await db.from('program_enrollments')
    .select('id, user_id, program_id, program_slug, status, created_at')
    .eq('user_id', subject.userId).in('status', ['active', 'enrolled', 'in_progress']).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const enrollment = (enrollments || []).find((row: any) => getRegisteredProgramStandard(row.program_slug));
  if (!enrollment) return NextResponse.json({ enrollment: null, standard: null, records: [], rtiProviders: [] });

  const contract = await resolveRegisteredProgramContract(db, { programSlug: enrollment.program_slug, enrollmentId: enrollment.id });
  if (!contract) return NextResponse.json({ enrollment: null, standard: null, records: [], rtiProviders: [] });

  const { data: records, error: recordError } = await db.from('apprentice_competency_records')
    .select('id, enrollment_id, competency_id, completed, date_completed, verified_by_name, notes, requires_practical_evidence, performance_subject, evidence_type, evidence_url, practical_performed_at, evidence_review_status, verified_by_license_number, state_authority, state_standard_version, state_requirement_citation, updated_at')
    .eq('enrollment_id', enrollment.id).order('updated_at', { ascending: false });
  if (recordError) return NextResponse.json({ error: recordError.message }, { status: 500 });

  return NextResponse.json({
    enrollment: { id: enrollment.id, programSlug: enrollment.program_slug },
    standard: contract.standard,
    completion: contract.completion,
    sponsor: contract.sponsor,
    employer: contract.employer,
    rtiProviders: contract.rtiProviders,
    records: records || [],
    completedCompetencies: (records || []).filter((row: any) => row.completed).length,
  });
}
