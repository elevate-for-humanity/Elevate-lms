
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

/**
 * Public Metrics API
 * Returns real backend activity metrics that can be verified
 * No authentication required - public data only
 */
export async function GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    // Get real metrics from database
    const [
      totalUsers,
      activeStudents,
      totalEnrollments,
      completedCourses,
      totalApplications,
      recentLogins,
      activeCourses,
      totalCertificates,
    ] = await Promise.all([
      // Total registered users
      db.from('profiles').select('id', { count: 'exact', head: true }),

      // Active students (enrolled in last 30 days)
      db
        .from('program_enrollments')
        .select('user_id', { count: 'exact', head: true })
        .gte(
          'created_at',
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        )
        .eq('status', 'active'),

      // Total enrollments
      db.from('program_enrollments').select('id', { count: 'exact', head: true }),

      // Completed courses
      db
        .from('program_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed'),

      // Total applications
      db
        .from('applications')
        .select('id', { count: 'exact', head: true }),

      // Recent logins (last 24 hours)
      db
        .from('profiles')
        .select('last_sign_in_at', { count: 'exact', head: true })
        .gte(
          'last_sign_in_at',
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        ),

      // Active courses
      db
        .from('training_courses')
        .select('id', { count: 'exact', head: true })
        .eq('is_published', true),

      // Total certificates issued
      db
        .from('certificates')
        .select('id', { count: 'exact', head: true }),
    ]);

    // Calculate completion rate
    const completionRate =
      totalEnrollments.count && totalEnrollments.count > 0
        ? Math.round(
            ((completedCourses.count || 0) / totalEnrollments.count) * 100
          )
        : 0;

    // Get recent activity (last 10 enrollments - public data only)
    const { data: recentActivity } = await db
      .from('program_enrollments')
      .select('created_at, courses(title)')
      .order('created_at', { ascending: false })
      .limit(10);

    const metrics = {
      timestamp: new Date().toISOString(),
      verified: true,
      metrics: {
        totalUsers: totalUsers.count || 0,
        activeStudents: activeStudents.count || 0,
        totalEnrollments: totalEnrollments.count || 0,
        completedCourses: completedCourses.count || 0,
        totalApplications: totalApplications.count || 0,
        recentLogins24h: recentLogins.count || 0,
        activeCourses: activeCourses.count || 0,
        totalCertificates: totalCertificates.count || 0,
        completionRate,
      },
      recentActivity:
        recentActivity?.map((activity) => ({
          timestamp: activity.created_at,
          courseTitle: activity.courses?.title || 'Course',
          type: 'enrollment',
        })) || [],
      dataSource: 'live_database',
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(metrics, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
