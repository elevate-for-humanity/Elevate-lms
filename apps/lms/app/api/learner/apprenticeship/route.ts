/**
 * GET /api/learner/apprenticeship
 * 
 * Returns apprenticeship progress for apprentice enrollments.
 * Only available for enrollment_type = 'apprentice'
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/requireAuth';
import { createClient } from '@/lib/supabase/server';
import { loadBlueprintWithProgram } from '@/lib/course-factory/blueprint-loader';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (authError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = await createClient();
    const { data: enrollment } = await supabase.from('enrollments').select('*, courses(*)').eq('user_id', user!.id).eq('enrollment_type', 'apprentice').eq('status', 'active').single();
    if (!enrollment) return NextResponse.json({ error: 'Not an apprentice enrollment' }, { status: 404 });
    const blueprint = await loadBlueprintWithProgram(supabase, { programId: enrollment.courses.program_id });
    if (!blueprint?.apprenticeshipConfig) return NextResponse.json({ error: 'Apprenticeship not supported for this program' }, { status: 400 });
    const config = blueprint.apprenticeshipConfig;
    const [rtiHoursData, ojlHoursData, evaluationsData, signoffsData, rapidsData] = await Promise.all([
      supabase.from('rti_hours').select('*').eq('enrollment_id', enrollment.id).order('activity_date', { ascending: false }),
      supabase.from('ojl_hours').select('*').eq('enrollment_id', enrollment.id).order('activity_date', { ascending: false }),
      supabase.from('employer_evaluations').select('*, profiles(full_name)').eq('enrollment_id', enrollment.id).order('period_end', { ascending: false }),
      supabase.from('skill_signoffs').select('*').eq('enrollment_id', enrollment.id),
      supabase.from('rapids_reporting').select('*').eq('enrollment_id', enrollment.id).single()
    ]);
    const rtiCompleted = (rtiHoursData.data || []).reduce((sum: number, h: Record<string, unknown>) => sum + (h.hours as number || 0), 0);
    const ojlCompleted = (ojlHoursData.data || []).reduce((sum: number, h: Record<string, unknown>) => sum + (h.hours as number || 0), 0);
    const verified = signoffsData.data?.filter((s: Record<string, unknown>) => s.signed_off).length || 0;
    return NextResponse.json({ success: true, enrollmentId: enrollment.id, learnerId: user!.id, programSlug: enrollment.courses.program_slug, status: enrollment.status, config: { totalHoursRequired: config.totalHours, rtiHoursRequired: config.rtiHours, ojlHoursRequired: config.ojlHours, competencyCount: config.competencyCount, rapidsProgramCode: config.rapidsProgramCode }, hours: { total: { required: config.totalHours, completed: rtiCompleted + ojlCompleted, remaining: config.totalHours - (rtiCompleted + ojlCompleted), percentComplete: Math.round(((rtiCompleted + ojlCompleted) / config.totalHours) * 100) }, rti: { required: config.rtiHours, completed: rtiCompleted }, ojl: { required: config.ojlHours, completed: ojlCompleted } }, competencyTracking: { totalRequired: config.competencyCount, verified, signoffs: signoffsData.data || [] }, employerEvaluations: evaluationsData.data || [], rapids: rapidsData.data || null });
  } catch (error) {
    console.error('[Apprenticeship API] Error:', error);
    return NextResponse.json({ error: 'Failed to load apprenticeship data' }, { status: 500 });
  }
}
