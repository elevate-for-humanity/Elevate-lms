import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
    // Get student's apprentice enrollment with transfer hours and required hours
    let enrollmentQuery = supabase
      .from('student_enrollments')
      .select(`
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
      `)
      .eq('student_id', user.id);

    if (enrollmentId) {
      enrollmentQuery = enrollmentQuery.eq('id', enrollmentId);
    }

    const { data: enrollment, error: enrollmentError } = await enrollmentQuery.maybeSingle();

    // Default required hours (Indiana barber = 2000)
    let requiredHours = 2000;
    let transferHours = 0;

    if (enrollment) {
      // Use enrollment-specific required hours if set, otherwise use program default
      requiredHours = enrollment.required_hours 
        || (enrollment.programs as any)?.total_hours 
        || 2000;
      transferHours = enrollment.transfer_hours || 0;
    }

    // Get hour totals from consolidated hour_entries
    const { data: hourLogs, error: hoursError } = await supabase
      .from('hour_entries')
      .select('hours_claimed, accepted_hours, source_type, status, category')
      .eq('user_id', user.id);

    if (hoursError) {
      logger.error('Error fetching hours:', hoursError);
    }

    // Calculate totals (hour_entries stores hours directly, not minutes)
    const logs = hourLogs || [];
    
    const totalRtiHours = logs
      .filter(l => l.source_type === 'rti')
      .reduce((sum, l) => sum + (Number(l.hours_claimed) || 0), 0);
    
    const totalOjlHours = logs
      .filter(l => l.source_type === 'ojl' || l.source_type === 'host_shop' || l.source_type === 'timeclock' || l.source_type === 'manual')
      .reduce((sum, l) => sum + (Number(l.hours_claimed) || 0), 0);
    
    const approvedHoursVal = logs
      .filter(l => l.status === 'approved')
      .reduce((sum, l) => sum + (Number(l.accepted_hours) || Number(l.hours_claimed) || 0), 0);
    
    const pendingHoursVal = logs
      .filter(l => l.status === 'pending')
      .reduce((sum, l) => sum + (Number(l.hours_claimed) || 0), 0);

    // WIOA-specific hours (tracked via category)
    const wioaRtiHours = logs
      .filter(l => l.source_type === 'rti' && l.category === 'wioa')
      .reduce((sum, l) => sum + (Number(l.hours_claimed) || 0), 0);

    const wioaOjlHours = logs
      .filter(l => (l.source_type === 'ojl' || l.source_type === 'host_shop' || l.source_type === 'timeclock' || l.source_type === 'manual') && l.category === 'wioa')
      .reduce((sum, l) => sum + (Number(l.hours_claimed) || 0), 0);

    // Alias for backward compat in calculations below
    const totalRtiMinutes = totalRtiHours * 60;
    const totalOjlMinutes = totalOjlHours * 60;
    const approvedMinutes = approvedHoursVal * 60;
    const pendingMinutes = pendingHoursVal * 60;
    const wioaRtiMinutes = wioaRtiHours * 60;
    const wioaOjlMinutes = wioaOjlHours * 60;

    // Get RAPIDS status
    const { data: rapidsData } = await supabase
      .from('rapids_registrations')
      .select('rapids_id, status, registration_date')
      .eq('student_id', user.id)
      .maybeSingle();

    // Get state board readiness
    const { data: stateBoardData } = await supabase
      .from('state_board_readiness')
      .select('ready_for_exam, lms_completed, practical_skills_verified')
      .eq('student_id', user.id)
      .maybeSingle();

    // Calculate effective total and progress
    const totalMinutes = totalRtiMinutes + totalOjlMinutes;
    const totalHours = totalMinutes / 60;
    const effectiveTotal = totalHours + transferHours;
    const remainingHours = Math.max(requiredHours - effectiveTotal, 0);
    const progressPercentage = Math.min((effectiveTotal / requiredHours) * 100, 100);
    const readyForExam = effectiveTotal >= requiredHours;

    // Convert to hours — OJL and RTI are separate compliance buckets
    const summary = {
      total_rti_hours: totalRtiMinutes / 60,
      total_ojl_hours: totalOjlMinutes / 60,
      // total_hours kept for dashboard display only — NOT for apprenticeship completion
      total_hours: totalHours,
      approved_hours: approvedMinutes / 60,
      pending_hours: pendingMinutes / 60,
      transfer_hours: transferHours,
      required_hours: requiredHours,
      remaining_hours: remainingHours,
      progress_percentage: progressPercentage,
      wioa_rti_hours: wioaRtiMinutes / 60,
      wioa_ojl_hours: wioaOjlMinutes / 60,
      enrollment_id: enrollment?.id || null,
      program_name: (enrollment?.programs as any)?.name || 'Barber Apprenticeship',
      
      // RAPIDS info
      rapids_status: rapidsData?.status || enrollment?.rapids_status || 'pending',
      rapids_id: rapidsData?.rapids_id || enrollment?.rapids_id || null,
      rapids_registration_date: rapidsData?.registration_date || null,
      
      // LMS enrollment status (DB columns retain milady_ prefix until migration)
      lms_enrolled: enrollment?.lms_enrolled || false,
      lms_completed: stateBoardData?.lms_completed || false,
      
      // State board readiness
      ready_for_exam: readyForExam && (stateBoardData?.lms_completed || false),
      practical_skills_verified: stateBoardData?.practical_skills_verified || false,
      
      // Shop info
      shop_id: enrollment?.shop_id || null,
    };

    return NextResponse.json({ summary });
  } catch (error: any) {
    logger.error('Error in hours-summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hour summary' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/apprentice/hours-summary', _GET);
