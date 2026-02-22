import { createClient } from '@/lib/supabase/server';

export async function generateWIOAReport(startDate: Date, endDate: Date) {
  const supabase = await createClient();

  const { data: enrollments } = await supabase
    .from('program_enrollments')
    .select(`
      *,
      user:profiles!enrollments_user_id_fkey(full_name, email),
      course:courses!enrollments_course_id_fkey(title, category)
    `)
    .gte('started_at', startDate.toISOString())
    .lte('started_at', endDate.toISOString());

  const report = {
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
    metrics: {
      total_enrollments: enrollments?.length || 0,
      completed: enrollments?.filter(e => e.status === 'completed').length || 0,
      active: enrollments?.filter(e => e.status === 'active').length || 0,
      dropped: enrollments?.filter(e => e.status === 'dropped').length || 0,
    },
    by_category: {} as Record<string, number>,
    enrollments: enrollments || [],
  };

  enrollments?.forEach(enrollment => {
    const category = enrollment.course?.category || 'Uncategorized';
    report.by_category[category] = (report.by_category[category] || 0) + 1;
  });

  return report;
}

export async function scheduleWIOAReports() {
  const now = new Date();
  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const quarterEnd = new Date(quarterStart);
  quarterEnd.setMonth(quarterEnd.getMonth() + 3);

  return generateWIOAReport(quarterStart, quarterEnd);
}

export async function trackWageVerification(userId: string, employerId: string) {
  const supabase = await createClient();

  await supabase.from('audit_logs').insert({
    user_id: userId,
    action: 'wage_verification_requested',
    resource_type: 'employment',
    metadata: { employer_id: employerId, requested_at: new Date().toISOString() },
  });
}
