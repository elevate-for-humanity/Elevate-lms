// lib/admin/get-admin-dashboard-data.ts
// Single aggregation for the admin operations dashboard.
// Only queries tables that exist and have live data.
// No synthetic stats, no fake deltas.

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { AdminDashboardData } from '@/components/admin/dashboard/types';

function toSafeNumber(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function sumCents(rows: Array<{ amount_paid_cents?: number | null }>): number {
  return rows.reduce((sum, r) => sum + (r.amount_paid_cents ?? 0), 0);
}

function monthStart() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = await createClient();
  const db = createAdminClient();

  let adminProfile: { full_name: string | null; role: string } | null = null;
  // Auth is critical — throw if it fails. Profile name resolution is non-critical
  // (greeting degrades to "Admin") but we log the failure so it's not invisible.
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(`Auth user fetch failed in getAdminDashboardData: ${authError.message}`);
  if (user) {
    const { data: profileData, error: profileError } = await db
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) {
      console.error('[getAdminDashboardData] profile fetch failed:', profileError.message);
    } else {
      adminProfile = profileData ?? null;
    }
  }

  const thisMonthStart = monthStart();

  // ── Critical queries — throw immediately on failure ───────────────────────
  // These drive the 4 KPI cards. A DB error here must surface, not silently
  // return zeros that make a broken backend look operational.
  const [
    pendingAppsRes,
    allPendingAppsRes,
    activeEnrollmentsRes,
    revenueAllTimeRes,
    revenueThisMonthRes,
    certsRes,
  ] = await Promise.all([
    db.from('applications')
      .select('id, first_name, last_name, full_name, email, program_interest, program_slug, status, created_at, submitted_at, next_step_due_date, funding_type')
      .in('status', ['submitted', 'pending', 'in_review'])
      .order('created_at', { ascending: true })
      .limit(20),

    db.from('applications')
      .select('id', { count: 'exact', head: true })
      .in('status', ['submitted', 'pending', 'in_review']),

    db.from('program_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),

    db.from('program_enrollments')
      .select('amount_paid_cents')
      .eq('payment_status', 'paid'),

    db.from('program_enrollments')
      .select('amount_paid_cents')
      .eq('payment_status', 'paid')
      .gte('created_at', thisMonthStart),

    db.from('certificates')
      .select('id', { count: 'exact', head: true }),
  ]);

  // Hard fail — error boundary in app/admin/dashboard/error.tsx catches this
  if (pendingAppsRes.error)      throw new Error(`applications query failed: ${pendingAppsRes.error.message}`);
  if (allPendingAppsRes.error)   throw new Error(`applications count failed: ${allPendingAppsRes.error.message}`);
  if (activeEnrollmentsRes.error) throw new Error(`program_enrollments active count failed: ${activeEnrollmentsRes.error.message}`);
  if (revenueAllTimeRes.error)   throw new Error(`program_enrollments revenue (all time) failed: ${revenueAllTimeRes.error.message}`);
  if (revenueThisMonthRes.error) throw new Error(`program_enrollments revenue (this month) failed: ${revenueThisMonthRes.error.message}`);
  if (certsRes.error)            throw new Error(`certificates count failed: ${certsRes.error.message}`);

  // ── Non-critical queries — degrade gracefully on failure ──────────────────
  // Sidebar panels and supplemental lists. A failure here should not crash
  // the whole dashboard — it should just render an empty section.
  const [
    inactiveLearnersRes,
    unpublishedProgramsRes,
    recentStudentsRes,
    enrollmentsByProgramRes,
  ] = await Promise.all([
    db.from('program_enrollments')
      .select('id, user_id, enrolled_at, updated_at, profiles:user_id(id, full_name, email)')
      .eq('status', 'active')
      .lt('updated_at', new Date(Date.now() - 3 * 86400000).toISOString())
      .order('updated_at', { ascending: true })
      .limit(8),

    db.from('programs')
      .select('id, title, slug, status, updated_at')
      .eq('published', false)
      .neq('status', 'archived')
      .order('updated_at', { ascending: false })
      .limit(10),

    db.from('profiles')
      .select('id, full_name, email, enrollment_status, created_at, program_enrollments(program_id, programs(name, title))')
      .eq('role', 'student')
      .order('created_at', { ascending: false })
      .limit(10),

    db.from('program_enrollments')
      .select('program_id, status, programs:program_id(id, name, title)')
      .not('program_id', 'is', null)
      .limit(1000),
  ]);

  // ── Applications with aging ───────────────────────────────────────────────
  const now = Date.now();
  const pendingApps = (pendingAppsRes.data ?? []).map((app: any) => {
    const createdAt = app.submitted_at || app.created_at;
    const ageDays = Math.floor((now - new Date(createdAt).getTime()) / 86400000);
    return {
      id: app.id,
      first_name: app.first_name ?? null,
      last_name: app.last_name ?? null,
      full_name: app.full_name ?? null,
      program_interest: app.program_interest ?? app.program_slug ?? null,
      status: app.status ?? 'submitted',
      created_at: createdAt,
      age_days: ageDays,
      urgent: ageDays >= 3,
      href: `/admin/applications/review/${app.id}`,
    };
  });

  const totalPending = allPendingAppsRes.count ?? 0;
  const urgentApps = pendingApps.filter(a => a.urgent).length;
  const oldestApp = pendingApps[0] ?? null;

  // ── Revenue ───────────────────────────────────────────────────────────────
  const revenueAllTimeCents = sumCents(revenueAllTimeRes.data ?? []);
  const revenueThisMonthCents = sumCents(revenueThisMonthRes.data ?? []);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpis = [
    {
      label: 'Pending Applications',
      value: totalPending,
      delta: 0,
      deltaLabel: urgentApps > 0 ? `${urgentApps} urgent (3+ days old)` : 'None urgent',
      href: '/admin/applications?status=submitted,pending,in_review',
      urgent: totalPending > 0,
      sub: oldestApp
        ? `Oldest: ${oldestApp.age_days}d — ${oldestApp.program_interest || 'unknown program'}`
        : 'No pending applications',
    },
    {
      label: 'Active Enrollments',
      value: activeEnrollmentsRes.count ?? 0,
      delta: 0,
      deltaLabel: `${(inactiveLearnersRes.data ?? []).length} inactive 3+ days`,
      href: '/admin/students?status=active',
      urgent: (inactiveLearnersRes.data ?? []).length > 0,
      sub: `${(inactiveLearnersRes.data ?? []).length} with no activity in 3+ days`,
    },
    {
      label: 'Revenue This Month',
      value: revenueThisMonthCents,
      delta: 0,
      deltaLabel: `$${(revenueAllTimeCents / 100).toLocaleString('en-US')} all time`,
      href: '/admin/enrollments?payment_status=paid',
      urgent: false,
      sub: `$${(revenueAllTimeCents / 100).toLocaleString('en-US')} collected all time`,
    },
    {
      label: 'Certificates Issued',
      value: certsRes.count ?? 0,
      delta: 0,
      deltaLabel: 'All time',
      href: '/admin/certificates',
      urgent: false,
      sub: 'All time total',
    },
  ];

  // ── Blocked programs ──────────────────────────────────────────────────────
  const blockedPrograms = (unpublishedProgramsRes.data ?? []).map((p: any) => ({
    id: p.id,
    title: p.title ?? 'Untitled',
    slug: p.slug ?? '',
    status: p.status ?? 'draft',
    updatedAt: p.updated_at ?? '',
    href: `/admin/programs/${p.id}`,
  }));

  // ── Inactive learners ─────────────────────────────────────────────────────
  const inactiveLearners = (inactiveLearnersRes.data ?? []).map((e: any) => ({
    enrollmentId: e.id,
    userId: e.user_id,
    enrolledAt: e.enrolled_at ?? '',
    fullName: (e.profiles as any)?.full_name ?? null,
    email: (e.profiles as any)?.email ?? null,
    href: `/admin/students/${e.user_id}`,
  }));

  // ── Recent students ───────────────────────────────────────────────────────
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

  // ── Programs by enrollment ────────────────────────────────────────────────
  const programTotals: Record<string, { name: string; total: number; completed: number }> = {};
  for (const e of (enrollmentsByProgramRes.data ?? [])) {
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
      name: p.name,
      learners: toSafeNumber(p.total),
      completed: toSafeNumber(p.completed),
      completionRate: p.total > 0 ? clampPercent((p.completed / p.total) * 100) : 0,
    }))
    .sort((a, b) => b.learners - a.learners)
    .slice(0, 8);

  return {
    counts: {
      pendingApplications:    allPendingAppsRes.count ?? 0,
      activeEnrollments:      activeEnrollmentsRes.count ?? 0,
      revenueThisMonthCents:  revenueThisMonthCents,
      certificatesIssued:     certsRes.count ?? 0,
    },
    kpis,
    enrollmentTrend: [],
    studentStatuses: [],
    topPrograms,
    recentActivity: [],
    recentStudents,
    recentApplications: pendingApps,
    blockedPrograms,
    inactiveLearners,
    profile: adminProfile,
    generatedAt: new Date().toISOString(),
  };
}
