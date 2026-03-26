import { createClient } from '@/lib/supabase/server';

import { NextResponse } from 'next/server';
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Aggregate metrics from various tables
    const [
      studentsResult,
      enrollmentsResult,
      applicationsResult,
      completionsResult,
      revenueResult,
      ticketsResult,
    ] = await Promise.all([
      // Total students
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student'),

      // Active enrollments
      supabase
        .from('program_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),

      // Applications this month
      supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .gte(
          'created_at',
          new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1
          ).toISOString()
        ),

      // Course completions this month
      supabase
        .from('program_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte(
          'updated_at',
          new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1
          ).toISOString()
        ),

      // Revenue this month (from donations)
      supabase
        .from('donations')
        .select('amount')
        .eq('payment_status', 'succeeded')
        .gte(
          'created_at',
          new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1
          ).toISOString()
        ),

      // Open tickets
      supabase
        .from('service_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open'),
    ]);

    // Calculate revenue
    const revenue =
      revenueResult.data?.reduce(
        (sum, d) => sum + parseFloat(d.amount || '0'),
        0
      ) || 0;

    // Get recent performance metrics
    const { data: recentMetrics } = await supabase
      .from('performance_metrics')
      .select('*')
      .gte(
        'date',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0]
      )
      .order('date', { ascending: false });

    // Calculate completion rate
    const totalEnrollments = enrollmentsResult.count || 0;
    const completedEnrollments = completionsResult.count || 0;
    const completionRate =
      totalEnrollments > 0
        ? ((completedEnrollments / totalEnrollments) * 100).toFixed(2)
        : '0.00';

    const metrics = {
      totalStudents: studentsResult.count || 0,
      activeEnrollments: enrollmentsResult.count || 0,
      applicationsThisMonth: applicationsResult.count || 0,
      completionsThisMonth: completionsResult.count || 0,
      revenueThisMonth: revenue,
      openTickets: ticketsResult.count || 0,
      completionRate: parseFloat(completionRate),
      recentMetrics: recentMetrics || [],
    };

    // Update performance_metrics table
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('performance_metrics').upsert([
      {
        metric_name: 'total_students',
        value: metrics.totalStudents,
        date: today,
        category: 'students',
      },
      {
        metric_name: 'active_enrollments',
        value: metrics.activeEnrollments,
        date: today,
        category: 'enrollments',
      },
      {
        metric_name: 'completion_rate',
        value: metrics.completionRate,
        date: today,
        category: 'performance',
      },
      {
        metric_name: 'revenue',
        value: metrics.revenueThisMonth,
        date: today,
        category: 'financial',
      },
      {
        metric_name: 'applications_submitted',
        value: metrics.applicationsThisMonth,
        date: today,
        category: 'applications',
      },
    ]);

    return NextResponse.json({ metrics });
  } catch (error) { 
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/admin/performance', _GET);
