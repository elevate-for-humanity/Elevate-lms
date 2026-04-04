// lib/admin/get-admin-dashboard-data.ts
// Single aggregation for the admin operations dashboard.
// Only queries tables that exist and have live data.
// No synthetic stats, no fake deltas.

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import type { AdminDashboardData, DegradedSection } from '@/components/admin/dashboard/types';

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

/**
 * Asserts a critical count query succeeded.
 * Throws — callers must not coerce this to 0 on failure.
 */
function requireCount(
  result: { count: number | null; error: { message: string } | null },
  label: string
): number {
  if (result.error) throw new Error(`${label} query failed: ${result.error.message}`);
  if (result.count == null) throw new Error(`${label} count missing`);
  return result.count;
}

/**
 * Handles a non-critical rows query.
 * On failure: logs server-side, returns empty array, records the degraded section.
 * Never coerces failure into a normal-looking empty result silently.
 */
function optionalRows<T>(
  result: { data: T[] | null; error: { message: string } | null },
  section: DegradedSection,
  degraded: DegradedSection[]
): T[] {
  if (result.error) {
    logger.error(`[dashboard] ${section} query failed`, { message: result.error.message });
    degraded.push(section);
    return [];
  }
  return result.data ?? [];
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

  // Hard fail on critical KPI queries — error boundary in error.tsx catches this.
  // These drive the 4 top-line cards. A broken backend must not look operational.
  if (pendingAppsRes.error)       throw new Error(`applications query failed`);
  if (revenueAllTimeRes.error)    throw new Error(`revenue (all time) query failed`);
  if (revenueThisMonthRes.error)  throw new Error(`revenue (this month) query failed`);

  const totalPendingCount  = requireCount(allPendingAppsRes,    'applications count');
  const activeEnrollCount  = requireCount(activeEnrollmentsRes, 'active enrollments');
  const certsCount         = requireCount(certsRes,             'certificates');

  // Track which non-critical sections failed — UI renders a partial-failure notice.
  const degradedSections: DegradedSection[] = [];

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

  // ── Non-critical supplemental sections ───────────────────────────────────
  const inactiveLearnersData    = optionalRows(inactiveLearnersRes,    'inactive_learners',      degradedSections);
  const unpublishedProgramsData = optionalRows(unpublishedProgramsRes, 'unpublished_programs',   degradedSections);
  const recentStudentsData      = optionalRows(recentStudentsRes,      'recent_students',        degradedSections);
  const enrollmentsByProgramData = optionalRows(enrollmentsByProgramRes, 'enrollments_by_program', degradedSections);

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

  const totalPending = totalPendingCount;
  const urgentApps = pendingApps.filter(a => a.urgent).length;
  const oldestApp = pendingApps[0] ?? null;

  // ── Revenue ───────────────────────────────────────────────────────────────
  // revenueAllTimeRes.error already threw above — .data is safe here.
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
      value: activeEnrollCount,
      delta: 0,
      deltaLabel: degradedSections.includes('inactive_learners')
        ? 'Inactive learner data unavailable'
        : `${inactiveLearnersData.length} inactive 3+ days`,
      href: '/admin/students?status=active',
      urgent: !degradedSections.includes('inactive_learners') && inactiveLearnersData.length > 0,
      sub: degradedSections.includes('inactive_learners')
        ? 'Could not load inactive learner data'
        : `${inactiveLearnersData.length} with no activity in 3+ days`,
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
      value: certsCount,
      delta: 0,
      deltaLabel: 'All time',
      href: '/admin/certificates',
      urgent: false,
      sub: 'All time total',
    },
  ];

  // ── Blocked programs ──────────────────────────────────────────────────────
  const blockedPrograms = unpublishedProgramsData.map((p: any) => ({
    id: p.id,
    title: p.title ?? 'Untitled',
    slug: p.slug ?? '',
    status: p.status ?? 'draft',
    updatedAt: p.updated_at ?? '',
    href: `/admin/programs/${p.id}`,
  }));

  // ── Inactive learners ─────────────────────────────────────────────────────
  const inactiveLearners = inactiveLearnersData.map((e: any) => ({
    enrollmentId: e.id,
    userId: e.user_id,
    enrolledAt: e.enrolled_at ?? '',
    fullName: (e.profiles as any)?.full_name ?? null,
    email: (e.profiles as any)?.email ?? null,
    href: `/admin/students/${e.user_id}`,
  }));

  // ── Recent students ───────────────────────────────────────────────────────
  const recentStudents = recentStudentsData.map((s: any) => {
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
  for (const e of enrollmentsByProgramData) {
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
      pendingApplications:   totalPendingCount,
      activeEnrollments:     activeEnrollCount,
      revenueThisMonthCents: revenueThisMonthCents,
      certificatesIssued:    certsCount,
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
    degradedSections,
  };
}
