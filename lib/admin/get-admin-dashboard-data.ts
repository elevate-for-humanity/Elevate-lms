import 'server-only';

import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type {
  AdminDashboardData,
  DegradedSection,
  RecentApplication,
  RecentPayment,
} from '@/components/admin/dashboard/types';
import {
  calculatePriorityScore,
  scoreSeverity,
  sortPriorityItems,
  type PriorityItem,
} from '@/lib/admin/priority-score';
import { getSystemHealth } from './dashboard/get-system-health';
import { isTestOrSuspiciousPayment } from './dashboard/format-metrics';

function n(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}
function dollarsToCents(value: unknown): number {
  return Math.round(n(value) * 100);
}
function isTestRecord(...values: unknown[]): boolean {
  const value = values.filter(Boolean).join(' ');
  return /\b(sample|test|demo|example|placeholder|qa[-_\s]?e2e)\b|@qa\.invalid\b|^[A-Za-z0-9_-]{30,}$/i.test(value);
}
function monthKey(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
function safeRows<T>(result: { data: T[] | null; error: unknown }, degraded: DegradedSection[], section?: DegradedSection): T[] {
  if (result.error) {
    if (section && !degraded.includes(section)) degraded.push(section);
    return [];
  }
  return result.data ?? [];
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = await createClient();
  const db = await requireAdminClient();
  const degradedSections: DegradedSection[] = [];
  const now = Date.now();
  const todayIso = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

  const auth = await supabase.auth.getUser();
  const userId = auth.data.user?.id ?? null;

  const [
    profileRes,
    applicationsRes,
    enrollmentsRes,
    studentsRes,
    certificatesRes,
    holdersRes,
    holderDocsRes,
    recentEnrollmentsRes,
    complianceRes,
    leadsRes,
    wioaDocsRes,
    submissionsRes,
    programsRes,
    stripeSessionsRes,
    barberSubsRes,
    cosmetologySubsRes,
    barberPaymentsRes,
    revenueAllTimeRes,
    revenueThisMonthRes,
    systemHealth,
  ] = await Promise.all([
    userId ? db.from('profiles').select('full_name,role').eq('id', userId).maybeSingle() : Promise.resolve({ data: null, error: null }),
    db.from('applications').select('id,first_name,last_name,full_name,email,status,program_interest,program_slug,created_at,submitted_at').order('created_at', { ascending: false }).limit(300),
    db.from('program_enrollments').select('id,user_id,full_name,email,status,enrollment_state,program_id,program_slug,enrolled_at,created_at,updated_at,amount_paid_cents,your_revenue_cents,funding_source,access_granted_at,revoked_at').order('created_at', { ascending: false }).limit(1000),
    db
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student')
      .like('email', '%@%')
      .not('email', 'ilike', '%@qa.invalid')
      .not('full_name', 'ilike', '[QA%'),
    db.from('certificates').select('id', { count: 'exact', head: true }),
    db.from('program_holder_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('program_holder_documents').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('program_enrollments').select('id,user_id,full_name,email,status,enrollment_state,program_id,program_slug,enrolled_at,created_at').order('created_at', { ascending: false }).limit(25),
    db.from('admin_alerts').select('id,alert_type,severity,message,created_at,resolved').eq('resolved', false).order('created_at', { ascending: false }).limit(50),
    db.from('crm_leads').select('id,full_name,email,status,updated_at').order('updated_at', { ascending: true }).limit(100),
    db.from('documents').select('id', { count: 'exact', head: true }).eq('status', 'pending').ilike('document_type', '%wioa%'),
    db.from('lesson_submissions').select('id,user_id,course_lesson_id,step_type,status,created_at').eq('status', 'pending').limit(100),
    db.from('programs').select('id,title,slug,status,is_active,updated_at').order('title').limit(300),
    db.from('stripe_sessions_staging').select('session_id,email,amount,program_slug,kind,payment_status,created_at').in('payment_status', ['paid', 'completed']).order('created_at', { ascending: false }).limit(100),
    db.from('barber_subscriptions').select('id,customer_email,customer_name,amount_paid_at_checkout,created_at').gt('amount_paid_at_checkout', 0).order('created_at', { ascending: false }).limit(100),
    db.from('cosmetology_subscriptions').select('id,customer_email,customer_name,amount_paid_at_checkout,created_at').gt('amount_paid_at_checkout', 0).order('created_at', { ascending: false }).limit(100),
    db.from('barber_payments').select('id,amount_paid,payment_date,created_at').gt('amount_paid', 0).order('created_at', { ascending: false }).limit(100),
    db.rpc('get_revenue_all_time'),
    db.rpc('get_revenue_this_month'),
    getSystemHealth(db),
  ]);

  const applications = safeRows(applicationsRes, degradedSections, 'dashboard_data').filter((row: any) => !isTestRecord(row.full_name, row.first_name, row.last_name, row.email));
  const enrollments = safeRows(enrollmentsRes, degradedSections, 'dashboard_data');
  const recentEnrollmentRows = safeRows(recentEnrollmentsRes, degradedSections, 'recent_students');
  const programRows = safeRows(programsRes, degradedSections, 'unpublished_programs');
  const complianceRows = complianceRes.error ? [] : complianceRes.data ?? [];
  const leadRows = leadsRes.error ? [] : leadsRes.data ?? [];
  const submissionRows = submissionsRes.error ? [] : submissionsRes.data ?? [];

  const pendingStatuses = new Set(['pending', 'submitted', 'in_review', 'under_review', 'pending_admin_review']);
  const pendingApplications: RecentApplication[] = applications
    .filter((row: any) => pendingStatuses.has(String(row.status ?? 'submitted')))
    .map((row: any) => {
      const createdAt = row.submitted_at || row.created_at || new Date().toISOString();
      const ageDays = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 86_400_000));
      return {
        id: row.id,
        first_name: row.first_name ?? null,
        last_name: row.last_name ?? null,
        full_name: row.full_name ?? null,
        email: row.email ?? null,
        program_interest: row.program_interest ?? row.program_slug ?? null,
        status: row.status ?? 'submitted',
        created_at: createdAt,
        submitted_at: row.submitted_at ?? null,
        age_days: ageDays,
        urgent: ageDays >= 3,
        href: `/applications/review/${row.id}`,
      };
    })
    .sort((a, b) => b.age_days - a.age_days);

  const recentApplications: RecentApplication[] = applications.slice(0, 15).map((row: any) => {
    const createdAt = row.submitted_at || row.created_at || new Date().toISOString();
    const ageDays = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 86_400_000));
    return {
      id: row.id,
      first_name: row.first_name ?? null,
      last_name: row.last_name ?? null,
      full_name: row.full_name ?? null,
      email: row.email ?? null,
      program_interest: row.program_interest ?? row.program_slug ?? null,
      status: row.status ?? 'submitted',
      created_at: createdAt,
      submitted_at: row.submitted_at ?? null,
      age_days: ageDays,
      urgent: ageDays >= 3,
      href: `/applications/review/${row.id}`,
    };
  });

  const activeEnrollments = enrollments.filter((row: any) =>
    !row.revoked_at && ['active', 'enrolled', 'in_progress'].includes(String(row.enrollment_state ?? row.status ?? '')),
  );

  const programTitleById = new Map(programRows.map((row: any) => [row.id, row.title || row.slug || 'Program']));
  const recentStudents = recentEnrollmentRows.slice(0, 15).map((row: any) => ({
    id: row.user_id || row.id,
    full_name: row.full_name ?? null,
    email: row.email ?? null,
    enrollment_status: row.enrollment_state ?? row.status ?? null,
    created_at: row.enrolled_at ?? row.created_at ?? null,
    program_name: programTitleById.get(row.program_id) ?? row.program_slug ?? null,
    href: `/students/${row.user_id || row.id}`,
  }));

  const statusCounts = activeEnrollments.reduce<Record<string, number>>((acc, row: any) => {
    const key = String(row.enrollment_state ?? row.status ?? 'unknown');
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const studentStatuses = Object.entries(statusCounts).map(([name, value]) => ({ name: name.replaceAll('_', ' '), value })).sort((a, b) => b.value - a.value);

  const programCounts = activeEnrollments.reduce<Record<string, { learners: number; completed: number; slug: string }>>((acc, row: any) => {
    const id = row.program_id || row.program_slug || 'unassigned';
    const existing = acc[id] ?? { learners: 0, completed: 0, slug: row.program_slug || '' };
    existing.learners += 1;
    if (String(row.enrollment_state ?? row.status) === 'completed') existing.completed += 1;
    acc[id] = existing;
    return acc;
  }, {});
  const topPrograms = Object.entries(programCounts).map(([id, value]) => ({
    id,
    title: programTitleById.get(id) ?? value.slug ?? 'Program',
    slug: value.slug || undefined,
    learners: value.learners,
    completed: value.completed,
    completionRate: value.learners ? Math.round((value.completed / value.learners) * 100) : 0,
  })).sort((a, b) => b.learners - a.learners).slice(0, 8);

  const trendCounts = enrollments.reduce<Record<string, number>>((acc, row: any) => {
    const key = monthKey(row.enrolled_at ?? row.created_at);
    if (key) acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const enrollmentTrend = Array.from({ length: 12 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (11 - index));
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return { month: date.toLocaleDateString('en-US', { month: 'short' }), enrollments: trendCounts[key] ?? 0 };
  });

  const recentPayments: RecentPayment[] = [];
  for (const row of stripeSessionsRes.error ? [] : stripeSessionsRes.data ?? []) {
    recentPayments.push({ id: row.session_id, email: row.email ?? null, amountCents: n(row.amount), label: row.program_slug ?? row.kind ?? null, source: 'stripe', paidAt: row.created_at });
  }
  for (const row of barberSubsRes.error ? [] : barberSubsRes.data ?? []) {
    recentPayments.push({ id: row.id, email: row.customer_email ?? null, amountCents: dollarsToCents(row.amount_paid_at_checkout), label: row.customer_name ?? 'Barber apprenticeship', source: 'barber', paidAt: row.created_at });
  }
  for (const row of cosmetologySubsRes.error ? [] : cosmetologySubsRes.data ?? []) {
    recentPayments.push({ id: row.id, email: row.customer_email ?? null, amountCents: dollarsToCents(row.amount_paid_at_checkout), label: row.customer_name ?? 'Cosmetology apprenticeship', source: 'cosmetology', paidAt: row.created_at });
  }
  for (const row of barberPaymentsRes.error ? [] : barberPaymentsRes.data ?? []) {
    recentPayments.push({ id: row.id, email: null, amountCents: dollarsToCents(row.amount_paid), label: 'Barber recurring', source: 'barber_recurring', paidAt: row.payment_date ?? row.created_at });
  }
  recentPayments.sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
  const verifiedRecentPayments = recentPayments.filter((payment) => !isTestOrSuspiciousPayment(payment));

  if (revenueAllTimeRes.error || revenueThisMonthRes.error) {
    if (!degradedSections.includes('dashboard_data')) degradedSections.push('dashboard_data');
  }
  const revenueAllTimeCents = n(revenueAllTimeRes.data);
  const revenueThisMonthCents = n(revenueThisMonthRes.data);

  const complianceAlerts = complianceRows.map((row: any) => ({
    id: row.id,
    alert_type: row.alert_type ?? null,
    severity: row.severity ?? null,
    title: row.alert_type ? String(row.alert_type).replaceAll('_', ' ') : null,
    description: row.message ?? null,
    created_at: row.created_at ?? null,
  }));

  const staleLeads = leadRows
    .filter((row: any) => !isTestRecord(row.full_name, row.email))
    .map((row: any) => ({
      id: row.id,
      name: row.full_name || row.email || null,
      status: row.status ?? null,
      updated_at: row.updated_at ?? null,
      days_stale: row.updated_at ? Math.max(0, Math.floor((now - new Date(row.updated_at).getTime()) / 86_400_000)) : 0,
      href: `/crm/leads/${row.id}`,
    }))
    .filter((row) => row.days_stale >= 7);

  const inactiveLearners = activeEnrollments
    .filter((row: any) => row.updated_at && now - new Date(row.updated_at).getTime() >= 7 * 86_400_000)
    .map((row: any) => ({
      enrollmentId: row.id,
      userId: row.user_id,
      enrolledAt: row.enrolled_at ?? row.created_at ?? '',
      fullName: row.full_name ?? null,
      email: row.email ?? null,
      daysInactive: Math.floor((now - new Date(row.updated_at).getTime()) / 86_400_000),
      programTitle: programTitleById.get(row.program_id) ?? row.program_slug ?? null,
      href: `/students/${row.user_id}`,
    }));

  const blockedPrograms = programRows.filter((row: any) => row.status !== 'published' || row.is_active === false).map((row: any) => ({
    id: row.id,
    title: row.title ?? 'Untitled',
    slug: row.slug ?? '',
    status: row.status ?? 'draft',
    updatedAt: row.updated_at ?? '',
    href: `/programs/${row.id}`,
  }));

  const pendingSubmissions = submissionRows.map((row: any) => ({
    id: row.id,
    user_id: row.user_id ?? null,
    course_lesson_id: row.course_lesson_id ?? null,
    step_type: row.step_type ?? null,
    submitted_at: row.created_at ?? null,
    status: row.status ?? 'pending',
  }));

  const pendingWioaDocs = wioaDocsRes.error ? 0 : wioaDocsRes.count ?? 0;
  const priorities: PriorityItem[] = [];
  if (pendingApplications.length) {
    const score = calculatePriorityScore({ type: 'enrollment', days: Math.max(0, pendingApplications[0].age_days - 3), money: 2, blocked: true });
    priorities.push({ id: 'pending-applications', type: 'enrollment', label: `${pendingApplications.length} applications awaiting review`, href: '/applications', score, severity: scoreSeverity(score), context: `${pendingApplications.filter((row) => row.urgent).length} are 3+ days old` });
  }
  if (complianceAlerts.length) {
    const score = calculatePriorityScore({ type: 'compliance', risk: 4, blocked: true });
    priorities.push({ id: 'compliance-alerts', type: 'compliance', label: `${complianceAlerts.length} unresolved compliance alerts`, href: '/compliance', score, severity: scoreSeverity(score), context: 'Review current compliance alerts' });
  }
  if (staleLeads.length) {
    const score = calculatePriorityScore({ type: 'lead', days: staleLeads[0]?.days_stale ?? 0, money: 2 });
    priorities.push({ id: 'stale-leads', type: 'lead', label: `${staleLeads.length} stale CRM leads`, href: '/crm/leads', score, severity: scoreSeverity(score), context: 'No activity for 7+ days' });
  }
  if (pendingWioaDocs) {
    const score = calculatePriorityScore({ type: 'wioa', risk: 3, blocked: true });
    priorities.push({ id: 'wioa-docs', type: 'wioa', label: `${pendingWioaDocs} WIOA documents awaiting review`, href: '/wioa/documents', score, severity: scoreSeverity(score), context: 'Funding eligibility may be blocked' });
  }

  const recentActivity = [
    ...recentApplications.map((row) => ({ id: `app-${row.id}`, title: `Application: ${row.full_name || row.email || row.id}`, timestamp: row.created_at })),
    ...recentStudents.map((row) => ({ id: `enr-${row.id}`, title: `Enrollment: ${row.full_name || row.email || row.id}`, timestamp: row.created_at || new Date(0).toISOString() })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 15);

  const newAppsToday = applications.filter((row: any) => (row.created_at ?? '') >= todayIso).length;
  const newEnrollmentsToday = enrollments.filter((row: any) => (row.created_at ?? '') >= todayIso).length;
  const newLeadsToday = leadRows.filter((row: any) => (row.updated_at ?? '') >= todayIso).length;
  const counts = {
    pendingApplications: pendingApplications.length,
    activeEnrollments: activeEnrollments.length,
    revenueThisMonthCents,
    certificatesIssued: certificatesRes.error ? 0 : certificatesRes.count ?? 0,
    pendingProgramHolders: holdersRes.error ? 0 : holdersRes.count ?? 0,
    pendingDocuments: holderDocsRes.error ? 0 : holderDocsRes.count ?? 0,
  };

  const kpis = [
    { label: 'Pending Applications', value: counts.pendingApplications, delta: 0, deltaLabel: 'Live pending count', href: '/applications', urgent: counts.pendingApplications > 0, sub: `${pendingApplications.filter((row) => row.urgent).length} aged 3+ days` },
    { label: 'Active Enrollments', value: counts.activeEnrollments, delta: 0, deltaLabel: 'Live active count', href: '/students?status=active', urgent: inactiveLearners.length > 0, sub: `${inactiveLearners.length} inactive 7+ days` },
    { label: 'Revenue This Month', value: revenueThisMonthCents, delta: 0, deltaLabel: 'Database aggregate', href: '/integrations/stripe', urgent: false, sub: `$${(revenueAllTimeCents / 100).toLocaleString('en-US')} tracked all time` },
    { label: 'Certificates Issued', value: counts.certificatesIssued, delta: 0, deltaLabel: 'Live certificate count', href: '/certificates', urgent: false },
    { label: 'Pending Program Holders', value: counts.pendingProgramHolders, delta: 0, deltaLabel: 'Awaiting approval', href: '/program-holders', urgent: counts.pendingProgramHolders > 0 },
    { label: 'Pending Documents', value: counts.pendingDocuments, delta: 0, deltaLabel: 'Awaiting review', href: '/program-holder-documents', urgent: counts.pendingDocuments > 0 },
  ];

  const profile = profileRes.data ? { full_name: profileRes.data.full_name ?? null, role: profileRes.data.role ?? undefined } : null;
  const isSuperAdmin = profileRes.data?.role === 'super_admin';

  return {
    counts,
    revenueAllTimeCents,
    totalStudents: studentsRes.error ? 0 : studentsRes.count ?? 0,
    recentPayments: verifiedRecentPayments.slice(0, 10),
    operational: {
      needsReview: pendingApplications.length,
      needsReviewDetail: `${pendingApplications.length} applications awaiting review`,
      atRisk: inactiveLearners.length,
      complianceAlerts: complianceAlerts.length,
      complianceAlertsSeverity: complianceAlerts[0]?.severity ?? null,
      newToday: newAppsToday + newEnrollmentsToday + newLeadsToday,
      newTodayDetail: `${newAppsToday} applications · ${newEnrollmentsToday} enrollments · ${newLeadsToday} leads`,
      newAppsToday,
      newLeadsToday,
      newEnrollmentsToday,
      revenueThisMonthCents,
    },
    priorities: sortPriorityItems(priorities),
    kpis,
    enrollmentTrend,
    studentStatuses,
    topPrograms,
    recentActivity,
    recentStudents,
    recentApplications,
    pendingApplications,
    blockedPrograms,
    inactiveLearners,
    pendingSubmissions,
    complianceAlerts,
    staleLeads,
    pendingWioaDocs,
    stalledApplications: pendingApplications.filter((row) => row.age_days >= 7) as unknown as Record<string, unknown>[],
    noOutcomeEnrollments: [],
    missingFundingEnrollments: enrollments.filter((row: any) => !row.funding_source && n(row.amount_paid_cents) === 0) as Record<string, unknown>[],
    profile,
    generatedAt: new Date().toISOString(),
    sitePreviewTargets: [
      { label: 'Public Site', url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org' },
      { label: 'Admin', url: process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.elevateforhumanity.org' },
      { label: 'LMS', url: process.env.NEXT_PUBLIC_LMS_URL || 'https://app.elevateforhumanity.org' },
    ],
    degradedSections,
    systemHealth,
    isSuperAdmin,
  };
}
