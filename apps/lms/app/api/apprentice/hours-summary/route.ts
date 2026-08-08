import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getErrorContext, normalizeError } from '@/lib/errors/normalize-error';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { RAPIDS_CONFIG } from '@/lib/compliance/rapids-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
  const enrollmentId = searchParams.get('enrollment_id');

  try {
    let enrollmentQuery = supabase
      .from('student_enrollments')
      .select(
        `
        id,
        program_id,
        transfer_hours,
        required_hours,
        rapids_status,
        rapids_id,
        lms_enrolled,
        shop_id,
        programs (
          name,
          slug,
          total_hours
        )
      `,
      )
      .eq('student_id', user.id);

    if (enrollmentId) {
      enrollmentQuery = enrollmentQuery.eq('id', enrollmentId);
    }

    const { data: enrollment } = await enrollmentQuery.maybeSingle();
    const program = enrollment?.programs as any;
    const programSlug = program?.slug ?? null;
    const barberConfig = RAPIDS_CONFIG.programs.barber;
    const isBarber = programSlug === barberConfig.slug;

    let requiredHours = 2000;
    let transferHours = 0;

    if (enrollment) {
      requiredHours = enrollment.required_hours || program?.total_hours || 2000;
      transferHours = Number(enrollment.transfer_hours) || 0;
    }

    const { data: hourLogs, error: hoursError } = await supabase
      .from('hour_entries')
      .select('hours_claimed, accepted_hours, source_type, status, category')
      .eq('user_id', user.id);

    if (hoursError) {
      logger.error('Error fetching hours:', hoursError);
    }

    const logs = hourLogs || [];
    const hoursFor = (log: any) => Number(log.accepted_hours) || Number(log.hours_claimed) || 0;

    const totalRtiHours = logs
      .filter((log) => log.source_type === 'rti')
      .reduce((sum, log) => sum + (Number(log.hours_claimed) || 0), 0);

    const totalOjlHours = logs
      .filter((log) => OJL_SOURCE_TYPES.includes(log.source_type))
      .reduce((sum, log) => sum + (Number(log.hours_claimed) || 0), 0);

    const approvedRtiHours = logs
      .filter((log) => log.status === 'approved' && log.source_type === 'rti')
      .reduce((sum, log) => sum + hoursFor(log), 0);

    const approvedOjlHours = logs
      .filter((log) => log.status === 'approved' && OJL_SOURCE_TYPES.includes(log.source_type))
      .reduce((sum, log) => sum + hoursFor(log), 0);

    const approvedHoursVal = approvedOjlHours + approvedRtiHours;

    const pendingHoursVal = logs
      .filter((log) => log.status === 'pending')
      .reduce((sum, log) => sum + (Number(log.hours_claimed) || 0), 0);

    const wioaRtiHours = logs
      .filter((log) => log.source_type === 'rti' && log.category === 'wioa')
      .reduce((sum, log) => sum + (Number(log.hours_claimed) || 0), 0);

    const wioaOjlHours = logs
      .filter(
        (log) => OJL_SOURCE_TYPES.includes(log.source_type) && log.category === 'wioa',
      )
      .reduce((sum, log) => sum + (Number(log.hours_claimed) || 0), 0);

    const { data: rapidsData } = await supabase
      .from('rapids_registrations')
      .select('rapids_id, status, registration_date')
      .eq('student_id', user.id)
      .maybeSingle();

    const { data: stateBoardData } = await supabase
      .from('state_board_readiness')
      .select('ready_for_exam, lms_completed, practical_skills_verified')
      .eq('student_id', user.id)
      .maybeSingle();

    const totalHours = totalRtiHours + totalOjlHours;

    let effectiveTotal = totalHours + transferHours;
    let remainingHours = Math.max(requiredHours - effectiveTotal, 0);
    let progressPercentage = Math.min((effectiveTotal / requiredHours) * 100, 100);
    let readyForExam = effectiveTotal >= requiredHours;
    let requiredOjlHours: number | null = null;
    let requiredRtiHours: number | null = null;
    let remainingOjlHours: number | null = null;
    let remainingRtiHours: number | null = null;

    if (isBarber) {
      requiredOjlHours = barberConfig.totalHours;
      requiredRtiHours = barberConfig.relatedInstructionHours;

      // Transfer hours represent prior supervised work experience and therefore
      // credit the OJL bucket only. RTI must be independently completed/approved.
      const creditedOjl = Math.min(approvedOjlHours + transferHours, requiredOjlHours);
      const creditedRti = Math.min(approvedRtiHours, requiredRtiHours);
      const combinedRequirement = requiredOjlHours + requiredRtiHours;

      effectiveTotal = creditedOjl + creditedRti;
      remainingOjlHours = Math.max(requiredOjlHours - creditedOjl, 0);
      remainingRtiHours = Math.max(requiredRtiHours - creditedRti, 0);
      remainingHours = remainingOjlHours + remainingRtiHours;
      progressPercentage = Math.min((effectiveTotal / combinedRequirement) * 100, 100);
      readyForExam = remainingOjlHours === 0 && remainingRtiHours === 0;
      requiredHours = requiredOjlHours;
    }

    const summary = {
      total_rti_hours: totalRtiHours,
      total_ojl_hours: totalOjlHours,
      total_hours: totalHours,
      approved_hours: approvedHoursVal,
      approved_ojl_hours: approvedOjlHours,
      approved_rti_hours: approvedRtiHours,
      pending_hours: pendingHoursVal,
      transfer_hours: transferHours,
      required_hours: requiredHours,
      required_ojl_hours: requiredOjlHours,
      required_rti_hours: requiredRtiHours,
      remaining_hours: remainingHours,
      remaining_ojl_hours: remainingOjlHours,
      remaining_rti_hours: remainingRtiHours,
      progress_percentage: progressPercentage,
      wioa_rti_hours: wioaRtiHours,
      wioa_ojl_hours: wioaOjlHours,
      enrollment_id: enrollment?.id || null,
      program_name: program?.name || 'Barber Apprenticeship',
      program_slug: programSlug,

      rapids_status: rapidsData?.status || enrollment?.rapids_status || 'pending',
      rapids_id: rapidsData?.rapids_id || enrollment?.rapids_id || null,
      rapids_registration_date: rapidsData?.registration_date || null,

      lms_enrolled: enrollment?.lms_enrolled || false,
      lms_completed: stateBoardData?.lms_completed || false,

      ready_for_exam: readyForExam && (stateBoardData?.lms_completed || false),
      practical_skills_verified: stateBoardData?.practical_skills_verified || false,

      shop_id: enrollment?.shop_id || null,
    };

    return NextResponse.json({ summary });
  } catch (error: any) {
    logger.error(
      'Error in hours-summary',
      normalizeError(error, 'Hours summary error'),
      getErrorContext(error),
    );
    return NextResponse.json({ error: 'Failed to fetch hour summary' }, { status: 500 });
  }
}

export const GET = withApiAudit('/api/apprentice/hours-summary', _GET);
