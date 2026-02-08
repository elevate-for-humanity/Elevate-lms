export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get recent enrollments
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('*, profiles(full_name), programs(name)')
      .order('enrolled_at', { ascending: false })
      .limit(5);

    // Get recent completions
    const { data: completions } = await supabase
      .from('enrollments')
      .select('*, profiles(full_name), programs(name)')
      .eq('status', 'completed')
      .order('completion_date', { ascending: false })
      .limit(5);

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
  } catch (error) { /* Error handled silently */ 
    logger.error('Error fetching recent activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent activity' },
      { status: 500 }
    );
  }
}
