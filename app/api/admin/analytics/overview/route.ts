import { requireAdmin } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';

// app/api/admin/analytics/overview/route.ts
// Real-time analytics overview
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from "@/lib/supabase/admin";
import { withAuth } from '@/lib/with-auth';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

const _GET = withAuth(
  async (req: NextRequest, user) => {

  const supabase = await getAdminClient();
  const db = supabase;
  const tenantId = req.headers.get('x-tenant-id');

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
  }

  const now = new Date();
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
  const todayStart = new Date(now.setHours(0, 0, 0, 0));

  // Active users (last 15 minutes)
  const { data: activeUsers } = await db
    .from('user_activity_events')
    .select('user_id')
    .eq('tenant_id', tenantId)
    .gte('created_at', fifteenMinutesAgo.toISOString());

  const uniqueActiveUsers = new Set(activeUsers?.map(u => u.user_id) || []).size;

  // Courses in progress
  const { count: coursesInProgress } = await db
    .from('course_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'in_progress');

  // Completions today
  const { count: completionsToday } = await db
    .from('course_completions')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('completed_at', todayStart.toISOString());

  // New enrollments today
  const { count: enrollmentsToday } = await db
    .from('course_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('created_at', todayStart.toISOString());

  return NextResponse.json({
    activeUsers: uniqueActiveUsers,
    coursesInProgress: coursesInProgress || 0,
    completionsToday: completionsToday || 0,
    enrollmentsToday: enrollmentsToday || 0,
    timestamp: new Date().toISOString()
  });

  },
  { roles: ['admin', 'super_admin'] }
);
export const GET = withApiAudit('/api/admin/analytics/overview', _GET);
