import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
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
        milady_enrolled,
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

    // Get hour totals from apprentice_hours_log
    const { data: hourLogs, error: hoursError } = await supabase
      .from('apprentice_hours_log')
      .select('minutes, hour_type, funding_phase, status')
      .eq('enrollment_id', enrollment?.id || enrollmentId);

    if (hoursError) {
      console.error('Error fetching hours:', hoursError);
    }

    // Calculate totals
    const logs = hourLogs || [];
    
    const totalRtiMinutes = logs
      .filter(l => l.hour_type === 'RTI')
      .reduce((sum, l) => sum + (l.minutes || 0), 0);
    
    const totalOjtMinutes = logs
      .filter(l => l.hour_type === 'OJT')
      .reduce((sum, l) => sum + (l.minutes || 0), 0);
    
    const approvedMinutes = logs
      .filter(l => l.status === 'APPROVED')
      .reduce((sum, l) => sum + (l.minutes || 0), 0);
    
    const pendingMinutes = logs
      .filter(l => l.status === 'SUBMITTED' || l.status === 'DRAFT')
      .reduce((sum, l) => sum + (l.minutes || 0), 0);

    const wioaRtiMinutes = logs
      .filter(l => l.hour_type === 'RTI' && l.funding_phase === 'WIOA')
      .reduce((sum, l) => sum + (l.minutes || 0), 0);

    const wioaOjtMinutes = logs
      .filter(l => l.hour_type === 'OJT' && l.funding_phase === 'WIOA')
      .reduce((sum, l) => sum + (l.minutes || 0), 0);

    // Get RAPIDS status
    const { data: rapidsData } = await supabase
      .from('rapids_registrations')
      .select('rapids_id, status, registration_date')
      .eq('student_id', user.id)
      .maybeSingle();

    // Get state board readiness
    const { data: stateBoardData } = await supabase
      .from('state_board_readiness')
      .select('ready_for_exam, milady_completed, practical_skills_verified')
      .eq('student_id', user.id)
      .maybeSingle();

    // Calculate effective total and progress
    const totalMinutes = totalRtiMinutes + totalOjtMinutes;
    const totalHours = totalMinutes / 60;
    const effectiveTotal = totalHours + transferHours;
    const remainingHours = Math.max(requiredHours - effectiveTotal, 0);
    const progressPercentage = Math.min((effectiveTotal / requiredHours) * 100, 100);
    const readyForExam = effectiveTotal >= requiredHours;

    // Convert to hours
    const summary = {
      total_rti_hours: totalRtiMinutes / 60,
      total_ojt_hours: totalOjtMinutes / 60,
      total_hours: totalHours,
      approved_hours: approvedMinutes / 60,
      pending_hours: pendingMinutes / 60,
      transfer_hours: transferHours,
      required_hours: requiredHours,
      remaining_hours: remainingHours,
      progress_percentage: progressPercentage,
      wioa_rti_hours: wioaRtiMinutes / 60,
      wioa_ojt_hours: wioaOjtMinutes / 60,
      enrollment_id: enrollment?.id || null,
      program_name: (enrollment?.programs as any)?.name || 'Barber Apprenticeship',
      
      // RAPIDS info
      rapids_status: rapidsData?.status || enrollment?.rapids_status || 'pending',
      rapids_id: rapidsData?.rapids_id || enrollment?.rapids_id || null,
      rapids_registration_date: rapidsData?.registration_date || null,
      
      // Milady info
      milady_enrolled: enrollment?.milady_enrolled || false,
      milady_completed: stateBoardData?.milady_completed || false,
      
      // State board readiness
      ready_for_exam: readyForExam && (stateBoardData?.milady_completed || false),
      practical_skills_verified: stateBoardData?.practical_skills_verified || false,
      
      // Shop info
      shop_id: enrollment?.shop_id || null,
    };

    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error('Error in hours-summary:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch hour summary' },
      { status: 500 }
    );
  }
}
