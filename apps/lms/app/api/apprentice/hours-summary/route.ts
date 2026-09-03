import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getErrorContext, normalizeError } from '@/lib/errors/normalize-error';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import {
  getRegisteredProgramStandard,
  resolveRegisteredProgramContract,
} from '@/lib/apprenticeship/registered-program-contract';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BARBER_SLUG = 'barber-apprenticeship';
const OJL_SOURCE_TYPES = ['ojl', 'host_shop', 'timeclock', 'manual'];

async function _GET(req: Request) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const requestedEnrollmentId = searchParams.get('enrollment_id');
  const base = getRegisteredProgramStandard(BARBER_SLUG);
  if (!base) {
    return NextResponse.json({ error: 'Registered program configuration unavailable' }, { status: 500 });
  }

  try {
    let enrollmentQuery = supabase
      .from('program_enrollments')
      .select('id, program_slug, status, host_shop_id, supervisor_id, transfer_hours, transfer_hours_verified, rapids_status, rapids_id, lms_enrolled')
      .or(`user_id.eq.${user.id},student_id.eq.${user.id}`)
      .eq('program_slug', base.programSlug)
      .in('status', ['active', 'enrolled', 'in_progress', 'confirmed'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (requestedEnrollmentId) {
      enrollmentQuery = enrollmentQuery.eq('id', requestedEnrollmentId);
    }

    const { data: enrollment, error: enrollmentError } = await enrollmentQuery.maybeSingle();
    if (enrollmentError) throw enrollmentError;
    if (!enrollment) {
      return NextResponse.json({ error: 'No active Barber apprenticeship enrollment found' }, { status: 404 });
    }

    const contract = await resolveRegisteredProgramContract(supabase, {
      programSlug: enrollment.program_slug,
      partnerId: enrollment.host_shop_id,
      enrollmentId: enrollment.id,
    });
    if (!contract) {
      return NextResponse.json({ error: 'Registered program contract unavailable' }, { status: 500 });
    }

    const [hoursResult, competencyResult, rtiResult, rapidsResult] = await Promise.all([
      supabase
        .from('hour_entries')
        .select('hours_claimed, accepted_hours, source_type, status, category')
        .eq('user_id', user.id)
        .eq('program_slug', enrollment.program_slug),
      supabase
        .from('apprentice_competency_records')
        .select('competency_id, completed')
        .eq('enrollment_id', enrollment.id),
      supabase
        .from('barber_appendix_a_rti_progress')
        .select('required_hours, verified_hours, remaining_hours, requirement_met')
        .eq('enrollment_id', enrollment.id),
      supabase
        .from('rapids_registrations')
        .select('rapids_id, status, registration_date')
        .eq('enrollment_id', enrollment.id)
        .maybeSingle(),
    ]);

    if (hoursResult.error) throw hoursResult.error;
    if (competencyResult.error) throw competencyResult.error;
    if (rtiResult.error) throw rtiResult.error;

    const logs = hoursResult.data || [];
    const hoursFor = (log: { accepted_hours?: number | string | null; hours_claimed?: number | string | null }) =>
      Number(log.accepted_hours ?? log.hours_claimed ?? 0);

    const totalRtiHours = logs
      .filter((log) => log.source_type === 'rti')
      .reduce((sum, log) => sum + Number(log.hours_claimed || 0), 0);
    const totalOjlHours = logs
      .filter((log) => OJL_SOURCE_TYPES.includes(log.source_type))
      .reduce((sum, log) => sum + Number(log.hours_claimed || 0), 0);
    const approvedRtiHours = logs
      .filter((log) => log.status === 'approved' && log.source_type === 'rti')
      .reduce((sum, log) => sum + hoursFor(log), 0);
    const approvedOjlHours = logs
      .filter((log) => log.status === 'approved' && OJL_SOURCE_TYPES.includes(log.source_type))
      .reduce((sum, log) => sum + hoursFor(log), 0);
    const pendingHours = logs
      .filter((log) => log.status === 'pending')
      .reduce((sum, log) => sum + Number(log.hours_claimed || 0), 0);

    const competencyRows = competencyResult.data || [];
    const completedCompetencies = competencyRows.filter((row) => row.completed).length;
    const competencyProgress = Math.min(
      100,
      Math.round((completedCompetencies / contract.completion.competencyCount) * 100),
    );

    const rtiRows = rtiResult.data || [];
    const verifiedRtiHours = rtiRows.reduce((sum, row) => sum + Number(row.verified_hours || 0), 0);
    const remainingRtiHours = Math.max(0, contract.completion.requiredRtiHours - verifiedRtiHours);
    const rtiComplete =
      rtiRows.length > 0 &&
      rtiRows.every((row) => row.requirement_met) &&
      verifiedRtiHours >= contract.completion.requiredRtiHours;
    const competenciesComplete = completedCompetencies >= contract.completion.competencyCount;
    const placementReady = Boolean(enrollment.host_shop_id && enrollment.supervisor_id);
    const rapidsData = rapidsResult.data || null;

    return NextResponse.json({
      summary: {
        completion_basis: contract.completion.basis,
        program_slug: enrollment.program_slug,
        enrollment_id: enrollment.id,
        total_rti_hours: totalRtiHours,
        total_ojl_hours: totalOjlHours,
        total_hours: totalRtiHours + totalOjlHours,
        approved_hours: approvedRtiHours + approvedOjlHours,
        approved_ojl_hours: approvedOjlHours,
        approved_rti_hours: approvedRtiHours,
        pending_hours: pendingHours,
        transfer_hours: Number(enrollment.transfer_hours || 0),
        transfer_hours_verified: Boolean(enrollment.transfer_hours_verified),
        required_hours: contract.completion.fixedOjlCompletionHours,
        required_ojl_hours: contract.completion.fixedOjlCompletionHours,
        required_rti_hours: contract.completion.requiredRtiHours,
        remaining_hours: null,
        remaining_ojl_hours: null,
        remaining_rti_hours: remainingRtiHours,
        competency_count_required: contract.completion.competencyCount,
        competencies_completed: completedCompetencies,
        competencies_remaining: Math.max(0, contract.completion.competencyCount - completedCompetencies),
        progress_percentage: competencyProgress,
        rti_complete: rtiComplete,
        placement_ready: placementReady,
        program_complete: competenciesComplete && rtiComplete && placementReady,
        rapids_status: rapidsData?.status || enrollment.rapids_status || 'pending',
        rapids_id: rapidsData?.rapids_id || enrollment.rapids_id || null,
        rapids_registration_date: rapidsData?.registration_date || null,
        rapids_occupation_code: contract.standard.rapidsCode,
        rapids_sponsor_id: contract.sponsor.registrationNumber,
        lms_enrolled: Boolean(enrollment.lms_enrolled),
        shop_id: enrollment.host_shop_id || null,
        supervisor_id: enrollment.supervisor_id || null,
        apprentice_to_mentor_ratio: contract.standard.apprenticeToMentorRatio,
        probationary_hours: contract.standard.probationaryHours,
        employer: contract.employer,
        rti_providers: contract.rtiProviders,
        note: 'Registered-program rules are resolved through the canonical apprenticeship contract. OJL hours remain auditable work records and are not a fixed completion denominator for Barber 0030CB.',
      },
    });
  } catch (error) {
    logger.error('Error in hours-summary', normalizeError(error, 'Hours summary error'), getErrorContext(error));
    return NextResponse.json({ error: 'Failed to fetch hour summary' }, { status: 500 });
  }
}

export const GET = withApiAudit('/api/apprentice/hours-summary', _GET);
