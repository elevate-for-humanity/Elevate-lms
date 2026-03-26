

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

/**
 * Public Metrics API
 * Returns real backend activity metrics that can be verified
 * No authentication required - public data only
 */
async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

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
      supabase.from('profiles').select('id', { count: 'exact', head: true }),

      // Active students (enrolled in last 30 days)
      supabase
        .from('program_enrollments')
        .select('user_id', { count: 'exact', head: true })
        .gte(
          'created_at',
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        )
        .eq('status', 'active'),

      // Total enrollments
      supabase.from('program_enrollments').select('id', { count: 'exact', head: true }),

      // Completed courses
      supabase
        .from('program_enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed'),

      // Total applications
      supabase
        .from('applications')
        .select('id', { count: 'exact', head: true }),

      // Recent logins (last 24 hours)
      supabase
        .from('profiles')
        .select('last_sign_in_at', { count: 'exact', head: true })
        .gte(
          'last_sign_in_at',
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        ),

      // Active courses
      supabase
        .from('training_courses')
        .select('id', { count: 'exact', head: true })
        .eq('is_published', true),

      // Total certificates issued
      supabase
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
    const { data: recentActivity } = await supabase
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
export const GET = withApiAudit('/api/public/metrics', _GET);
