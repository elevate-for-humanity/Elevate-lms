/**
 * GET /api/learner/apprenticeship
 *
 * Canonical registered-apprenticeship progress endpoint.
 * Barber (0030CB) is competency-based. OJL hours are retained as auditable
 * employment/training evidence, but they are not used as a fabricated fixed
 * completion denominator. Completion progress is driven by Appendix A
 * competencies plus verified RTI requirements.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/requireAuth';
import { createClient } from '@/lib/supabase/server';
import { RAPIDS_CONFIG } from '@/lib/compliance/rapids-config';

export const dynamic = 'force-dynamic';

const OJL_SOURCE_TYPES = ['ojl', 'host_shop', 'timeclock', 'manual'];

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const barber = RAPIDS_CONFIG.programs.barber;

    const { data: enrollment, error: enrollmentError } = await supabase
      .from('program_enrollments')
      .select('id, program_slug, status, rapids_status, rapids_id, host_shop_id, supervisor_id, transfer_hours, transfer_hours_verified')
      .or(`user_id.eq.${user.id},student_id.eq.${user.id}`)
      .eq('program_slug', barber.slug)
      .in('status', ['active', 'enrolled', 'in_progress', 'confirmed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (enrollmentError) throw enrollmentError;
    if (!enrollment) {
      return NextResponse.json({ error: 'Not an active Barber apprenticeship enrollment' }, { status: 404 });
    }

    const [competencyResult, rtiResult, hoursResult, rapidsResult] = await Promise.all([
      supabase
        .from('apprentice_competency_records')
        .select('competency_id, completed, date_completed, verified_by, verified_by_name, notes')
        .eq('enrollment_id', enrollment.id),
      supabase
        .from('barber_appendix_a_rti_progress')
        .select('requirement_title, required_hours, verified_hours, remaining_hours, pending_entries, requirement_met')
        .eq('enrollment_id', enrollment.id),
      supabase
        .from('hour_entries')
        .select('hours_claimed, accepted_hours, source_type, status, work_date, approved_by_user_id, host_shop_id')
        .eq('user_id', user.id)
        .eq('program_slug', barber.slug),
      supabase
        .from('rapids_registrations')
        .select('rapids_id, occupation_code, sponsor_id, registration_date, status')
        .eq('enrollment_id', enrollment.id)
        .maybeSingle(),
    ]);

    if (competencyResult.error) throw competencyResult.error;
    if (rtiResult.error) throw rtiResult.error;
    if (hoursResult.error) throw hoursResult.error;

    const competencyRows = competencyResult.data || [];
    const completedCompetencies = competencyRows.filter((row) => row.completed).length;
    const competencyPercent = Math.min(
      100,
      Math.round((completedCompetencies / barber.competencyCount) * 100),
    );

    const rtiRows = rtiResult.data || [];
    const verifiedRtiHours = rtiRows.reduce(
      (sum, row) => sum + Number(row.verified_hours || 0),
      0,
    );
    const remainingRtiHours = Math.max(
      0,
      barber.relatedInstructionHours - verifiedRtiHours,
    );
    const rtiComplete =
      rtiRows.length > 0 &&
      rtiRows.every((row) => row.requirement_met) &&
      verifiedRtiHours >= barber.relatedInstructionHours;

    const hourRows = hoursResult.data || [];
    const approvedOjlHours = hourRows
      .filter(
        (row) =>
          row.status === 'approved' && OJL_SOURCE_TYPES.includes(row.source_type),
      )
      .reduce(
        (sum, row) =>
          sum + Number(row.accepted_hours ?? row.hours_claimed ?? 0),
        0,
      );

    const rapids = rapidsResult.data || null;
    const competenciesComplete = completedCompetencies >= barber.competencyCount;
    const placementReady = Boolean(enrollment.host_shop_id && enrollment.supervisor_id);

    return NextResponse.json({
      success: true,
      enrollmentId: enrollment.id,
      learnerId: user.id,
      programSlug: enrollment.program_slug,
      status: enrollment.status,
      completionBasis: 'competency',
      config: {
        totalHoursRequired: null,
        ojlHoursRequired: null,
        rtiHoursRequired: barber.relatedInstructionHours,
        competencyCount: barber.competencyCount,
        rapidsProgramCode: barber.rapidsCode,
        apprenticeToMentorRatio: barber.apprenticeToMentorRatio,
        probationaryHours: barber.probationaryHours,
      },
      progress: {
        percentComplete: competencyPercent,
        competenciesComplete,
        rtiComplete,
        placementReady,
        programComplete: competenciesComplete && rtiComplete && placementReady,
      },
      hours: {
        ojl: {
          required: null,
          approved: approvedOjlHours,
          purpose: 'auditable supervised work record; not the completion denominator for this competency-based occupation',
        },
        rti: {
          required: barber.relatedInstructionHours,
          verified: verifiedRtiHours,
          remaining: remainingRtiHours,
          requirements: rtiRows,
        },
      },
      competencyTracking: {
        totalRequired: barber.competencyCount,
        verified: completedCompetencies,
        remaining: Math.max(0, barber.competencyCount - completedCompetencies),
        percentComplete: competencyPercent,
        signoffs: competencyRows,
      },
      placement: {
        hostShopId: enrollment.host_shop_id,
        supervisorId: enrollment.supervisor_id,
        requiredRatio: barber.apprenticeToMentorRatio,
      },
      transferCredit: {
        hours: Number(enrollment.transfer_hours || 0),
        verified: Boolean(enrollment.transfer_hours_verified),
        note: 'Transfer credit is retained as approved prior-experience evidence and does not replace Appendix A competency or RTI completion.',
      },
      rapids: rapids || {
        rapids_id: enrollment.rapids_id,
        status: enrollment.rapids_status || 'pending',
        occupation_code: barber.rapidsCode,
        sponsor_id: RAPIDS_CONFIG.registrationId,
      },
    });
  } catch (error) {
    console.error('[Apprenticeship API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load apprenticeship data' },
      { status: 500 },
    );
  }
}
