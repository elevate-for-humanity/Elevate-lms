import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getAppendixAStandard } from '@/lib/compliance/appendix-a-standards';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await requireAdminClient();
  const { data: enrollments, error } = await db
    .from('program_enrollments')
    .select('id, user_id, program_id, program_slug, status, created_at')
    .eq('user_id', user.id)
    .in('status', ['active', 'enrolled', 'in_progress'])
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const enrollment = (enrollments || []).find((row: any) => getAppendixAStandard(row.program_slug));
  if (!enrollment) return NextResponse.json({ enrollment: null, standard: null, records: [] });

  const standard = getAppendixAStandard(enrollment.program_slug);
  const { data: records, error: recordError } = await db
    .from('apprentice_competency_records')
    .select('id, enrollment_id, competency_id, completed, date_completed, verified_by_name, notes, updated_at')
    .eq('enrollment_id', enrollment.id)
    .order('updated_at', { ascending: false });

  if (recordError) return NextResponse.json({ error: recordError.message }, { status: 500 });

  const completedCompetencies = (records || []).filter((row: any) => row.completed).length;
  return NextResponse.json({
    enrollment: {
      id: enrollment.id,
      programSlug: enrollment.program_slug,
    },
    standard,
    records: records || [],
    completedCompetencies,
  });
}
