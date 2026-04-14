
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get recent enrollments
    const { data: rawEnrollments } = await supabase
      .from('program_enrollments')
      .select('id, user_id, enrolled_at, program_id, programs:program_id(name, title)')
      .order('enrolled_at', { ascending: false })
      .limit(5);

    // Get recent completions
    const { data: rawCompletions } = await supabase
      .from('program_enrollments')
      .select('id, user_id, completion_date, program_id, programs:program_id(name, title)')
      .eq('status', 'completed')
      .order('completion_date', { ascending: false })
      .limit(5);

    // Hydrate profiles separately (user_id → auth.users, no FK to profiles)
    const activityUserIds = [...new Set([
      ...(rawEnrollments ?? []).map((e: any) => e.user_id),
      ...(rawCompletions ?? []).map((e: any) => e.user_id),
    ].filter(Boolean))];
    const { data: activityProfiles } = activityUserIds.length
      ? await supabase.from('profiles').select('id, full_name').in('id', activityUserIds)
      : { data: [] };
    const activityProfileMap = Object.fromEntries((activityProfiles ?? []).map((p: any) => [p.id, p]));
    const enrollments = (rawEnrollments ?? []).map((e: any) => ({ ...e, profiles: activityProfileMap[e.user_id] ?? null }));
    const completions = (rawCompletions ?? []).map((e: any) => ({ ...e, profiles: activityProfileMap[e.user_id] ?? null }));

    // Get recent placements
    const { data: placements } = await supabase
      .from('employment_outcomes')
      .select('*, wioa_participants(first_name, last_name)')
      .eq('employed_at_exit', true)
      .order('exit_date', { ascending: false })
      .limit(5);

    // Combine and format activities
    const activities = [];

    enrollments?.forEach(e => {
      activities.push({
        id: `enroll-${e.id}`,
        type: 'enrollment',
        message: `${e.profiles?.full_name || 'Student'} enrolled in ${(e.programs as any)?.title || (e.programs as any)?.name || 'program'}`,
        timestamp: e.enrolled_at,
        priority: 'low'
      });
    });

    completions?.forEach(c => {
      activities.push({
        id: `complete-${c.id}`,
        type: 'completion',
        message: `${c.profiles?.full_name || 'Student'} completed ${(c.programs as any)?.title || (c.programs as any)?.name || 'program'}`,
        timestamp: c.completion_date,
        priority: 'medium'
      });
    });

    placements?.forEach(p => {
      activities.push({
        id: `placement-${p.id}`,
        type: 'placement',
        message: `${p.wioa_participants?.first_name || 'Participant'} ${p.wioa_participants?.last_name || ''} placed in employment`,
        timestamp: p.exit_date,
        priority: 'high'
      });
    });

    // Sort by timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json(activities.slice(0, 20));
  } catch (error) { 
    logger.error('Error fetching recent activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent activity' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/reporting/recent-activity', _GET);
