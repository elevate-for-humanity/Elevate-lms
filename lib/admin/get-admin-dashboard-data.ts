import 'server-only';

import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import type { AdminDashboardData } from '@/components/admin/dashboard/types';
import { getProgramCardImage } from '@/lib/images/programImages';

function pct(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function moneyFromCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function monthKey(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'short',
    year: '2-digit',
  });
}

function recentMonthKeys(count: number): string[] {
  const now = new Date();
  return Array.from({ length: count }, (_, offset) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - offset), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
}

async function settledData<T>(promise: PromiseLike<{ data: T | null; error?: unknown }>, fallback: T): Promise<T> {
  try {
    const result = await promise;
    if (result?.error) return fallback;
    return result?.data ?? fallback;
  } catch {
    return fallback;
  }
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const admin = await requireAdminClient();

  const [
    applications,
    enrollments,
    programs,
    certificates,
    leads,
    alerts,
    integrityRows,
    healthRows,
  ] = await Promise.all([
    settledData(
      admin
        .from('applications')
        .select('id, full_name, first_name, last_name, email, status, program_id, program_slug, program_interest, created_at, submitted_at, funding_status')
        .order('created_at', { ascending: false })
        .limit(500),
      [] as any[],
    ),
    settledData(
      admin
        .from('program_enrollments')
        .select('id, user_id, full_name, email, program_id, program_slug, status, enrollment_state, progress_percentage, amount_paid_cents, funding_status, created_at, enrolled_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(1000),
      [] as any[],
    ),
    settledData(
      admin
        .from('programs')
        .select('id, slug, title, name, status, published, is_active, category, created_at')
        .neq('status', 'archived')
        .order('title', { ascending: true })
        .limit(300),
      [] as any[],
    ),
    settledData(
      admin
        .from('program_completion_certificates')
        .select('id, user_id, program_id, issued_at, created_at')
        .order('created_at', { ascending: false })
        .limit(500),
      [] as any[],
    ),
    settledData(
      admin
        .from('leads')
        .select('id, full_name, first_name, last_name, email, status, stage, source, program_interest, created_at')
        .order('created_at', { ascending: false })
        .limit(300),
      [] as any[],
    ),
    settledData(
      admin
        .from('admin_alerts')
        .select('id, alert_type, severity, message, created_at, metadata, details')
        .order('created_at', { ascending: false })
        .limit(50),
      [] as any[],
    ),
    settledData(
      admin
        .from('program_integrity')
        .select('id, slug, title, integrity_score, failing_checks')
        .order('integrity_score', { ascending: true })
        .limit(20),
      [] as any[],
    ),
    settledData(
      admin
        .from('platform_health_checks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20),
      [] as any[],
    ),
  ]);

  const activeEnrollments = enrollments.filter((row: any) =>
    ['active', 'enrolled', 'in_progress', 'onboarding'].includes(String(row.enrollment_state ?? row.status ?? '').toLowerCase()),
  );
  const completedEnrollments = enrollments.filter((row: any) =>
    ['completed', 'graduated'].includes(String(row.enrollment_state ?? row.status ?? '').toLowerCase()),
  );
  const pendingApplications = applications.filter((row: any) =>
    ['pending', 'submitted', 'in_review', 'under_review', 'pending_admin_review'].includes(String(row.status ?? '').toLowerCase()),
  );
  const approvedApplications = applications.filter((row: any) =>
    ['approved', 'enrolled'].includes(String(row.status ?? '').toLowerCase()),
  );
  const certificatesIssued = certificates.length;
  const revenueCents = enrollments.reduce((sum: number, row: any) => sum + Number(row.amount_paid_cents ?? 0), 0);
  const activePrograms = programs.filter((row: any) =>
    row.is_active === true || row.published === true || ['active', 'published'].includes(String(row.status ?? '').toLowerCase()),
  );

  const programTitleById = new Map<string, string>();
  const programSlugById = new Map<string, string>();
  for (const row of programs as any[]) {
    const id = String(row.id ?? '');
    const title = String(row.title ?? row.name ?? row.slug ?? 'Program');
    if (id) programTitleById.set(id, title);
    if (id && row.slug) programSlugById.set(id, String(row.slug));
    if (row.slug) programTitleById.set(String(row.slug), title);
  }

  const statusCounts = enrollments.reduce<Record<string, number>>((acc, row: any) => {
    const status = String(row.enrollment_state ?? row.status ?? 'unknown').toLowerCase();
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});
  const studentStatuses = Object.entries(statusCounts)
    .map(([name, value]) => ({ name: name.replaceAll('_', ' '), value }))
    .sort((a, b) => b.value - a.value);

  const programCounts = activeEnrollments.reduce<Record<string, { learners: number; completed: number; slug: string }>>((acc, row: any) => {
    const id = row.program_id || row.program_slug || 'unassigned';
    const existing = acc[id] ?? { learners: 0, completed: 0, slug: row.program_slug || '' };
    existing.learners += 1;
    if (String(row.enrollment_state ?? row.status) === 'completed') existing.completed += 1;
    acc[id] = existing;
    return acc;
  }, {});
  const topPrograms = Object.entries(programCounts)
    .map(([id, value]) => ({
      id,
      title: programTitleById.get(id) ?? (value.slug || 'Program'),
      slug: value.slug || programSlugById.get(id) || undefined,
      learners: value.learners,
      completed: value.completed,
      completionRate: value.learners ? Math.round((value.completed / value.learners) * 100) : 0,
      image: getProgramCardImage(value.slug || programSlugById.get(id) || ''),
    }))
    .sort((a, b) => b.learners - a.learners)
    .slice(0, 8);

  const trendCounts = enrollments.reduce<Record<string, number>>((acc, row: any) => {
    const key = monthKey(row.enrolled_at ?? row.created_at);
    if (key) acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const applicationTrendCounts = applications.reduce<Record<string, number>>((acc, row: any) => {
    const key = monthKey(row.submitted_at ?? row.created_at);
    if (key) acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const months = recentMonthKeys(6);
  const enrollmentTrend = months.map((key) => ({
    month: monthLabel(key),
    enrollments: trendCounts[key] ?? 0,
    applications: applicationTrendCounts[key] ?? 0,
  }));

  const recentActivity = [
    ...applications.slice(0, 10).map((row: any) => ({
      id: `application-${row.id}`,
      type: 'application' as const,
      title: 'Application received',
      description: `${row.full_name || [row.first_name, row.last_name].filter(Boolean).join(' ') || row.email || 'Applicant'}${row.program_interest ? ` — ${row.program_interest}` : ''}`,
      timestamp: row.submitted_at ?? row.created_at,
      href: `/applications/review/${row.id}`,
    })),
    ...enrollments.slice(0, 10).map((row: any) => ({
      id: `enrollment-${row.id}`,
      type: 'enrollment' as const,
      title: 'Enrollment activity',
      description: `${row.full_name || row.email || 'Learner'} — ${programTitleById.get(String(row.program_id ?? row.program_slug ?? '')) ?? row.program_slug ?? 'Program'}`,
      timestamp: row.updated_at ?? row.enrolled_at ?? row.created_at,
      href: `/students/${row.user_id || row.id}`,
    })),
    ...alerts.slice(0, 8).map((row: any) => ({
      id: `alert-${row.id}`,
      type: 'alert' as const,
      title: row.alert_type ? String(row.alert_type).replaceAll('_', ' ') : 'Platform alert',
      description: row.message || 'Review this operational alert.',
      timestamp: row.created_at,
      href: '/operations',
      severity: row.severity || undefined,
    })),
  ]
    .filter((item) => item.timestamp)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 15);

  const integrityIssues = (integrityRows as any[]).filter((row) => Number(row.integrity_score ?? 100) < 100);
  const criticalAlerts = (alerts as any[]).filter((row) => ['critical', 'high'].includes(String(row.severity ?? '').toLowerCase()));
  const healthProblems = (healthRows as any[]).filter((row) => {
    const status = String(row.status ?? row.health_status ?? '').toLowerCase();
    return status && !['healthy', 'ok', 'operational', 'passing', 'success'].includes(status);
  });

  const conversionRate = pct(approvedApplications.length, applications.length);
  const completionRate = pct(completedEnrollments.length, enrollments.length);

  return {
    kpis: [
      {
        label: 'Active Learners',
        value: activeEnrollments.length,
        href: '/students',
        trend: enrollmentTrend.at(-1)?.enrollments ?? 0,
        trendLabel: 'this month',
      },
      {
        label: 'Pending Applications',
        value: pendingApplications.length,
        href: '/applications',
        trend: conversionRate,
        trendLabel: `${conversionRate}% approved`,
      },
      {
        label: 'Active Programs',
        value: activePrograms.length,
        href: '/programs',
        trend: completionRate,
        trendLabel: `${completionRate}% completion`,
      },
      {
        label: 'Revenue',
        value: revenueCents,
        displayValue: moneyFromCents(revenueCents),
        href: '/funding',
        trend: certificatesIssued,
        trendLabel: `${certificatesIssued} certificates`,
      },
    ],
    enrollmentTrend,
    studentStatuses,
    topPrograms,
    recentActivity,
    alerts: [
      ...criticalAlerts.slice(0, 5).map((row: any) => ({
        id: String(row.id),
        severity: row.severity || 'high',
        title: String(row.alert_type ?? 'Operational alert').replaceAll('_', ' '),
        message: row.message || 'Review the operational alert.',
        href: '/operations',
      })),
      ...integrityIssues.slice(0, 5).map((row: any) => ({
        id: `integrity-${row.id}`,
        severity: Number(row.integrity_score ?? 0) < 70 ? 'high' : 'medium',
        title: `${row.title || row.slug || 'Program'} integrity`,
        message: `${row.integrity_score ?? 0}% integrity — ${Array.isArray(row.failing_checks) ? row.failing_checks.join(', ') : 'review required'}`,
        href: '/operations',
      })),
      ...healthProblems.slice(0, 5).map((row: any, index: number) => ({
        id: `health-${row.id ?? index}`,
        severity: 'high',
        title: row.name || row.service || 'Platform health',
        message: row.message || row.error || `Status: ${row.status ?? row.health_status ?? 'unknown'}`,
        href: '/system-health',
      })),
    ].slice(0, 10),
    quickStats: {
      totalApplications: applications.length,
      approvedApplications: approvedApplications.length,
      activeLearners: activeEnrollments.length,
      completedLearners: completedEnrollments.length,
      certificatesIssued,
      activePrograms: activePrograms.length,
      totalLeads: leads.length,
      conversionRate,
      completionRate,
      revenueCents,
    },
  };
}
