import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all data in parallel
    const [
      profileResult,
      enrollmentResult,
      hoursResult,
      achievementsResult,
      streakResult,
      pointsResult,
      scheduleResult
    ] = await Promise.all([
      // Profile
      supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, phone')
        .eq('id', user.id)
        .single(),
      
      // Active enrollment
      supabase
        .from('student_enrollments')
        .select(`
          id,
          program_id,
          status,
          transfer_hours,
          required_hours,
          rapids_status,
          rapids_id,
          milady_enrolled,
          shop_id,
          created_at,
          programs (
            id,
            name,
            slug,
            total_hours
          )
        `)
        .eq('student_id', user.id)
        .eq('status', 'active')
        .maybeSingle(),
      
      // Hours log
      supabase
        .from('apprentice_hours_log')
        .select('id, minutes, hour_type, funding_phase, status, logged_date, description, verified_by')
        .eq('student_id', user.id)
        .order('logged_date', { ascending: false })
        .limit(10),
      
      // Achievements
      supabase
        .from('achievements')
        .select('id, code, label, description, earned_at, icon')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false }),
      
      // Streak
      supabase
        .from('daily_streaks')
        .select('current_streak, longest_streak, last_active_date')
        .eq('user_id', user.id)
        .maybeSingle(),
      
      // Points
      supabase
        .from('user_points')
        .select('total_points, level, level_name, points_to_next_level')
        .eq('user_id', user.id)
        .maybeSingle(),
      
      // Schedule
      supabase
        .from('calendar_events')
        .select('id, title, date, time, duration, description, color, event_type')
        .eq('user_id', user.id)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(10)
    ]);

    // Process hours
    const hourLogs = hoursResult.data || [];
    const totalRtiMinutes = hourLogs.filter(l => l.hour_type === 'RTI').reduce((sum, l) => sum + (l.minutes || 0), 0);
    const totalOjtMinutes = hourLogs.filter(l => l.hour_type === 'OJT').reduce((sum, l) => sum + (l.minutes || 0), 0);
    const approvedMinutes = hourLogs.filter(l => l.status === 'APPROVED').reduce((sum, l) => sum + (l.minutes || 0), 0);
    const pendingMinutes = hourLogs.filter(l => l.status === 'SUBMITTED' || l.status === 'DRAFT').reduce((sum, l) => sum + (l.minutes || 0), 0);

    const enrollment = enrollmentResult.data;
    const requiredHours = enrollment?.required_hours || (enrollment?.programs as any)?.total_hours || 2000;
    const transferHours = enrollment?.transfer_hours || 0;
    const totalHours = (totalRtiMinutes + totalOjtMinutes) / 60;
    const effectiveTotal = totalHours + transferHours;
    const progressPercentage = Math.min((effectiveTotal / requiredHours) * 100, 100);

    // Get current module
    const { data: modules } = await supabase
      .from('modules')
      .select(`
        id,
        title,
        description,
        order_index,
        lessons (
          id,
          title,
          order_index,
          duration_minutes,
          content_type
        )
      `)
      .order('order_index', { ascending: true })
      .limit(1);

    const { data: completedLessons } = await supabase
      .from('lesson_completions')
      .select('lesson_id')
      .eq('user_id', user.id);

    const completedIds = new Set((completedLessons || []).map(c => c.lesson_id));

    // Build response
    const dashboard = {
      learner: {
        id: user.id,
        name: profileResult.data?.full_name || user.email?.split('@')[0] || 'Student',
        email: profileResult.data?.email || user.email,
        avatar: profileResult.data?.avatar_url,
        phone: profileResult.data?.phone || '',
        enrolledAt: enrollment?.created_at || new Date().toISOString(),
      },
      program: enrollment ? {
        id: enrollment.id,
        programId: enrollment.program_id,
        name: (enrollment.programs as any)?.name || 'Barber Apprenticeship',
        slug: (enrollment.programs as any)?.slug || 'barber-apprenticeship',
        status: enrollment.status,
        rapidsStatus: enrollment.rapids_status || 'pending',
        rapidsId: enrollment.rapids_id,
        miladyEnrolled: enrollment.milady_enrolled || false,
        startDate: new Date(enrollment.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        expectedCompletion: 'December 2026',
      } : null,
      progress: {
        theoryModules: 0,
        practicalHours: Math.round(totalOjtMinutes / 60),
        rtiHours: Math.round(totalRtiMinutes / 60),
        totalHours: Math.round(effectiveTotal),
        requiredHours,
        transferHours,
        approvedHours: Math.round(approvedMinutes / 60),
        pendingHours: Math.round(pendingMinutes / 60),
        progressPercentage: Math.round(progressPercentage),
      },
      currentModule: modules?.[0] ? {
        id: modules[0].id,
        number: modules[0].order_index + 1,
        title: modules[0].title,
        description: modules[0].description || '',
        progress: 0,
        lessons: ((modules[0].lessons as any[]) || []).map((l: any) => ({
          id: l.id,
          title: l.title,
          duration: l.duration_minutes || 15,
          type: l.content_type || 'video',
          completed: completedIds.has(l.id),
        })),
      } : null,
      trainingLog: (hoursResult.data || []).map(log => ({
        id: log.id,
        date: log.logged_date,
        hours: Math.round((log.minutes || 0) / 60 * 10) / 10,
        type: log.hour_type as 'OJT' | 'RTI',
        description: log.description || '',
        location: log.hour_type === 'RTI' ? 'Online - Milady Platform' : 'Training Location',
        supervisor: log.verified_by || 'Pending',
        status: log.status,
        verified: log.status === 'APPROVED',
        skills: [],
      })),
      schedule: (scheduleResult.data || []).map(event => ({
        id: event.id,
        title: event.title,
        date: formatEventDate(event.date),
        time: event.time || '9:00 AM',
        duration: event.duration || 60,
        type: event.event_type || 'class',
        location: event.description || 'See event details',
        color: event.color || '#3b82f6',
      })),
      achievements: (achievementsResult.data || []).map(a => ({
        id: a.id,
        code: a.code,
        label: a.label,
        description: a.description,
        earnedAt: a.earned_at,
        icon: a.icon || '🏆',
      })),
      gamification: {
        points: pointsResult.data?.total_points || 0,
        level: pointsResult.data?.level || 1,
        levelName: pointsResult.data?.level_name || 'Beginner',
        pointsToNextLevel: pointsResult.data?.points_to_next_level || 100,
        currentStreak: streakResult.data?.current_streak || 0,
        longestStreak: streakResult.data?.longest_streak || 0,
      },
    };

    return NextResponse.json(dashboard);

  } catch (error) {
    logger.error('[Learner Dashboard] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(date);
  eventDate.setHours(0, 0, 0, 0);
  
  const diffDays = Math.round((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
