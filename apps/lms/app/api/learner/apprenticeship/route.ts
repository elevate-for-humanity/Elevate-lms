/**
 * GET /api/learner/apprenticeship
 * 
 * Returns apprenticeship progress for apprentice enrollments.
 * Only available for enrollment_type = 'apprentice'
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/requireAuth';
import { getClient } from '@/lib/supabase/client';
import { loadBlueprintWithProgram } from '@/lib/course-factory/blueprint-loader';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = request.nextUrl;
    const programSlug = searchParams.get('programSlug');
    
    const supabase = getClient();
    
    // Get apprenticeship enrollment
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('*, courses(*)')
      .eq('user_id', user!.id)
      .eq('enrollment_type', 'apprentice')
      .eq('status', 'active')
      .single();
    
    if (!enrollment) {
      return NextResponse.json({ 
        error: 'Not an apprentice enrollment' 
      }, { status: 404 });
    }
    
    // Load blueprint for apprenticeship config
    const blueprint = await loadBlueprintWithProgram(supabase, {
      programId: enrollment.courses.program_id
    });
    
    if (!blueprint?.apprenticeshipConfig) {
      return NextResponse.json({ 
        error: 'Apprenticeship not supported for this program' 
      }, { status: 400 });
    }
    
    const config = blueprint.apprenticeshipConfig;
    
    // Fetch all apprenticeship data in parallel
    const [
      rtiHoursData,
      ojlHoursData,
      evaluationsData,
      signoffsData,
      rapidsData
    ] = await Promise.all([
      // RTI Hours
      supabase
        .from('rti_hours')
        .select('*')
        .eq('enrollment_id', enrollment.id)
        .order('activity_date', { ascending: false }),
      
      // OJL Hours
      supabase
        .from('ojl_hours')
        .select('*')
        .eq('enrollment_id', enrollment.id)
        .order('activity_date', { ascending: false }),
      
      // Employer Evaluations
      supabase
        .from('employer_evaluations')
        .select('*, profiles(full_name)')
        .eq('enrollment_id', enrollment.id)
        .order('period_end', { ascending: false }),
      
      // Skill Sign-offs
      supabase
        .from('skill_signoffs')
        .select('*')
        .eq('enrollment_id', enrollment.id),
      
      // RAPIDS Reporting
      supabase
        .from('rapids_reporting')
        .select('*')
        .eq('enrollment_id', enrollment.id)
        .single()
    ]);
    
    // Calculate RTI progress
    const rtiCompleted = (rtiHoursData.data || []).reduce(
      (sum: number, h: Record<string, unknown>) => sum + (h.hours as number || 0), 
      0
    );
    
    // Calculate OJL progress
    const ojlCompleted = (ojlHoursData.data || []).reduce(
      (sum: number, h: Record<string, unknown>) => sum + (h.hours as number || 0), 
      0
    );
    
    // Build response
    const apprenticeship = {
      enrollmentId: enrollment.id,
      learnerId: user!.id,
      programSlug: enrollment.courses.program_slug,
      status: enrollment.status,
      config: {
        totalHoursRequired: config.totalHours,
        rtiHoursRequired: config.rtiHours,
        ojlHoursRequired: config.ojlHours,
        competencyCount: config.competencyCount,
        rapidsProgramCode: config.rapidsProgramCode
      },
      hours: {
        total: {
          required: config.totalHours,
          completed: rtiCompleted + ojlCompleted,
          remaining: config.totalHours - (rtiCompleted + ojlCompleted),
          percentComplete: Math.round(((rtiCompleted + ojlCompleted) / config.totalHours) * 100)
        },
        rti: {
          required: config.rtiHours,
          completed: rtiCompleted,
          remaining: config.rtiHours - rtiCompleted,
          percentComplete: Math.round((rtiCompleted / config.rtiHours) * 100),
          byMonth: aggregateByMonth(rtiHoursData.data || [])
        },
        ojl: {
          required: config.ojlHours,
          completed: ojlCompleted,
          remaining: config.ojlHours - ojlCompleted,
          percentComplete: Math.round((ojlCompleted / config.ojlHours) * 100),
          byMonth: aggregateByMonth(ojlHoursData.data || [])
        }
      },
      competencyTracking: {
        totalRequired: config.competencyCount,
        verified: signoffsData.data?.filter((s: Record<string, unknown>) => s.signed_off).length || 0,
        pending: signoffsData.data?.filter((s: Record<string, unknown>) => !s.signed_off).length || 0,
        signoffs: (signoffsData.data || []).map((s: Record<string, unknown>) => ({
          skillKey: s.skill_key,
          skillName: formatSkillName(s.skill_key as string),
          competencyKey: s.competency_key,
          signedOff: s.signed_off,
          signedOffBy: s.signed_off_by,
          signedOffAt: s.signed_off_at,
          employerName: s.employer_name
        }))
      },
      employerEvaluations: {
        total: evaluationsData.data?.length || 0,
        pending: evaluationsData.data?.filter((e: Record<string, unknown>) => e.status === 'pending').length || 0,
        submitted: evaluationsData.data?.filter((e: Record<string, unknown>) => e.status === 'submitted').length || 0,
        evaluations: (evaluationsData.data || []).map((e: Record<string, unknown>) => ({
          id: e.id,
          periodStart: e.period_start,
          periodEnd: e.period_end,
          overallRating: e.overall_rating,
          status: e.status,
          employerName: (e.profiles as Record<string, unknown>)?.full_name || 'Employer',
          submittedAt: e.submitted_at,
          competencyRatings: e.competency_ratings
        }))
      },
      rapids: rapidsData.data ? {
        rapidsId: rapidsData.data.rapids_id,
        programCode: rapidsData.data.program_code,
        lastReportedAt: rapidsData.data.last_reported_at,
        nextReportDue: rapidsData.data.next_report_due,
        status: getRAPIDSStatus(rapidsData.data)
      } : null,
      completionStatus: getCompletionStatus(
        config.totalHours,
        rtiCompleted + ojlCompleted,
        config.competencyCount,
        signoffsData.data?.filter((s: Record<string, unknown>) => s.signed_off).length || 0
      )
    };
    
    return NextResponse.json({
      success: true,
      ...apprenticeship
    });
    
  } catch (error) {
    console.error('[Apprenticeship API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load apprenticeship data' },
      { status: 500 }
    );
  }
}

// ─── Helper Functions ────────────────────────────────────────────────────────────

function aggregateByMonth(data: Array<Record<string, unknown>>): Array<{ month: string; hours: number }> {
  const byMonth = new Map<string, number>();
  
  for (const record of data) {
    const date = new Date(record.activity_date as string);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    byMonth.set(month, (byMonth.get(month) || 0) + (record.hours as number || 0));
  }
  
  return Array.from(byMonth.entries())
    .map(([month, hours]) => ({ month, hours }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

function formatSkillName(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

function getRAPIDSStatus(data: Record<string, unknown>): 'current' | 'due' | 'overdue' {
  if (!data) return 'due';
  
  const nextDue = new Date(data.next_report_due as string);
  const now = new Date();
  
  if (now > nextDue) return 'overdue';
  
  const daysUntilDue = Math.ceil((nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysUntilDue <= 7 ? 'due' : 'current';
}

function getCompletionStatus(
  totalRequired: number,
  hoursCompleted: number,
  competenciesRequired: number,
  competenciesVerified: number
): { percent: number; isComplete: boolean; eta?: string; blockers: string[] } {
  const percent = Math.round(
    ((hoursCompleted / totalRequired) * 0.6 + 
    (competenciesVerified / competenciesRequired) * 0.4) * 100
  );
  
  const blockers: string[] = [];
  
  if (hoursCompleted < totalRequired) {
    blockers.push(`${Math.round(totalRequired - hoursCompleted)} hours remaining`);
  }
  
  if (competenciesVerified < competenciesRequired) {
    blockers.push(`${competenciesRequired - competenciesVerified} competencies to verify`);
  }
  
  const isComplete = hoursCompleted >= totalRequired && competenciesVerified >= competenciesRequired;
  
  // Estimate completion
  const hoursRemaining = totalRequired - hoursCompleted;
  const weeksRemaining = Math.ceil(hoursRemaining / 20); // Assume 20 hrs/week
  const eta = isComplete ? undefined : `~${weeksRemaining} weeks`;
  
  return { percent: Math.min(100, percent), isComplete, eta, blockers };
}
