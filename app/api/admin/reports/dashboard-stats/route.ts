/**
 * Dashboard Statistics API
 * Real-time stats for admin dashboard widgets
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireRole(['admin', 'super_admin']);
    const supabase = await createClient();

    const [
      enrollmentsResult,
      applicationsResult,
      inquiriesResult,
      revenueResult,
      programsResult,
      recentEnrollments,
      pendingApplications,
    ] = await Promise.all([
      supabase.from('program_enrollments').select('id', { count: 'exact', head: true }).in('status', ['active', 'enrolled']),
      supabase.from('applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('inquiries').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('payment_logs').select('amount').eq('status', 'completed').gte('completed_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      supabase.from('programs').select('id, title, slug').eq('status', 'active'),
      supabase.from('program_enrollments').select('id, enrolled_at, status, progress_percent, programs ( title ), profiles ( first_name, last_name )').order('enrolled_at', { ascending: false }).limit(10),
      supabase.from('applications').select('id, created_at, programs ( title ), email, first_name, last_name').eq('status', 'pending').order('created_at', { ascending: false }).limit(10),
    ]);

    const totalRevenue = revenueResult.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    const programEnrollments = await Promise.all(
      (programsResult.data || []).map(async (program) => {
        const { count } = await supabase.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('program_id', program.id);
        return { ...program, enrollmentCount: count || 0 };
      })
    );

    return NextResponse.json({
      stats: {
        activeEnrollments: enrollmentsResult.count || 0,
        pendingApplications: applicationsResult.count || 0,
        newInquiries: inquiriesResult.count || 0,
        monthlyRevenue: totalRevenue,
        monthlyRevenueFormatted: `$${(totalRevenue / 100).toLocaleString()}`,
      },
      programs: programEnrollments.sort((a, b) => b.enrollmentCount - a.enrollmentCount),
      recentEnrollments: recentEnrollments.data || [],
      pendingApplications: pendingApplications.data || [],
      updatedAt: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('[dashboard-stats] Error', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
