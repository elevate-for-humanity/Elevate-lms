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

// ── Main export ───────────────────────────────────────────────────────────────

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = await createClient();
  const db = createAdminClient();

  // Resolve admin profile once
  let adminProfile: { full_name: string | null; role: string } | null = null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await db.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle();
      adminProfile = data ?? null;
    }
  } catch { /* non-fatal */ }

  // ── All queries in one round-trip ─────────────────────────────────────────
  const [
    studentsRes, programsRes, coursesRes, enrollmentsRes,
    certificatesRes, lessonsRes, partnersRes, atRiskRes,
    pendingEnrollmentsRes, pendingDocsRes, pendingAppsRes,
    allStudentsRes, allEnrollmentsRes, allProgramsRes,
    recentStudentsRes, topCoursesRes, recentApplicationsRes,
    activityLogRes, paymentsRes, blockedProgramsRes, inactiveLearnersRes,
  ] = await Promise.all([
    db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    db.from('programs').select('id', { count: 'exact', head: true }).neq('status', 'archived'),
    db.from('courses').select('id', { count: 'exact', head: true }),
    db.from('program_enrollments').select('id', { count: 'exact', head: true }),
    db.from('certificates').select('id', { count: 'exact', head: true }),
    db.from('course_lessons').select('id', { count: 'exact', head: true }),
    db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'partner'),
    db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('enrollment_status', 'at_risk'),
    db.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('documents').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('applications').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'pending', 'in_review']),
    db.from('profiles').select('enrollment_status').eq('role', 'student'),
    db.from('program_enrollments').select('status, enrolled_at, progress, course_id'),
    db.from('programs').select('id, name, title, status'),
    db.from('profiles')
      .select('id, full_name, email, enrollment_status, created_at, program_enrollments(program_id, programs(name, title))')
      .eq('role', 'student')
      .order('created_at', { ascending: false })
      .limit(10),
    db.from('program_enrollments')
      .select('program_id, status, programs(id, name, title)')
      .not('program_id', 'is', null)
      .limit(1000),
    db.from('applications')
      .select('id, first_name, last_name, full_name, email, program_interest, status, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
    db.from('admin_activity_log')
      .select('id, action, details, timestamp')
      .order('timestamp', { ascending: false })
      .limit(10),
    db.from('payments').select('amount_cents').eq('status', 'paid'),
    db.from('programs')
      .select('id, title, slug, status, updated_at')
      .eq('published', false)
      .neq('status', 'archived')
      .order('updated_at', { ascending: false })
      .limit(8),
    db.from('program_enrollments')
      .select('id, user_id, enrolled_at, profiles(id, full_name, email)')
      .eq('status', 'active')
      .lt('updated_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())
      .order('updated_at', { ascending: true })
      .limit(8),
  ]);

  // ── Enrollment trend ──────────────────────────────────────────────────────
  const enrollmentsByMonth: Record<string, number> = {};
  for (const e of (allEnrollmentsRes.data || [])) {
    if (e.enrolled_at) {
      const m = new Date(e.enrolled_at).toISOString().slice(0, 7);
      enrollmentsByMonth[m] = (enrollmentsByMonth[m] || 0) + 1;
    }
  }
  const trendArray = Object.entries(enrollmentsByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => ({
      month: new Date(key + '-01').toLocaleString('en-US', { month: 'short' }),
      enrollments: count,
    }));

  const lastEnroll  = trendArray.at(-1)?.enrollments ?? 0;
  const prevEnroll  = trendArray.at(-2)?.enrollments ?? 0;
  const enrollDelta = percentChange(lastEnroll, prevEnroll);

  // ── Student status distribution ───────────────────────────────────────────
  const STATUS_LABEL: Record<string, string> = {
    active: 'Active', at_risk: 'At Risk', completed: 'Completed',
    pending: 'Pending', enrolled: 'Enrolled', inactive: 'Inactive',
  };
  const studentStatusMap: Record<string, number> = {};
  for (const s of (allStudentsRes.data || [])) {
    const st = s.enrollment_status || 'pending';
    studentStatusMap[st] = (studentStatusMap[st] || 0) + 1;
  }
  const studentStatuses = Object.entries(studentStatusMap)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({ name: STATUS_LABEL[key] || key, value }));

  // ── Top programs ──────────────────────────────────────────────────────────
  const programTotals: Record<string, { name: string; total: number; completed: number }> = {};
  for (const e of (topCoursesRes.data || [])) {
    const pid = e.program_id;
    if (!pid) continue;
    const prog = e.programs as any;
    const name = prog?.name || prog?.title || pid.slice(0, 8);
    if (!programTotals[pid]) programTotals[pid] = { name, total: 0, completed: 0 };
    programTotals[pid].total += 1;
    if (e.status === 'completed') programTotals[pid].completed += 1;
  }
  const topPrograms = Object.entries(programTotals)
    .map(([id, p]) => ({
      id,
      name: p.name,
      learners: toSafeNumber(p.total),
      completed: toSafeNumber(p.completed),
      completionRate: p.total > 0 ? clampPercent((p.completed / p.total) * 100) : 0,
    }))
    .sort((a, b) => b.learners - a.learners)
    .slice(0, 8);

  // ── Recent students (with resolved hrefs) ─────────────────────────────────
  const recentStudents = (recentStudentsRes.data ?? []).map((s: any) => {
    const enrollment = Array.isArray(s.program_enrollments) ? s.program_enrollments[0] : null;
    const program = enrollment?.programs;
    return {
      id: s.id,
      full_name: s.full_name ?? null,
      email: s.email ?? null,
      enrollment_status: s.enrollment_status ?? null,
      created_at: s.created_at ?? null,
      program_name: (program as any)?.name ?? (program as any)?.title ?? null,
      href: `/admin/students/${s.id}`,
    };
  });

  // ── Recent applications (with resolved hrefs) ─────────────────────────────
  const recentApplications = (recentApplicationsRes.data ?? []).map((app: any) => ({
    id: app.id,
    first_name: app.first_name ?? null,
    last_name: app.last_name ?? null,
    full_name: app.full_name ?? null,
    program_interest: app.program_interest ?? null,
    status: app.status ?? 'pending',
    created_at: app.created_at,
    href: `/admin/applications/review/${app.id}`,
  }));

  // ── Blocked programs (with resolved hrefs) ────────────────────────────────
  const blockedPrograms = (blockedProgramsRes.data ?? []).map((p: any) => ({
    id: p.id,
    title: p.title ?? 'Untitled',
    slug: p.slug ?? '',
    status: p.status ?? 'draft',
    updatedAt: p.updated_at ?? '',
    href: `/admin/programs/${p.id}`,
  }));

  // ── Inactive learners (with resolved hrefs) ───────────────────────────────
  const inactiveLearners = (inactiveLearnersRes.data ?? []).map((e: any) => ({
    enrollmentId: e.id,
    userId: e.user_id,
    enrolledAt: e.enrolled_at ?? '',
    fullName: (e.profiles as any)?.full_name ?? null,
    email: (e.profiles as any)?.email ?? null,
    href: `/admin/students/${e.user_id}`,
  }));

  // ── Activity feed ─────────────────────────────────────────────────────────
  const activityItems: { id: string; label: string; created_at: string }[] = [];
  for (const row of activityLogRes.data ?? []) {
    const details = row.details as Record<string, string> | null;
    const who  = details?.student_name || details?.name || details?.email || '';
    const what = details?.program || details?.program_name || '';
    activityItems.push({ id: `log-${row.id}`, label: [row.action, who, what].filter(Boolean).join(' — '), created_at: row.timestamp });
  }
  if (activityItems.length < 5) {
    for (const app of recentApplicationsRes.data ?? []) {
      const name = [app.first_name, app.last_name].filter(Boolean).join(' ') || app.full_name || 'Applicant';
      activityItems.push({ id: `app-${app.id}`, label: `${name} applied for ${app.program_interest || 'a program'}`, created_at: app.created_at });
    }
  }
  if (activityItems.length < 8) {
    for (const s of recentStudents.slice(0, 5)) {
      activityItems.push({ id: `enroll-${s.id}`, label: `${s.full_name || 'Student'} registered${s.program_name ? ` — ${s.program_name}` : ''}`, created_at: s.created_at ?? new Date().toISOString() });
    }
  }
  const recentActivity = activityItems
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)
    .map(a => ({
      id: a.id,
      title: a.label,
      timestamp: new Date(a.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
    }));

  // ── Revenue ───────────────────────────────────────────────────────────────
  const revenueDollars = Math.round(
    (paymentsRes.data ?? []).reduce((sum, row) => sum + Number(row.amount_cents ?? 0), 0) / 100
  );

  const pendingApplications = pendingAppsRes.count ?? 0;

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpis = [
    {
      label: 'Active Learners',
      value: enrollmentsRes.count ?? 0,
      delta: enrollDelta,
      deltaLabel: 'vs last month',
      href: '/admin/enrollments',
      urgent: (atRiskRes.count ?? 0) > 0,
    },
    {
      label: 'Pending Applications',
      value: pendingApplications,
      delta: 0,
      deltaLabel: 'awaiting review',
      href: '/admin/applications?status=pending',
      urgent: pendingApplications > 0,
    },
    {
      label: 'Revenue Collected',
      value: revenueDollars,
      delta: 0,
      deltaLabel: 'total collected',
      href: '/admin/payroll',
    },
    {
      label: 'Certificates Issued',
      value: certificatesRes.count ?? 0,
      delta: 0,
      deltaLabel: `of ${studentsRes.count ?? 0} students`,
      href: '/admin/certificates',
    },
  ];

  return {
    kpis,
    enrollmentTrend: trendArray,
    studentStatuses,
    topPrograms,
    recentActivity,
    recentStudents,
    recentApplications,
    blockedPrograms,
    inactiveLearners,
    profile: adminProfile,
    generatedAt: new Date().toISOString(),
  };
}
