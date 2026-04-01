// lib/admin/get-admin-dashboard-data.ts
// Single aggregation function for the admin dashboard.
// All DB queries run here. All route strings are resolved here.
// Nothing downstream needs to build a URL.
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { AdminDashboardData } from '@/components/admin/dashboard/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function toSafeNumber(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function percentChange(current: number, previous: number): number {
  if (!previous && !current) return 0;
  if (!previous) return 100;
  return Math.round(((current - previous) / previous) * 100);
}

function monthWindow(date = new Date()) {
  const currentStart  = new Date(date.getFullYear(), date.getMonth(), 1);
  const currentEnd    = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  const previousStart = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  const previousEnd   = currentStart;
  return {
    currentStart:  currentStart.toISOString(),
    currentEnd:    currentEnd.toISOString(),
    previousStart: previousStart.toISOString(),
    previousEnd:   previousEnd.toISOString(),
  };
}

function sumCents(rows: Array<{ amount_paid_cents?: number | null }>): number {
  return rows.reduce((sum, row) => sum + (row.amount_paid_cents ?? 0), 0);
}

function formatUsdFromCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = await createClient();
  const db = createAdminClient();

  let adminProfile: { full_name: string | null; role: string } | null = null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await db.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle();
      adminProfile = data ?? null;
    }
  } catch { /* non-fatal */ }

  const { currentStart, currentEnd, previousStart, previousEnd } = monthWindow();

  const [
    activeLearnersRes,
    currentActiveRes,
    previousActiveRes,
    currentPendingAppsRes,
    previousPendingAppsRes,
    currentCertificatesRes,
    previousCertificatesRes,
    certificatesTotalRes,
    currentRevenueRes,
    previousRevenueRes,
    atRiskRes,
    allStudentsRes,
    allEnrollmentsTrendRes,
    topCoursesRes,
    recentStudentsRes,
    recentApplicationsRes,
    activityLogRes,
    blockedProgramsRes,
    inactiveLearnersRes,
  ] = await Promise.all([
    db.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active').gte('created_at', currentStart).lt('created_at', currentEnd),
    db.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active').gte('created_at', previousStart).lt('created_at', previousEnd),
    db.from('applications').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'pending', 'in_review']).gte('created_at', currentStart).lt('created_at', currentEnd),
    db.from('applications').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'pending', 'in_review']).gte('created_at', previousStart).lt('created_at', previousEnd),
    db.from('certificates').select('id', { count: 'exact', head: true }).gte('created_at', currentStart).lt('created_at', currentEnd),
    db.from('certificates').select('id', { count: 'exact', head: true }).gte('created_at', previousStart).lt('created_at', previousEnd),
    db.from('certificates').select('id', { count: 'exact', head: true }),
    db.from('program_enrollments').select('amount_paid_cents').eq('payment_status', 'paid').gte('created_at', currentStart).lt('created_at', currentEnd),
    db.from('program_enrollments').select('amount_paid_cents').eq('payment_status', 'paid').gte('created_at', previousStart).lt('created_at', previousEnd),
    db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('enrollment_status', 'at_risk'),
    db.from('profiles').select('enrollment_status').eq('role', 'student'),
    db.from('program_enrollments').select('enrolled_at').not('enrolled_at', 'is', null).order('enrolled_at', { ascending: true }),
    db.from('program_enrollments').select('program_id, status, programs:program_id(id, name, title)').not('program_id', 'is', null).limit(1000),
    db.from('profiles').select('id, full_name, email, enrollment_status, created_at, program_enrollments(program_id, programs(name, title))').eq('role', 'student').order('created_at', { ascending: false }).limit(10),
    db.from('applications').select('id, first_name, last_name, full_name, email, program_interest, status, created_at').order('created_at', { ascending: false }).limit(8),
    db.from('admin_activity_log').select('id, action, details, timestamp').order('timestamp', { ascending: false }).limit(10),
    db.from('programs').select('id, title, slug, status, updated_at').eq('published', false).neq('status', 'archived').order('updated_at', { ascending: false }).limit(8),
    db.from('program_enrollments').select('id, user_id, enrolled_at, profiles:user_id(id, full_name, email)').eq('status', 'active').lt('updated_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()).order('updated_at', { ascending: true }).limit(8),
  ]);

  // ── KPI values and deltas ─────────────────────────────────────────────────
  const activeLearners      = activeLearnersRes.count ?? 0;
  const activeLearnersDelta = percentChange(currentActiveRes.count ?? 0, previousActiveRes.count ?? 0);

  const pendingApps      = currentPendingAppsRes.count ?? 0;
  const pendingAppsDelta = percentChange(currentPendingAppsRes.count ?? 0, previousPendingAppsRes.count ?? 0);

  const currentRevenueCents  = sumCents(currentRevenueRes.data ?? []);
  const previousRevenueCents = sumCents(previousRevenueRes.data ?? []);
  const revenueDelta         = percentChange(currentRevenueCents, previousRevenueCents);

  const certificatesDelta = percentChange(currentCertificatesRes.count ?? 0, previousCertificatesRes.count ?? 0);

  const kpis = [
    {
      label:      'Active Learners',
      value:      activeLearners,
      delta:      activeLearnersDelta,
      deltaLabel: 'vs last month',
      href:       '/admin/students?status=active',
      urgent:     (atRiskRes.count ?? 0) > 0,
    },
    {
      label:      'Pending Applications',
      value:      pendingApps,
      delta:      pendingAppsDelta,
      deltaLabel: 'vs last month',
      href:       '/admin/applications?status=submitted,pending,in_review',
      urgent:     pendingApps > 0,
    },
    {
      label:      'Revenue Collected',
      value:      currentRevenueCents > 0 ? (formatUsdFromCents(currentRevenueCents) as unknown as number) : 0,
      delta:      revenueDelta,
      deltaLabel: 'vs last month',
      href:       '/admin/enrollments?payment_status=paid',
    },
    {
      label:      'Certificates Issued',
      value:      certificatesTotalRes.count ?? 0,
      delta:      certificatesDelta,
      deltaLabel: 'vs last month',
      href:       '/admin/certificates',
    },
  ];

  // ── Enrollment trend ──────────────────────────────────────────────────────
  const enrollmentsByMonth: Record<string, number> = {};
  for (const e of (allEnrollmentsTrendRes.data ?? [])) {
    if (e.enrolled_at) {
      const m = new Date(e.enrolled_at).toISOString().slice(0, 7);
      enrollmentsByMonth[m] = (enrollmentsByMonth[m] || 0) + 1;
    }
  }
  const enrollmentTrend = Object.entries(enrollmentsByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => ({
      month:       new Date(key + '-01').toLocaleString('en-US', { month: 'short' }),
      enrollments: count,
    }));

  // ── Student status distribution ───────────────────────────────────────────
  const STATUS_LABEL: Record<string, string> = {
    active: 'Active', at_risk: 'At Risk', completed: 'Completed',
    pending: 'Pending', enrolled: 'Enrolled', inactive: 'Inactive',
  };
  const studentStatusMap: Record<string, number> = {};
  for (const s of (allStudentsRes.data ?? [])) {
    const st = s.enrollment_status || 'pending';
    studentStatusMap[st] = (studentStatusMap[st] || 0) + 1;
  }
  const studentStatuses = Object.entries(studentStatusMap)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({ name: STATUS_LABEL[key] || key, value }));

  // ── Top programs ──────────────────────────────────────────────────────────
  const programTotals: Record<string, { name: string; total: number; completed: number }> = {};
  for (const e of (topCoursesRes.data ?? [])) {
    const pid = e.program_id;
    if (!pid) continue;
    const prog = e.programs as { name?: string; title?: string } | null;
    const name = prog?.name || prog?.title || pid.slice(0, 8);
    if (!programTotals[pid]) programTotals[pid] = { name, total: 0, completed: 0 };
    programTotals[pid].total += 1;
    if (e.status === 'completed') programTotals[pid].completed += 1;
  }
  const topPrograms = Object.entries(programTotals)
    .map(([id, p]) => ({
      id,
      name:           p.name,
      learners:       toSafeNumber(p.total),
      completed:      toSafeNumber(p.completed),
      completionRate: p.total > 0 ? clampPercent((p.completed / p.total) * 100) : 0,
    }))
    .sort((a, b) => b.learners - a.learners)
    .slice(0, 8);

  // ── Recent students ───────────────────────────────────────────────────────
  const recentStudents = (recentStudentsRes.data ?? []).map((s: any) => {
    const enrollment = Array.isArray(s.program_enrollments) ? s.program_enrollments[0] : null;
    const program    = enrollment?.programs;
    return {
      id:                s.id,
      full_name:         s.full_name ?? null,
      email:             s.email ?? null,
      enrollment_status: s.enrollment_status ?? null,
      created_at:        s.created_at ?? null,
      program_name:      (program as any)?.name ?? (program as any)?.title ?? null,
      href:              `/admin/students/${s.id}`,
    };
  });

  // ── Recent applications ───────────────────────────────────────────────────
  const recentApplications = (recentApplicationsRes.data ?? []).map((app: any) => ({
    id:               app.id,
    first_name:       app.first_name ?? null,
    last_name:        app.last_name ?? null,
    full_name:        app.full_name ?? null,
    program_interest: app.program_interest ?? null,
    status:           app.status ?? 'submitted',
    created_at:       app.created_at,
    href:             `/admin/applications/review/${app.id}`,
  }));

  // ── Blocked programs ──────────────────────────────────────────────────────
  const blockedPrograms = (blockedProgramsRes.data ?? []).map((p: any) => ({
    id:        p.id,
    title:     p.title ?? 'Untitled',
    slug:      p.slug ?? '',
    status:    p.status ?? 'draft',
    updatedAt: p.updated_at ?? '',
    href:      `/admin/programs/${p.id}`,
  }));

  // ── Inactive learners ─────────────────────────────────────────────────────
  const inactiveLearners = (inactiveLearnersRes.data ?? []).map((e: any) => ({
    enrollmentId: e.id,
    userId:       e.user_id,
    enrolledAt:   e.enrolled_at ?? '',
    fullName:     (e.profiles as any)?.full_name ?? null,
    email:        (e.profiles as any)?.email ?? null,
    href:         `/admin/students/${e.user_id}`,
  }));

  // ── Activity feed — real log entries only, no synthesis ───────────────────
  const recentActivity = (activityLogRes.data ?? []).map((row: any) => {
    const details = row.details as Record<string, string> | null;
    const who  = details?.student_name || details?.name || details?.email || '';
    const what = details?.program || details?.program_name || '';
    return {
      id:        `log-${row.id}`,
      title:     [row.action, who, what].filter(Boolean).join(' — '),
      timestamp: row.timestamp,
    };
  });

  return {
    kpis,
    enrollmentTrend,
    studentStatuses,
    topPrograms,
    recentActivity,
    recentStudents,
    recentApplications,
    blockedPrograms,
    inactiveLearners,
    profile:     adminProfile,
    generatedAt: new Date().toISOString(),
  };
}
