/**
 * Activity Feed - Pulls real data from system tables
 * No fake data - everything from actual user activity
 */

import { createClient } from '@/lib/supabase/server';

export type ActivityType = 
  | 'enrollment'
  | 'course_progress'
  | 'course_completed'
  | 'ojt_hours_logged'
  | 'ojt_hours_verified'
  | 'certification_earned'
  | 'badge_earned'
  | 'job_application'
  | 'job_hired'
  | 'milestone';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  title: string;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}

/**
 * Get activity feed from real system data
 */
export async function getActivityFeed(options: {
  programId?: string;
  cohortId?: string;
  limit?: number;
}): Promise<ActivityItem[]> {
  const supabase = await createClient();
  const { programId, cohortId, limit = 20 } = options;
  
  const activities: ActivityItem[] = [];

  // 1. Recent enrollments
  const enrollmentQuery = supabase
    .from('program_enrollments')
    .select(`
      id,
      created_at,
      user_id,
      profiles!enrollments_user_id_fkey(full_name, avatar_url),
      programs(name)
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  if (programId) {
    enrollmentQuery.eq('program_id', programId);
  }

  const { data: enrollments } = await enrollmentQuery;

  if (enrollments) {
    for (const e of enrollments) {
      const profile = e.profiles as any;
      const program = e.programs as any;
      activities.push({
        id: `enrollment-${e.id}`,
        type: 'enrollment',
        user_id: e.user_id,
        user_name: profile?.full_name || 'New Student',
        user_avatar: profile?.avatar_url,
        title: 'Started training',
        description: `Enrolled in ${program?.name || 'a program'}`,
        created_at: e.created_at,
      });
    }
  }

  // 2. Course progress updates (significant milestones: 25%, 50%, 75%, 100%)
  const { data: progressUpdates } = await supabase
    .from('lms_progress')
    .select(`
      id,
      user_id,
      progress_percent,
      updated_at,
      profiles!lms_progress_user_id_fkey(full_name, avatar_url),
      courses(title)
    `)
    .in('progress_percent', [25, 50, 75, 100])
    .order('updated_at', { ascending: false })
    .limit(10);

  if (progressUpdates) {
    for (const p of progressUpdates) {
      const profile = p.profiles as any;
      const course = p.courses as any;
      const isComplete = p.progress_percent === 100;
      
      activities.push({
        id: `progress-${p.id}`,
        type: isComplete ? 'course_completed' : 'course_progress',
        user_id: p.user_id,
        user_name: profile?.full_name || 'Student',
        user_avatar: profile?.avatar_url,
        title: isComplete ? 'Completed course!' : `${p.progress_percent}% complete`,
        description: course?.title || 'Course',
        metadata: { progress: p.progress_percent },
        created_at: p.updated_at,
      });
    }
  }

  // 3. OJT hours logged
  const { data: ojtLogs } = await supabase
    .from('ojt_hours_log')
    .select(`
      id,
      student_id,
      hours_worked,
      work_date,
      supervisor_verified,
      created_at,
      profiles!ojt_hours_logs_student_id_fkey(full_name, avatar_url),
      ojt_placements(employer_name, job_title)
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  if (ojtLogs) {
    for (const log of ojtLogs) {
      const profile = log.profiles as any;
      const placement = log.ojt_placements as any;
      
      activities.push({
        id: `ojt-${log.id}`,
        type: log.supervisor_verified ? 'ojt_hours_verified' : 'ojt_hours_logged',
        user_id: log.student_id,
        user_name: profile?.full_name || 'Student',
        user_avatar: profile?.avatar_url,
        title: log.supervisor_verified 
          ? `${log.hours_worked} OJT hours verified`
          : `Logged ${log.hours_worked} OJT hours`,
        description: placement?.employer_name 
          ? `${placement.job_title} at ${placement.employer_name}`
          : 'On-the-job training',
        metadata: { hours: log.hours_worked, verified: log.supervisor_verified },
        created_at: log.created_at,
      });
    }
  }

  // 4. Badges/achievements earned
  const { data: badges } = await supabase
    .from('user_badges')
    .select(`
      id,
      user_id,
      created_at,
      profiles!user_badges_user_id_fkey(full_name, avatar_url),
      badges(name, description, icon)
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  if (badges) {
    for (const b of badges) {
      const profile = b.profiles as any;
      const badge = b.badges as any;
      
      activities.push({
        id: `badge-${b.id}`,
        type: 'badge_earned',
        user_id: b.user_id,
        user_name: profile?.full_name || 'Student',
        user_avatar: profile?.avatar_url,
        title: 'Earned a badge!',
        description: badge?.name || 'Achievement',
        metadata: { badge_icon: badge?.icon },
        created_at: b.created_at,
      });
    }
  }

  // 5. Job placements (hired)
  const { data: placements } = await supabase
    .from('job_placements')
    .select(`
      id,
      user_id,
      created_at,
      profiles!job_placements_user_id_fkey(full_name, avatar_url),
      employer_name,
      job_title
    `)
    .eq('status', 'hired')
    .order('created_at', { ascending: false })
    .limit(5);

  if (placements) {
    for (const p of placements) {
      const profile = p.profiles as any;
      
      activities.push({
        id: `hired-${p.id}`,
        type: 'job_hired',
        user_id: p.user_id,
        user_name: profile?.full_name || 'Graduate',
        user_avatar: profile?.avatar_url,
        title: 'Got hired!',
        description: `${p.job_title} at ${p.employer_name}`,
        created_at: p.created_at,
      });
    }
  }

  // Sort all activities by date and limit
  return activities
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

/**
 * Get activity feed for a specific user
 */
export async function getUserActivityFeed(userId: string, limit = 10): Promise<ActivityItem[]> {
  const supabase = await createClient();
  const activities: ActivityItem[] = [];

  // Get user's notifications as activity
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (notifications) {
    for (const n of notifications) {
      activities.push({
        id: `notif-${n.id}`,
        type: 'milestone',
        user_id: userId,
        user_name: 'You',
        title: n.title,
        description: n.message,
        metadata: n.metadata,
        created_at: n.created_at,
      });
    }
  }

  return activities;
}
