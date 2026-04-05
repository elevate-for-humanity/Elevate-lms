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

function lastMonthStart() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString();
}

function lastMonthEnd() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

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

  const thisMonthStart  = monthStart();
  const lastMonthStartS = lastMonthStart();
  const lastMonthEndS   = lastMonthEnd();

  // ── Critical queries — throw immediately on failure ───────────────────────
  const [
    pendingAppsRes,
    allPendingAppsRes,
    activeEnrollmentsRes,
    lastMonthEnrollmentsRes,
    revenueAllTimeRes,
    revenueThisMonthRes,
    revenueLastMonthRes,
    certsRes,
    certsThisMonthRes,
    enrollmentTrendRes,
    studentStatusesRes,
    lastMonthAppsRes,
    recentEnrollmentsRes,
    recentAppsActivityRes,
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

    // Previous month active enrollments for delta
    db.from('program_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .lt('created_at', lastMonthEndS),

    db.from('program_enrollments')
      .select('amount_paid_cents')
      .eq('payment_status', 'paid'),

    db.from('program_enrollments')
      .select('amount_paid_cents')
      .eq('payment_status', 'paid')
      .gte('created_at', thisMonthStart),

    // Last month revenue for delta
    db.from('program_enrollments')
      .select('amount_paid_cents')
      .eq('payment_status', 'paid')
      .gte('created_at', lastMonthStartS)
      .lt('created_at', lastMonthEndS),

    db.from('certificates')
      .select('id', { count: 'exact', head: true }),

    // Certs issued this month
    db.from('certificates')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', thisMonthStart),

    // Enrollment trend — last 12 months from program_enrollments
    db.from('program_enrollments')
      .select('created_at')
      .gte('created_at', new Date(new Date().setMonth(new Date().getMonth() - 11, 1)).toISOString())
      .order('created_at', { ascending: true }),

    // Student status breakdown
    db.from('program_enrollments')
      .select('status'),

    // Last month pending apps count for delta
    db.from('applications')
      .select('id', { count: 'exact', head: true })
      .in('status', ['submitted', 'pending', 'in_review'])
      .gte('created_at', lastMonthStartS)
      .lt('created_at', lastMonthEndS),

    // Recent activity — last 20 enrollments + applications combined
    db.from('program_enrollments')
      .select('id, user_id, created_at, status')
      .order('created_at', { ascending: false })
      .limit(10),

    db.from('applications')
      .select('id, first_name, last_name, full_name, program_interest, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  if (pendingAppsRes.error)       throw new Error(`applications query failed`);
  if (revenueAllTimeRes.error)    throw new Error(`revenue (all time) query failed`);
  if (revenueThisMonthRes.error)  throw new Error(`revenue (this month) query failed`);

  const totalPendingCount    = requireCount(allPendingAppsRes,       'applications count');
  const activeEnrollCount    = requireCount(activeEnrollmentsRes,    'active enrollments');
  const lastMonthEnrollCount = lastMonthEnrollmentsRes.error ? 0 : (lastMonthEnrollmentsRes.count ?? 0);
  const lastMonthAppsCount   = lastMonthAppsRes.error ? 0 : (lastMonthAppsRes.count ?? 0);
  const certsCount           = requireCount(certsRes,                'certificates');
  const certsThisMonth       = certsThisMonthRes.error ? 0 : (certsThisMonthRes.count ?? 0);

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
    // inactive_learners: find active enrollments where the learner has had
    // no lesson_progress activity in 3+ days. Uses lesson_progress.updated_at
    // as the real activity signal — not enrollment.updated_at which reflects
    // admin edits, not learner activity.
    db.from('program_enrollments')
      .select('id, user_id, enrolled_at')
      .eq('status', 'active')
      .not('user_id', 'is', null)
      .order('enrolled_at', { ascending: true })
      .limit(100),

    db.from('programs')
      .select('id, title, slug, status, updated_at')
      .eq('published', false)
      .neq('status', 'archived')
      .order('updated_at', { ascending: false })
      .limit(10),

    // recent_students: select from profiles without the broken nested join.
    // program_enrollments.program_id FK → apprenticeship_programs, not programs,
    // so the nested join programs(name,title) fails. Resolve program names separately.
    db.from('profiles')
      .select('id, full_name, email, created_at')
      .eq('role', 'student')
      .order('created_at', { ascending: false })
      .limit(10),

    // enrollments_by_program: no join — FK points to wrong table (see above).
    db.from('program_enrollments')
      .select('program_id, status')
      .not('program_id', 'is', null)
      .limit(2000),
  ]);

  // ── Non-critical supplemental sections ───────────────────────────────────
  const inactiveLearnersData    = optionalRows(inactiveLearnersRes,    'inactive_learners',      degradedSections);
  const unpublishedProgramsData = optionalRows(unpublishedProgramsRes, 'unpublished_programs',   degradedSections);
  const recentStudentsData      = optionalRows(recentStudentsRes,      'recent_students',        degradedSections);
  const enrollmentsByProgramData = optionalRows(enrollmentsByProgramRes, 'enrollments_by_program', degradedSections);

  // ── Resolve program slugs → titles for applications ───────────────────────
  const rawSlugs = (pendingAppsRes.data ?? [])
    .map((a: any) => a.program_slug ?? a.program_interest)
    .filter(Boolean);
  const uniqueSlugs = [...new Set(rawSlugs)];
  const slugToTitle: Record<string, string> = {};
  if (uniqueSlugs.length > 0) {
    const { data: slugRows } = await db
      .from('programs')
      .select('slug, title, name')
      .in('slug', uniqueSlugs);
    for (const p of slugRows ?? []) {
      if (p.slug) slugToTitle[p.slug] = (p as any).title || (p as any).name || p.slug;
    }
  }

  // ── Applications with aging ───────────────────────────────────────────────
  const now = Date.now();
  const pendingApps = (pendingAppsRes.data ?? []).map((app: any) => {
    const createdAt = app.submitted_at || app.created_at;
    const ageDays = Math.floor((now - new Date(createdAt).getTime()) / 86400000);
    const slug = app.program_slug ?? app.program_interest ?? null;
    const resolvedProgram = slug ? (slugToTitle[slug] ?? slug) : null;
    return {
      id: app.id,
      first_name: app.first_name ?? null,
      last_name: app.last_name ?? null,
      full_name: app.full_name ?? null,
      program_interest: resolvedProgram,
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
  const revenueAllTimeCents   = sumCents(revenueAllTimeRes.data ?? []);
  const revenueThisMonthCents = sumCents(revenueThisMonthRes.data ?? []);
  const revenueLastMonthCents = revenueLastMonthRes.error ? 0 : sumCents(revenueLastMonthRes.data ?? []);

  // ── Enrollment trend — bucket by month ───────────────────────────────────
  const trendBuckets: Record<string, number> = {};
  for (const row of enrollmentTrendRes.data ?? []) {
    const d = new Date((row as any).created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    trendBuckets[key] = (trendBuckets[key] ?? 0) + 1;
  }
  // Build last 12 months in order, filling gaps with 0
  const enrollmentTrend: import('@/components/admin/dashboard/types').EnrollmentTrendPoint[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    enrollmentTrend.push({ month: MONTH_SHORT[d.getMonth()], enrollments: trendBuckets[key] ?? 0 });
  }

  // ── Student status breakdown ──────────────────────────────────────────────
  const statusBuckets: Record<string, number> = {};
  for (const row of studentStatusesRes.data ?? []) {
    const s = (row as any).status ?? 'unknown';
    statusBuckets[s] = (statusBuckets[s] ?? 0) + 1;
  }
  const studentStatuses: import('@/components/admin/dashboard/types').StatusPoint[] = Object.entries(statusBuckets)
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
    .sort((a, b) => b.value - a.value);

  // ── KPI deltas — real month-over-month % change ───────────────────────────
  function pctDelta(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  const enrollDelta  = pctDelta(activeEnrollCount, lastMonthEnrollCount);
  const revDelta     = pctDelta(revenueThisMonthCents, revenueLastMonthCents);
  const appsDelta    = pctDelta(totalPendingCount, lastMonthAppsCount);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpis = [
    {
      label: 'Pending Applications',
      value: totalPending,
      delta: appsDelta,
      deltaLabel: appsDelta !== 0
        ? `${appsDelta > 0 ? '+' : ''}${appsDelta}% vs last month`
        : 'No change vs last month',
      href: '/admin/applications?status=submitted,pending,in_review',
      urgent: totalPending > 0,
      sub: oldestApp
        ? `Oldest: ${oldestApp.age_days}d — ${oldestApp.program_interest || 'unknown program'}`
        : 'No pending applications',
    },
    {
      label: 'Active Enrollments',
      value: activeEnrollCount,
      delta: enrollDelta,
      deltaLabel: enrollDelta !== 0
        ? `${enrollDelta > 0 ? '+' : ''}${enrollDelta}% vs last month`
        : 'No change vs last month',
      href: '/admin/students?status=active',
      urgent: !degradedSections.includes('inactive_learners') && inactiveLearnersData.length > 0,
      sub: degradedSections.includes('inactive_learners')
        ? 'Could not load inactive learner data'
        : `${inactiveLearnersData.length} with no activity in 3+ days`,
    },
    {
      label: 'Revenue This Month',
      value: revenueThisMonthCents,
      delta: revDelta,
      deltaLabel: revDelta !== 0
        ? `${revDelta > 0 ? '+' : ''}${revDelta}% vs last month`
        : 'No change vs last month',
      href: '/admin/enrollments?payment_status=paid',
      urgent: false,
      sub: `$${(revenueAllTimeCents / 100).toLocaleString('en-US')} collected all time`,
    },
    {
      label: 'Certificates Issued',
      value: certsCount,
      delta: certsThisMonth,
      deltaLabel: `${certsThisMonth} issued this month`,
      href: '/admin/certificates',
      urgent: false,
      sub: `${certsThisMonth} issued this month · ${certsCount} all time`,
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
  // Find learners with no lesson_progress activity in 3+ days.
  const allEnrolledUserIds = inactiveLearnersData.map((e: any) => e.user_id).filter(Boolean);
  const cutoff3d = new Date(Date.now() - 3 * 86400000).toISOString();

  // Get user_ids that HAVE had recent activity — exclude them
  const activeUserIds = new Set<string>();
  if (allEnrolledUserIds.length > 0) {
    const { data: recentActivity } = await db
      .from('lesson_progress')
      .select('user_id')
      .in('user_id', allEnrolledUserIds)
      .gte('updated_at', cutoff3d);
    for (const r of recentActivity ?? []) {
      if ((r as any).user_id) activeUserIds.add((r as any).user_id);
    }
  }

  // Inactive = enrolled but no recent lesson_progress
  const inactiveEnrollments = inactiveLearnersData
    .filter((e: any) => !activeUserIds.has(e.user_id))
    .slice(0, 8);

  const inactiveUserIds = inactiveEnrollments.map((e: any) => e.user_id).filter(Boolean);
  const inactiveProfileMap: Record<string, { full_name: string | null; email: string | null }> = {};
  if (inactiveUserIds.length > 0) {
    const { data: inactiveProfiles } = await db
      .from('profiles')
      .select('id, full_name, email')
      .in('id', inactiveUserIds);
    for (const p of inactiveProfiles ?? []) {
      inactiveProfileMap[p.id] = { full_name: (p as any).full_name ?? null, email: (p as any).email ?? null };
    }
  }
  const inactiveLearners = inactiveEnrollments.map((e: any) => ({
    enrollmentId: e.id,
    userId: e.user_id,
    enrolledAt: e.enrolled_at ?? '',
    fullName: inactiveProfileMap[e.user_id]?.full_name ?? null,
    email: inactiveProfileMap[e.user_id]?.email ?? null,
    href: `/admin/students/${e.user_id}`,
  }));

  // ── Recent students ───────────────────────────────────────────────────────
  // Resolve each student's most recent enrollment + program name via separate queries.
  const recentStudentIds = recentStudentsData.map((s: any) => s.id).filter(Boolean);
  const studentProgramMap: Record<string, string | null> = {};
  if (recentStudentIds.length > 0) {
    const { data: enrollmentRows } = await db
      .from('program_enrollments')
      .select('user_id, program_id, status')
      .in('user_id', recentStudentIds)
      .order('created_at', { ascending: false });

    // Collect unique program_ids to look up names
    const seenUsers = new Set<string>();
    const programIdByUser: Record<string, string> = {};
    const enrollStatusByUser: Record<string, string> = {};
    for (const row of enrollmentRows ?? []) {
      const uid = (row as any).user_id;
      if (uid && !seenUsers.has(uid)) {
        seenUsers.add(uid);
        programIdByUser[uid] = (row as any).program_id;
        enrollStatusByUser[uid] = (row as any).status ?? null;
      }
    }
    const uniqueProgramIds = [...new Set(Object.values(programIdByUser))].filter(Boolean);
    if (uniqueProgramIds.length > 0) {
      const { data: programNameRows } = await db
        .from('programs')
        .select('id, name, title')
        .in('id', uniqueProgramIds);
      const nameById: Record<string, string> = {};
      for (const p of programNameRows ?? []) {
        nameById[p.id] = (p as any).name || (p as any).title || p.id.slice(0, 8);
      }
      for (const [uid, pid] of Object.entries(programIdByUser)) {
        studentProgramMap[uid] = nameById[pid] ?? null;
      }
    }
  }
  const recentStudents = recentStudentsData.map((s: any) => ({
    id: s.id,
    full_name: s.full_name ?? null,
    email: s.email ?? null,
    enrollment_status: enrollStatusByUser?.[s.id] ?? null,
    created_at: s.created_at ?? null,
    program_name: studentProgramMap[s.id] ?? null,
    href: `/admin/students/${s.id}`,
  }));

  // ── Programs by enrollment ────────────────────────────────────────────────
  // First pass: aggregate counts by program_id (no join — FK points to wrong table).
  const programTotals: Record<string, { total: number; completed: number }> = {};
  for (const e of enrollmentsByProgramData) {
    const pid = (e as any).program_id as string | null;
    if (!pid) continue;
    if (!programTotals[pid]) programTotals[pid] = { total: 0, completed: 0 };
    programTotals[pid].total += 1;
    if ((e as any).status === 'completed') programTotals[pid].completed += 1;
  }

  // Second pass: fetch program names for the top program IDs only.
  const topProgramIds = Object.entries(programTotals)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 8)
    .map(([id]) => id);

  const programNamesMap: Record<string, string> = {};
  if (topProgramIds.length > 0) {
    const { data: programRows } = await db
      .from('programs')
      .select('id, name, title')
      .in('id', topProgramIds);
    for (const p of programRows ?? []) {
      programNamesMap[p.id] = (p as any).name || (p as any).title || p.id.slice(0, 8);
    }
  }

  const topPrograms = topProgramIds.map(id => {
    const p = programTotals[id];
    return {
      id,
      name: programNamesMap[id] ?? id.slice(0, 8),
      learners: toSafeNumber(p.total),
      completed: toSafeNumber(p.completed),
      completionRate: p.total > 0 ? clampPercent((p.completed / p.total) * 100) : 0,
    };
  });

  // ── Recent activity — merge enrollments + applications, sort by date ────────
  // Resolve profile names for recent enrollment user_ids
  const recentEnrollUserIds = (recentEnrollmentsRes.data ?? [])
    .map((e: any) => e.user_id).filter(Boolean);
  const recentEnrollProfileMap: Record<string, string> = {};
  if (recentEnrollUserIds.length > 0) {
    const { data: rProfiles } = await db
      .from('profiles')
      .select('id, full_name, email')
      .in('id', recentEnrollUserIds);
    for (const p of rProfiles ?? []) {
      recentEnrollProfileMap[p.id] = (p as any).full_name || (p as any).email || 'Unknown';
    }
  }

  const enrollActivityItems = (recentEnrollmentsRes.data ?? []).map((e: any) => ({
    id: `enroll-${e.id}`,
    title: `${recentEnrollProfileMap[e.user_id] ?? 'A student'} enrolled`,
    timestamp: e.created_at,
  }));

  const appActivityItems = (recentAppsActivityRes.data ?? []).map((a: any) => {
    const name = a.full_name || [a.first_name, a.last_name].filter(Boolean).join(' ') || 'Someone';
    return {
      id: `app-${a.id}`,
      title: `${name} applied — ${a.program_interest ?? 'unknown program'}`,
      timestamp: a.created_at,
    };
  });

  const recentActivityItems = [...enrollActivityItems, ...appActivityItems]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 15);

  return {
    counts: {
      pendingApplications:   totalPendingCount,
      activeEnrollments:     activeEnrollCount,
      revenueThisMonthCents: revenueThisMonthCents,
      certificatesIssued:    certsCount,
    },
    kpis,
    enrollmentTrend,
    studentStatuses,
    topPrograms,
    recentActivity: recentActivityItems,
    recentStudents,
    recentApplications: pendingApps,
    blockedPrograms,
    inactiveLearners,
    profile: adminProfile,
    generatedAt: new Date().toISOString(),
    degradedSections,
  };
}
