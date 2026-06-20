// app/api/admin/analytics/overview/route.ts
// Real-time analytics overview — reads canonical tables (program_enrollments, profiles,
// program_completion_certificates, user_activity_events).
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { withAuth } from '@/lib/with-auth';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const _GET = withAuth(
  async (req: NextRequest) => {
    const db = await requireAdminClient();
    if (!db) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const [
      activeUsersRes,
      coursesInProgressRes,
      completionsTodayRes,
      enrollmentsTodayRes,
    ] = await Promise.all([
      // Active users: profiles signed in within the last 15 minutes.
      // user_activity_events has no tenant_id column — use profiles.last_sign_in_at instead.
      db
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('last_sign_in_at', fifteenMinutesAgo),

      // Enrollments in progress — canonical table is program_enrollments.
      // course_enrollments is a separate legacy table and is likely empty.
      db
        .from('program_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('enrollment_state', 'active'),

      // Completions today — program_completion_certificates is the canonical cert store.
      db
        .from('program_completion_certificates')
        .select('id', { count: 'exact', head: true })
        .gte('issued_at', todayStart),

      // New enrollments today.
      db
        .from('program_enrollments')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayStart),
    ]);

    return NextResponse.json({
      activeUsers: activeUsersRes.count ?? 0,
      coursesInProgress: coursesInProgressRes.count ?? 0,
      completionsToday: completionsTodayRes.count ?? 0,
      enrollmentsToday: enrollmentsTodayRes.count ?? 0,
      timestamp: new Date().toISOString(),
    });
  },
  { roles: ['admin', 'super_admin'] },
);

export const GET = withApiAudit('/api/admin/analytics/overview', _GET);
