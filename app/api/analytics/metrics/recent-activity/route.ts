export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    // Get recent enrollments
    const { data: enrollments } = await db
      .from('program_enrollments')
      .select('*, profiles(full_name), programs(name)')
      .order('enrolled_at', { ascending: false })
      .limit(5);

    // Get recent completions
    const { data: completions } = await db
      .from('program_enrollments')
      .select('*, profiles(full_name), programs(name)')
      .eq('status', 'completed')
      .order('completion_date', { ascending: false })
      .limit(5);

    // Get recent placements
    const { data: placements } = await db
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
        message: `${e.profiles?.full_name || 'Student'} enrolled in ${e.programs?.name || 'program'}`,
        timestamp: e.enrolled_at,
        priority: 'low'
      });
    });

    completions?.forEach(c => {
      activities.push({
        id: `complete-${c.id}`,
        type: 'completion',
        message: `${c.profiles?.full_name || 'Student'} completed ${c.programs?.name || 'program'}`,
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
export const GET = withApiAudit('/api/analytics/metrics/recent-activity', _GET);
