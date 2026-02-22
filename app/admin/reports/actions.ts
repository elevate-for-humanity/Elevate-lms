'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function generateEnrollmentReport(dateRange: string = '30') {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  
  const daysAgo = parseInt(dateRange);
  const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: enrollments },
    { data: courses },
    { count: totalEnrollments },
  ] = await Promise.all([
    db
      .from('enrollments')
      .select('*, courses(title)')
      .gte('created_at', startDate)
      .order('created_at', { ascending: false }),
    db
      .from('courses')
      .select('id, title'),
    db
      .from('enrollments')
      .select('*', { count: 'exact', head: true }),
  ]);

  // Calculate enrollment by course
  const enrollmentByCourse: Record<string, number> = {};
  enrollments?.forEach(e => {
    const courseTitle = (e.courses as { title: string })?.title || 'Unknown';
    enrollmentByCourse[courseTitle] = (enrollmentByCourse[courseTitle] || 0) + 1;
  });

  // Calculate completion rate
  const completed = enrollments?.filter(e => e.status === 'completed').length || 0;
  const completionRate = enrollments?.length ? (completed / enrollments.length * 100).toFixed(1) : '0';

  return {
    period: `Last ${daysAgo} days`,
    totalEnrollments: totalEnrollments || 0,
    newEnrollments: enrollments?.length || 0,
    completionRate: `${completionRate}%`,
    enrollmentByCourse,
    recentEnrollments: enrollments?.slice(0, 10) || [],
  };
}

export async function generateLeadReport(dateRange: string = '30') {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  
  const daysAgo = parseInt(dateRange);
  const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: leads },
    { count: totalLeads },
  ] = await Promise.all([
    db
      .from('leads')
      .select('*')
      .gte('created_at', startDate)
      .order('created_at', { ascending: false }),
    db
      .from('leads')
      .select('*', { count: 'exact', head: true }),
  ]);

  // Calculate leads by source
  const leadsBySource: Record<string, number> = {};
  leads?.forEach(l => {
    const source = l.source || 'unknown';
    leadsBySource[source] = (leadsBySource[source] || 0) + 1;
  });

  // Calculate leads by status
  const leadsByStatus: Record<string, number> = {};
  leads?.forEach(l => {
    leadsByStatus[l.status] = (leadsByStatus[l.status] || 0) + 1;
  });

  // Calculate conversion rate (enrolled / total)
  const enrolled = leads?.filter(l => l.status === 'enrolled').length || 0;
  const conversionRate = leads?.length ? (enrolled / leads.length * 100).toFixed(1) : '0';

  return {
    period: `Last ${daysAgo} days`,
    totalLeads: totalLeads || 0,
    newLeads: leads?.length || 0,
    conversionRate: `${conversionRate}%`,
    leadsBySource,
    leadsByStatus,
    recentLeads: leads?.slice(0, 10) || [],
  };
}

export async function generateFinancialReport(dateRange: string = '30') {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  
  const daysAgo = parseInt(dateRange);
  const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: wotcApps },
    { data: grantApps },
  ] = await Promise.all([
    db
      .from('wotc_applications')
      .select('*')
      .eq('status', 'approved'),
    db
      .from('grant_applications')
      .select('*')
      .eq('status', 'approved'),
  ]);

  const totalWOTCCredits = wotcApps?.reduce((sum, app) => 
    sum + (parseFloat(app.tax_credit_amount) || 0), 0) || 0;
  
  const totalGrantsAwarded = grantApps?.reduce((sum, app) => 
    sum + (parseFloat(app.amount_awarded) || 0), 0) || 0;

  return {
    period: `Last ${daysAgo} days`,
    wotcCredits: totalWOTCCredits,
    grantsAwarded: totalGrantsAwarded,
    totalFunding: totalWOTCCredits + totalGrantsAwarded,
    wotcApplications: wotcApps?.length || 0,
    grantApplications: grantApps?.length || 0,
  };
}

export async function generateUserActivityReport(dateRange: string = '30') {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  
  const daysAgo = parseInt(dateRange);
  const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: users },
    { count: totalUsers },
    { data: recentUsers },
  ] = await Promise.all([
    db
      .from('profiles')
      .select('role')
      .not('role', 'is', null),
    db
      .from('profiles')
      .select('*', { count: 'exact', head: true }),
    db
      .from('profiles')
      .select('*')
      .gte('created_at', startDate)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  // Count by role
  const usersByRole: Record<string, number> = {};
  users?.forEach(u => {
    const role = u.role || 'user';
    usersByRole[role] = (usersByRole[role] || 0) + 1;
  });

  return {
    period: `Last ${daysAgo} days`,
    totalUsers: totalUsers || 0,
    newUsers: recentUsers?.length || 0,
    usersByRole,
    recentUsers: recentUsers || [],
  };
}

export async function exportReportAsCSV(reportType: string, data: Record<string, unknown>) {
  // Convert report data to CSV format
  let csv = '';
  
  if (reportType === 'enrollment' && data.recentEnrollments) {
    csv = 'Date,Course,Status\n';
    (data.recentEnrollments as Array<{ created_at: string; courses: { title: string }; status: string }>).forEach(e => {
      csv += `${new Date(e.created_at).toLocaleDateString()},${e.courses?.title || 'N/A'},${e.status}\n`;
    });
  } else if (reportType === 'leads' && data.recentLeads) {
    csv = 'Date,Name,Email,Source,Status\n';
    (data.recentLeads as Array<{ created_at: string; first_name: string; last_name: string; email: string; source: string; status: string }>).forEach(l => {
      csv += `${new Date(l.created_at).toLocaleDateString()},${l.first_name} ${l.last_name},${l.email},${l.source},${l.status}\n`;
    });
  }

  return csv;
}
