/**
 * Shared dashboard data handler for cosmetology, nail-tech, esthetician PWA.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export async function handleDashboard(request: NextRequest, discipline: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return safeError('Unauthorized', 401);

    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();

    const name = profile
      ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || 'Apprentice'
      : 'Apprentice';

    // Total approved hours for this discipline
    const { data: hoursData } = await supabase
      .from('apprentice_hours')
      .select('hours, submitted_at')
      .eq('user_id', user.id)
      .eq('discipline', discipline)
      .eq('status', 'approved');

    const totalHours = (hoursData ?? []).reduce((sum, r) => sum + (r.hours ?? 0), 0);

    // Hours logged this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weeklyHours = (hoursData ?? [])
      .filter(r => r.submitted_at && new Date(r.submitted_at) >= weekStart)
      .reduce((sum, r) => sum + (r.hours ?? 0), 0);

    return NextResponse.json({
      name,
      totalHours: Math.round(totalHours * 10) / 10,
      weeklyHours: Math.round(weeklyHours * 10) / 10,
      startDate: null,
    });
  } catch (err) {
    return safeInternalError(err, 'Failed to load dashboard');
  }
}
