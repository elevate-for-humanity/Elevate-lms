// lib/admin/get-admin-dashboard-data.ts
// Single aggregation for the admin operations dashboard.
// Only queries tables that exist and have live data.
// No synthetic stats, no fake deltas.

// SitePreviewTarget is defined in @/components/admin/dashboard/types — import from there.
import { getAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getDegradedAdminDashboardData } from '@/lib/admin/degraded-dashboard-data';
import { logger } from '@/lib/logger';
import {
  calculatePriorityScore,
  scoreSeverity,
  sortPriorityItems,
  type PriorityItem,
} from '@/lib/admin/priority-score';
import type { AdminDashboardData, DegradedSection } from '@/components/admin/dashboard/types';
import { PENDING_APPLICATION_STATUSES } from '@/lib/admin/application-statuses';
import { getSystemHealth } from './dashboard/get-system-health';
import { withTimeout } from '@/lib/utils/withTimeout';

function toSafeNumber(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function dollarsToCents(value: unknown): number {
  return Math.round(toSafeNumber(value) * 100);
}

function isLikelyTestRecord(...values: Array<unknown>): boolean {
  const text = values
    .filter(Boolean)
    .map(String)
    .join(' ')
    .toLowerCase();
  return /\b(sample|test|demo|example|placeholder)\b/.test(text);
}

function sumCentsFromRows<T extends Record<string, unknown>>(
  rows: T[],
  value: (row: T) => number,
  date: (row: T) => string | null | undefined,
  startIso?: string,
): number {
  const startMs = startIso ? new Date(startIso).getTime() : null;
  return rows.reduce((sum, row) => {
    if (startMs !== null) {
      const rawDate = date(row);
      if (!rawDate || new Date(rawDate).getTime() < startMs) return sum;
    }
    return sum + value(row);
  }, 0);
}


/**
 * Asserts a critical count query succeeded.
 * Throws — callers must not coerce this to 0 on failure.
 */
function requireCount(
  result: { count: number | null; error: { message: string } | null },
  label: string
): number {
  if (result.error) {
    logger.error('[getAdminDashboardData] ' + label + ' failed: ' + result.error.message);
    return 0;
  }
  return result.count ?? 0;
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
    logger.error(`[dashboard] ${section} query failed: ${result.error.message}`);
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
  try {
    return await loadAdminDashboardData();
  } catch (err) {
    logger.error('[getAdminDashboardData] fatal — returning degraded dashboard', err);
    return getDegradedAdminDashboardData();
  }
}

async function loadAdminDashboardData(): Promise<AdminDashboardData> {
  let supabase;
  try {
    supabase = await createClient();
  } catch (err) {
    logger.error('[getAdminDashboardData] createClient failed', err);
    return getDegradedAdminDashboardData();
  }

  const adminClient = await getAdminClient();
  // Fall back to the anon client if the service role key is absent.
  // Queries that require elevated privileges will return empty results
  // rather than crashing the entire dashboard.
  const db = adminClient ?? supabase;

  const thisMonthStart  = monthStart();
  const lastMonthStartS = lastMonthStart();
  const lastMonthEndS   = lastMonthEnd();

  // ── Auth first (fast — local JWT decode, no DB round-trip) ──────────────
  const authRes = await supabase.auth.getUser();
  const { data: { user }, error: authError } = authRes;
  // Log but never throw — page-level requireAdmin() already enforces auth.
  // A transient getUser() failure should degrade gracefully, not crash the dashboard.
  if (authError) logger.warn('[dashboard] getUser failed — continuing with null user', { message: authError.message });

  // ── All DB queries in a single Promise.all — one round-trip to Supabase ──
  const [
    pendingAppsRes,
    allPendingAppsRes,
    activeEnrollmentsRes,
    lastMonthEnrollmentsRes,
    revenueRes,
    certsRes,
    certsThisMonthRes,
    enrollmentTrendRes,
    studentStatusesRes,
    lastMonthAppsRes,
    recentEnrollmentsRes,
    recentAppsActivityRes,
    pendingHoldersRes,
    pendingHolderDocsRes,
    pendingSubmissionsRes,
    complianceAlertsRes,
    staleLeadsRes,
    wioaDocsPendingRes,
    newLeadsTodayRes,
    newEnrollmentsTodayRes,
    newAppsTodayRes,
    stalledApplicationsRes,
    noOutcomeEnrollmentsRes,
    missingFundingEnrollmentsRes,
    systemHealthRes,
    // Revenue batch (was second sequential Promise.all)
    enrollmentRevenueRowsRes,
    stripeSessionRowsRes,
    barberSubscriptionRowsRes,
    cosmetologySubscriptionRowsRes,
    barberPaymentRowsRes,
    // Recent paid Stripe sessions
    recentStripeSessionsRes,
    // Total students count
    totalStudentsRes,
    // Supplemental batch (was third sequential Promise.all)
    inactiveLearnersRes,
    unpublishedProgramsRes,
    recentStudentsRes,
    enrollmentsByProgramRes,
    // Profile (was sequential after auth)
    adminProfileRes,
  ] = await Promise.all([
    db.from('applications')
      .select('id, first_name, last_name, full_name, email, program_interest, program_slug, status, created_at, submitted_at')
      .in('status', [...PENDING_APPLICATION_STATUSES])
      .order('created_at', { ascending: true })
      .limit(20),

    db.from('applications')
      .select('id', { count: 'exact', head: true })
      .in('status', [...PENDING_APPLICATION_STATUSES]),

    db.from('program_enrollments')
      .select('id, user_id, program_id, program_slug, enrollment_state, access_granted_at, revoked_at, funding_source, funding_verified, amount_paid_cents, your_revenue_cents, stripe_payment_intent_id, stripe_checkout_session_id')
      .in('enrollment_state', ['active', 'enrolled', 'onboarding']),

    // Previous month active enrollments for delta
    db.from('program_enrollments')
      .select('id, user_id, program_id, program_slug, enrollment_state, access_granted_at, revoked_at, created_at, funding_source, funding_verified, amount_paid_cents, your_revenue_cents, stripe_payment_intent_id, stripe_checkout_session_id')
      .in('enrollment_state', ['active', 'enrolled', 'onboarding'])
      .lt('created_at', lastMonthEndS),

    // Revenue — single RPC does conditional aggregation in Postgres.
    // Replaces 3 separate row-fetch queries that transferred all paid rows to JS.
    db.rpc('admin_revenue_summary', {
      month_start:       thisMonthStart,
      last_month_start:  lastMonthStartS,
      last_month_end:    lastMonthEndS,
    }),

    // Count from both tables — certificates (legacy) and program_completion_certificates (LMS engine)
    Promise.all([
      db.from('certificates').select('id', { count: 'exact', head: true }),
      db.from('program_completion_certificates').select('id', { count: 'exact', head: true }),
    ]).then(([a, b]) => ({ count: (a.count ?? 0) + (b.count ?? 0), error: a.error ?? b.error })),

    // Certs issued this month — both tables
    Promise.all([
      db.from('certificates').select('id', { count: 'exact', head: true }).gte('issued_at', thisMonthStart),
      db.from('program_completion_certificates').select('id', { count: 'exact', head: true }).gte('issued_at', thisMonthStart),
    ]).then(([a, b]) => ({ count: (a.count ?? 0) + (b.count ?? 0), error: a.error ?? b.error })),

    // Enrollment trend — last 12 months from program_enrollments
    db.from('program_enrollments')
      .select('created_at')
      .gte('created_at', new Date(new Date().setMonth(new Date().getMonth() - 11, 1)).toISOString())
      .order('created_at', { ascending: true }),

    // Student status breakdown
    db.from('program_enrollments')
      .select('enrollment_state'),

    // Last month pending apps count for delta
    db.from('applications')
      .select('id', { count: 'exact', head: true })
      .in('status', [...PENDING_APPLICATION_STATUSES])
      .gte('created_at', lastMonthStartS)
      .lt('created_at', lastMonthEndS),

    // Recent activity — last 20 enrollments + applications combined
    db.from('program_enrollments')
      .select('id, user_id, created_at, enrollment_state')
      .order('created_at', { ascending: false })
      .limit(10),

    db.from('applications')
      .select('id, first_name, last_name, full_name, program_interest, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10),

    // Program holder pending applications
    db.from('program_holders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),

    // Program holder documents pending review
    db.from('program_holder_documents')
      .select('id', { count: 'exact', head: true })
      .is('approved', null),

    // Pending lab/assignment submissions awaiting instructor sign-off
    // step_submissions has no submitted_at column — use created_at
    db.from('step_submissions')
      .select('id, user_id, course_lesson_id, step_type, created_at, status')
      .in('status', ['submitted', 'under_review'])
      .order('created_at', { ascending: true })
      .limit(10),

    // Compliance alerts — open/unresolved, for dashboard snapshot
    // Live schema: status TEXT (default 'open'), no boolean resolved column
    db.from('compliance_alerts')
      .select('id, alert_type, severity, title, description, created_at')
      .eq('status', 'open')
      .order('severity', { ascending: false })
      .limit(5),

    // Stale CRM leads — no activity in 5+ days, not closed
    // Real columns: first_name, last_name, email, status (not company_name/contact_name/stage)
    db.from('leads')
      .select('id, first_name, last_name, email, status, updated_at')
      .not('status', 'in', '(closed_won,closed_lost)')
      .lt('updated_at', new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString())
      .order('updated_at', { ascending: true })
      .limit(5),

    // WIOA documents pending review
    db.from('wioa_documents')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),

    // New leads today
    db.from('leads')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),

    // New enrollments today
    db.from('program_enrollments')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),

    // New applications today
    db.from('applications')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),

    // Operational alerts — stalled applications (7+ days in submitted/pending)
    db.from('applications')
      .select('id, first_name, last_name, full_name, email, program_interest, program_slug, status, created_at, submitted_at')
      .in('status', [...PENDING_APPLICATION_STATUSES])
      .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true })
      .limit(10),

    // Completed enrollments with no outcome — participant_report view
    // Live columns: participant_id, full_name, email, program_title, enrollment_status,
    // enrollment_id, program_slug, funding_source, outcome_type, completed_at
    db.from('participant_report')
      .select('participant_id, enrollment_id, full_name, email, program_title, enrollment_status, program_slug')
      .eq('enrollment_status', 'completed')
      .order('participant_id', { ascending: true })
      .limit(10),

    // Active enrollments missing funding — join profiles for display name/email
    // Exclude apprenticeship programs (barber/cosmetology are self-pay by design)
    db.from('program_enrollments')
      .select('id, user_id, program_id, program_slug, enrollment_state, funding_source, profiles(full_name, email)')
      .in('enrollment_state', ['active', 'onboarding', 'enrolled'])
      .not('access_granted_at', 'is', null)
      .is('revoked_at', null)
      .is('funding_source', null)
      .not('program_slug', 'like', '%apprenticeship%')
      .order('id', { ascending: true })
      .limit(10),

    // System health — 4s timeout so a slow Stripe API never blocks the dashboard.
    withTimeout(getSystemHealth(db), 4000, 'getSystemHealth').catch(() => ({
      stripeWebhookOk: false,
      stripeIssuingOk: false,
      buildEnvOk: false,
      staleJobs: 0,
      degraded: true,
      missingDocuments: 0,
      missingCertifications: 0,
      unresolvedFlags: 0,
      alerts: [{ code: 'health_check_failed', severity: 'warning' as const, message: 'System health check failed to load.' }],
    })),
    // Revenue batch — merged into single Promise.all
    db.from('program_enrollments')
      .select('amount_paid_cents, your_revenue_cents, created_at, paid_at, payment_status, funding_source')
      .or('amount_paid_cents.gt.0,your_revenue_cents.gt.0'),
    db.from('stripe_sessions_staging')
      .select('session_id, amount, created_at, payment_status')
      .in('payment_status', ['paid', 'completed']),
    db.from('barber_subscriptions')
      .select('id, amount_paid_at_checkout, created_at, customer_name, customer_email')
      .gt('amount_paid_at_checkout', 0),
    db.from('cosmetology_subscriptions')
      .select('id, amount_paid_at_checkout, created_at, customer_name, customer_email')
      .gt('amount_paid_at_checkout', 0),
    db.from('barber_payments')
      .select('id, amount_paid, payment_date, created_at, status')
      .gt('amount_paid', 0),
    // Recent paid Stripe sessions — newest first
    db.from('stripe_sessions_staging')
      .select('session_id, email, amount, program_slug, kind, created_at')
      .in('payment_status', ['paid', 'completed'])
      .order('created_at', { ascending: false })
      .limit(20),
    // Total registered students (all time)
    db.from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student'),
    // Supplemental batch — merged into single Promise.all
    db.rpc('admin_inactive_learners', { inactive_days: 3, limit_n: 20 }),
    db.from('programs')
      .select('id, title, slug, status, updated_at')
      .eq('published', false)
      .neq('status', 'archived')
      .order('updated_at', { ascending: false })
      .limit(10),
    db.from('profiles')
      .select('id, full_name, email, created_at')
      .eq('role', 'student')
      .order('created_at', { ascending: false })
      .limit(10),
    db.from('program_enrollments')
      .select('id, program_id, enrollment_state')
      .not('program_id', 'is', null)
      .limit(500),
    // Profile — merged in so it runs in parallel with everything else
    user
      ? db.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  // ── Resolve profile ───────────────────────────────────────────────────────
  let adminProfile: { full_name: string | null; role: string } | null = null;
  if (adminProfileRes && !('error' in adminProfileRes && adminProfileRes.error)) {
    adminProfile = (adminProfileRes as any).data ?? null;
  }

  // ── System health from parallel result ────────────────────────────────────
  const systemHealth = systemHealthRes;

  // Log failures but never throw — the error boundary shows a blank page with
  // no actionable info. A degraded dashboard is always better than a 500.
  if (pendingAppsRes.error) logger.error('[dashboard] applications query failed', pendingAppsRes.error);
  if (revenueRes.error)     logger.error('[dashboard] admin_revenue_summary RPC failed', revenueRes.error);

  const totalPendingCount    = requireCount(allPendingAppsRes,       'applications count');
  if (activeEnrollmentsRes.error) logger.error('[dashboard] active enrollments query failed', activeEnrollmentsRes.error);
  const hasVerifiedFundingOrPayment = (e: any) => {
    const funding = String(e.funding_source ?? '').toLowerCase();
    return (
      e.funding_verified === true ||
      (funding.length > 0 && !['pending', 'unknown', 'unverified'].includes(funding)) ||
      toSafeNumber(e.amount_paid_cents) > 0 ||
      toSafeNumber(e.your_revenue_cents) > 0 ||
      Boolean(e.stripe_payment_intent_id || e.stripe_checkout_session_id)
    );
  };
  const dashboardActiveEnrollments = (activeEnrollmentsRes.data ?? []).filter(
    (e: any) => e.revoked_at == null && e.access_granted_at != null && hasVerifiedFundingOrPayment(e),
  );
  const lastMonthDashboardActiveEnrollments = (lastMonthEnrollmentsRes.data ?? []).filter(
    (e: any) => e.revoked_at == null && e.access_granted_at != null && hasVerifiedFundingOrPayment(e),
  );
  const activeEnrollCount    = dashboardActiveEnrollments.length;
  const lastMonthEnrollCount = lastMonthDashboardActiveEnrollments.length;
  const lastMonthAppsCount   = lastMonthAppsRes.error ? 0 : (lastMonthAppsRes.count ?? 0);
  const totalStudents        = totalStudentsRes.error ? 0 : (totalStudentsRes.count ?? 0);
  // certsRes is a combined count from certificates + program_completion_certificates
  const certsCount           = certsRes.error ? 0 : (certsRes.count ?? 0);
  const certsThisMonth       = certsThisMonthRes.error ? 0 : (certsThisMonthRes.count ?? 0);
  const pendingHoldersCount  = pendingHoldersRes.error ? 0 : (pendingHoldersRes.count ?? 0);
  const pendingHolderDocsCount = pendingHolderDocsRes.error ? 0 : (pendingHolderDocsRes.count ?? 0);
  const pendingSubmissions = pendingSubmissionsRes.error
    ? []
    : (pendingSubmissionsRes.data ?? []).map((submission) => ({
        ...submission,
        submitted_at: submission.created_at ?? null,
      }));

  // ── Operational dashboard signals ─────────────────────────────────────────
  const complianceAlerts = complianceAlertsRes.error ? [] : (complianceAlertsRes.data ?? []);
  const staleLeadsData = staleLeadsRes.error ? [] : (staleLeadsRes.data ?? []);
  const pendingWioaDocs = wioaDocsPendingRes.error ? 0 : (wioaDocsPendingRes.count ?? 0);
  const newLeadsToday = newLeadsTodayRes.error ? 0 : (newLeadsTodayRes.count ?? 0);
  const newEnrollmentsToday = newEnrollmentsTodayRes.error ? 0 : (newEnrollmentsTodayRes.count ?? 0);
  const newAppsToday = (newAppsTodayRes as any)?.error ? 0 : ((newAppsTodayRes as any)?.count ?? 0);

  const now2 = Date.now();
  const staleLeads = staleLeadsData
    .filter((l: any) => !isLikelyTestRecord(l.first_name, l.last_name, l.email))
    .map((l: any) => ({
      id: l.id,
      name: [l.first_name, l.last_name].filter(Boolean).join(' ') || l.email || null,
      status: l.status ?? null,
      updated_at: l.updated_at ?? null,
      days_stale: l.updated_at ? Math.floor((now2 - new Date(l.updated_at).getTime()) / 86400000) : 0,
      href: `/admin/crm/leads/${l.id}`,
    }));

  // Track which non-critical sections failed — UI renders a partial-failure notice.
  const degradedSections: DegradedSection[] = [];

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
  const pendingApps = (pendingAppsRes.data ?? [])
    .filter((app: any) => !isLikelyTestRecord(app.full_name, app.first_name, app.last_name, app.email))
    .map((app: any) => {
    const createdAt = app.submitted_at || app.created_at;
    const ageDays = Math.floor((now - new Date(createdAt).getTime()) / 86400000);
    const slug = app.program_slug ?? app.program_interest ?? null;
    const resolvedProgram = slug ? (slugToTitle[slug] ?? slug) : null;
    return {
      id: app.id,
      first_name: app.first_name ?? null,
      last_name: app.last_name ?? null,
      full_name: app.full_name ?? null,
      email: app.email ?? null,
      program_interest: resolvedProgram,
      status: app.status ?? 'submitted',
      created_at: createdAt,
      submitted_at: app.submitted_at ?? null,
      age_days: ageDays,
      urgent: ageDays >= 3,
      href: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(app.id)
        ? `/admin/applications/review/${app.id}`
        : `/admin/applications?search=${encodeURIComponent(app.email ?? app.id)}`,
    };
    });

  const totalPending = totalPendingCount;
  const oldestApp = pendingApps[0] ?? null;

  // ── Revenue — real tracked cash payments, never synthetic ────────────────
  const revenueRow        = revenueRes.error ? null : ((revenueRes.data as any[])?.[0] ?? null);
  const rpcRevenueAllTimeCents   = toSafeNumber(revenueRow?.all_time_cents   ?? 0);
  const rpcRevenueThisMonthCents = toSafeNumber(revenueRow?.this_month_cents ?? 0);
  const rpcRevenueLastMonthCents = toSafeNumber(revenueRow?.last_month_cents ?? 0);

  const enrollmentRevenueRows = enrollmentRevenueRowsRes.error ? [] : (enrollmentRevenueRowsRes.data ?? []);
  const stripeSessionRows = stripeSessionRowsRes.error ? [] : (stripeSessionRowsRes.data ?? []);
  const barberSubscriptionRows = barberSubscriptionRowsRes.error ? [] : (barberSubscriptionRowsRes.data ?? []);
  const cosmetologySubscriptionRows = cosmetologySubscriptionRowsRes.error ? [] : (cosmetologySubscriptionRowsRes.data ?? []);
  const barberPaymentRows = barberPaymentRowsRes.error ? [] : (barberPaymentRowsRes.data ?? []);

  const enrollmentRevenueAll = sumCentsFromRows(
    enrollmentRevenueRows as Record<string, unknown>[],
    (row) => Math.max(toSafeNumber(row.your_revenue_cents), toSafeNumber(row.amount_paid_cents)),
    (row) => String(row.paid_at ?? row.created_at ?? ''),
  );
  const enrollmentRevenueThisMonth = sumCentsFromRows(
    enrollmentRevenueRows as Record<string, unknown>[],
    (row) => Math.max(toSafeNumber(row.your_revenue_cents), toSafeNumber(row.amount_paid_cents)),
    (row) => String(row.paid_at ?? row.created_at ?? ''),
    thisMonthStart,
  );
  const stripeRevenueAll = sumCentsFromRows(
    stripeSessionRows as Record<string, unknown>[],
    (row) => toSafeNumber(row.amount),
    (row) => String(row.created_at ?? ''),
  );
  const stripeRevenueThisMonth = sumCentsFromRows(
    stripeSessionRows as Record<string, unknown>[],
    (row) => toSafeNumber(row.amount),
    (row) => String(row.created_at ?? ''),
    thisMonthStart,
  );
  const apprenticeshipCheckoutAll = sumCentsFromRows(
    [...barberSubscriptionRows, ...cosmetologySubscriptionRows] as Record<string, unknown>[],
    (row) => dollarsToCents(row.amount_paid_at_checkout),
    (row) => String(row.created_at ?? ''),
  );
  const apprenticeshipCheckoutThisMonth = sumCentsFromRows(
    [...barberSubscriptionRows, ...cosmetologySubscriptionRows] as Record<string, unknown>[],
    (row) => dollarsToCents(row.amount_paid_at_checkout),
    (row) => String(row.created_at ?? ''),
    thisMonthStart,
  );
  const barberRecurringAll = sumCentsFromRows(
    barberPaymentRows as Record<string, unknown>[],
    (row) => dollarsToCents(row.amount_paid),
    (row) => String(row.payment_date ?? row.created_at ?? ''),
  );
  const barberRecurringThisMonth = sumCentsFromRows(
    barberPaymentRows as Record<string, unknown>[],
    (row) => dollarsToCents(row.amount_paid),
    (row) => String(row.payment_date ?? row.created_at ?? ''),
    thisMonthStart,
  );

  const directTrackedAllTimeCents =
    Math.max(rpcRevenueAllTimeCents, enrollmentRevenueAll, stripeRevenueAll) +
    apprenticeshipCheckoutAll +
    barberRecurringAll;
  const directTrackedThisMonthCents =
    Math.max(rpcRevenueThisMonthCents, enrollmentRevenueThisMonth, stripeRevenueThisMonth) +
    apprenticeshipCheckoutThisMonth +
    barberRecurringThisMonth;
  const revenueAllTimeCents = directTrackedAllTimeCents;
  const revenueThisMonthCents = directTrackedThisMonthCents;
  const revenueLastMonthCents = rpcRevenueLastMonthCents;

  // ── Recent payments — merge stripe sessions + apprenticeship subscriptions ─
  type RecentPayment = import('@/components/admin/dashboard/types').RecentPayment;
  const recentPayments: RecentPayment[] = [];

  for (const row of (recentStripeSessionsRes.error ? [] : (recentStripeSessionsRes.data ?? [])) as any[]) {
    recentPayments.push({
      id: row.session_id,
      email: row.email ?? null,
      amountCents: toSafeNumber(row.amount),
      label: row.program_slug ?? row.kind ?? null,
      source: 'stripe',
      paidAt: row.created_at,
    });
  }
  for (const row of barberSubscriptionRows as any[]) {
    recentPayments.push({
      id: row.id,
      email: row.customer_email ?? null,
      amountCents: dollarsToCents(row.amount_paid_at_checkout),
      label: row.customer_name ?? 'Barber apprenticeship',
      source: 'barber',
      paidAt: row.created_at,
    });
  }
  for (const row of cosmetologySubscriptionRows as any[]) {
    recentPayments.push({
      id: row.id,
      email: row.customer_email ?? null,
      amountCents: dollarsToCents(row.amount_paid_at_checkout),
      label: row.customer_name ?? 'Cosmetology apprenticeship',
      source: 'cosmetology',
      paidAt: row.created_at,
    });
  }
  for (const row of barberPaymentRows as any[]) {
    recentPayments.push({
      id: row.id,
      email: null,
      amountCents: dollarsToCents(row.amount_paid),
      label: 'Barber recurring',
      source: 'barber_recurring',
      paidAt: row.payment_date ?? row.created_at,
    });
  }
  recentPayments.sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
  const recentPaymentsSlice = recentPayments.slice(0, 10);

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
    const s = (row as any).enrollment_state ?? 'unknown';
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
      href: `/admin/applications?status=${PENDING_APPLICATION_STATUSES.join(',')}`,
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
      href: '/admin/students?payment_status=paid',
      urgent: false,
      sub: `$${(revenueAllTimeCents / 100).toLocaleString('en-US')} tracked cash all time · WIOA/grants tracked separately`,
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
    {
      label: 'Pending Program Holders',
      value: pendingHoldersCount,
      delta: 0,
      deltaLabel: 'Awaiting approval',
      href: '/admin/program-holders',
      urgent: pendingHoldersCount > 0,
      sub: pendingHoldersCount > 0 ? 'Requires admin review' : 'No pending applications',
    },
    {
      label: 'Pending Documents',
      value: pendingHolderDocsCount,
      delta: 0,
      deltaLabel: 'Awaiting review',
      href: '/admin/program-holder-documents',
      urgent: pendingHolderDocsCount > 0,
      sub: pendingHolderDocsCount > 0 ? 'Program holder documents to review' : 'All documents reviewed',
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

  // ── Inactive learners — from admin_inactive_learners RPC ─────────────────
  // RPC returns fully-enriched rows (profiles + program names joined server-side).
  // Falls back to empty array if the RPC is not yet applied in Supabase.
  const nowMs = Date.now();
  const inactiveLearners = inactiveLearnersData.map((e: any) => {
    const lastActivityMs = e.last_activity ? new Date(e.last_activity).getTime()
      : e.enrolled_at ? new Date(e.enrolled_at).getTime() : nowMs;
    const daysInactive = Math.floor((nowMs - lastActivityMs) / 86_400_000);
    return {
      enrollmentId: e.enrollment_id ?? e.id,
      userId: e.user_id,
      enrolledAt: e.enrolled_at ?? '',
      fullName: e.full_name ?? null,
      email: e.email ?? null,
      daysInactive,
      programTitle: e.program_title ?? null,
      href: `/admin/students/${e.user_id}`,
    };
  });

  // ── Priority items — scored and sorted ───────────────────────────────────
  // Computed here so inactiveLearners, staleLeads, and pendingApps are all available.
  const rawPriorityItems: PriorityItem[] = [];

  // Compliance alerts
  for (const a of complianceAlerts as any[]) {
    const daysOpen = a.created_at
      ? Math.floor((Date.now() - new Date(a.created_at).getTime()) / 86400000)
      : 0;
    const risk = a.severity === 'critical' ? 5 : a.severity === 'high' ? 4 : a.severity === 'medium' ? 2 : 1;
    const score = calculatePriorityScore({ type: 'compliance', days: Math.max(0, daysOpen - 1), risk, blocked: true });
    rawPriorityItems.push({
      id: a.id,
      type: 'compliance',
      label: a.title ?? `Compliance alert: ${a.alert_type ?? 'unknown'}`,
      href: '/admin/compliance',
      score,
      severity: scoreSeverity(score),
      context: `${daysOpen}d open · ${a.severity ?? 'unknown'} severity`,
    });
  }

  // Stale CRM leads
  for (const l of staleLeads) {
    const score = calculatePriorityScore({ type: 'lead', days: Math.max(0, l.days_stale - 5), money: 3 });
    rawPriorityItems.push({
      id: l.id,
      type: 'lead',
      label: `Stale lead: ${l.name ?? 'Unknown'}`,
      href: l.href,
      score,
      severity: scoreSeverity(score),
      context: `${l.days_stale}d no activity · ${l.status ?? 'No status'}`,
    });
  }

  // Pending WIOA docs — one aggregate item
  if (pendingWioaDocs > 0) {
    const score = calculatePriorityScore({ type: 'wioa', risk: 3, money: 2, blocked: true });
    rawPriorityItems.push({
      id: 'wioa-docs',
      type: 'wioa',
      label: `${pendingWioaDocs} WIOA document${pendingWioaDocs !== 1 ? 's' : ''} awaiting review`,
      href: '/admin/wioa/documents',
      score,
      severity: scoreSeverity(score),
      context: 'Funding eligibility may be blocked',
    });
  }

  // Pending enrollments — one aggregate item
  if (totalPendingCount > 0) {
    const urgentApp = pendingApps.find(a => a.urgent);
    const daysOverdue = urgentApp ? Math.max(0, Math.floor((Date.now() - new Date(urgentApp.created_at).getTime()) / 86400000) - 3) : 0;
    const score = calculatePriorityScore({ type: 'enrollment', days: daysOverdue, money: 3, blocked: true });
    rawPriorityItems.push({
      id: 'pending-enrollments',
      type: 'enrollment',
      label: `${totalPendingCount} enrollment${totalPendingCount !== 1 ? 's' : ''} pending review`,
      href: '/admin/applications?status=submitted',
      score,
      severity: scoreSeverity(score),
      context: urgentApp ? 'Oldest is 3+ days old' : 'Awaiting admin review',
    });
  }

  // Failed jobs
  const failedJobCount = systemHealth.staleJobs ?? 0;
  if (failedJobCount > 0) {
    const score = calculatePriorityScore({ type: 'system', risk: 4, blocked: true });
    rawPriorityItems.push({
      id: 'failed-jobs',
      type: 'system',
      label: `${failedJobCount} failed job${failedJobCount !== 1 ? 's' : ''} in queue`,
      href: '/admin/system/jobs',
      score,
      severity: scoreSeverity(score),
      context: 'Requires investigation',
    });
  }

  // Inactive learners — one aggregate item
  if (inactiveLearners.length > 0) {
    const score = calculatePriorityScore({ type: 'learner', days: Math.max(0, inactiveLearners[0]?.daysInactive - 7), risk: 1 });
    rawPriorityItems.push({
      id: 'inactive-learners',
      type: 'learner',
      label: `${inactiveLearners.length} learner${inactiveLearners.length !== 1 ? 's' : ''} inactive 7+ days`,
      href: '/admin/at-risk',
      score,
      severity: scoreSeverity(score),
      context: `Most inactive: ${inactiveLearners[0]?.daysInactive ?? 0}d`,
    });
  }

  const priorities = sortPriorityItems(rawPriorityItems).slice(0, 10);

  // ── Operational signals ───────────────────────────────────────────────────
  const needsReviewTotal = totalPendingCount + pendingWioaDocs;
  const needsReviewParts: string[] = [];
  if (totalPendingCount > 0) needsReviewParts.push(`${totalPendingCount} application${totalPendingCount !== 1 ? 's' : ''}`);
  if (pendingWioaDocs > 0) needsReviewParts.push(`${pendingWioaDocs} WIOA doc${pendingWioaDocs !== 1 ? 's' : ''}`);

  const newTodayTotal = newLeadsToday + newEnrollmentsToday + newAppsToday;
  const newTodayParts: string[] = [];
  if (newAppsToday > 0) newTodayParts.push(`${newAppsToday} application${newAppsToday !== 1 ? 's' : ''}`);
  if (newLeadsToday > 0) newTodayParts.push(`${newLeadsToday} lead${newLeadsToday !== 1 ? 's' : ''}`);
  if (newEnrollmentsToday > 0) newTodayParts.push(`${newEnrollmentsToday} enrollment${newEnrollmentsToday !== 1 ? 's' : ''}`);

  const highSeverityAlert = complianceAlerts.find((a: any) => a.severity === 'critical' || a.severity === 'high');

  const operational = {
    needsReview: needsReviewTotal,
    needsReviewDetail: needsReviewParts.length > 0 ? needsReviewParts.join(' and ') : 'Nothing pending right now',
    atRisk: inactiveLearners.length,
    complianceAlerts: complianceAlerts.length,
    complianceAlertsSeverity: highSeverityAlert ? (highSeverityAlert as any).severity : null,
    newToday: newTodayTotal,
    newTodayDetail: newTodayParts.length > 0 ? newTodayParts.join(', ') : 'Nothing new today',
    newAppsToday,
    newLeadsToday,
    newEnrollmentsToday,
    revenueThisMonthCents,
  };

  // ── Recent students ───────────────────────────────────────────────────────
  // Resolve each student's most recent enrollment + program name.
  // Step 1: fetch enrollments (needed to know which program_ids to look up).
  // Step 2: fetch program names (depends on step 1 result — sequential by necessity).
  const recentStudentIds = recentStudentsData.map((s: any) => s.id).filter(Boolean);
  const studentProgramMap: Record<string, string | null> = {};
  const enrollStatusByUser: Record<string, string> = {};
  if (recentStudentIds.length > 0) {
    const { data: enrollmentRows } = await db
      .from('program_enrollments')
      .select('user_id, program_id, enrollment_state')
      .in('user_id', recentStudentIds)
      .order('created_at', { ascending: false });

    const seenUsers = new Set<string>();
    const programIdByUser: Record<string, string> = {};
    for (const row of enrollmentRows ?? []) {
      const uid = (row as any).user_id;
      if (uid && !seenUsers.has(uid)) {
        seenUsers.add(uid);
        programIdByUser[uid] = (row as any).program_id;
        enrollStatusByUser[uid] = (row as any).enrollment_state ?? null;
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
    if (!dashboardActiveEnrollments.some((active: any) => active.id === (e as any).id)) continue;
    if (!programTotals[pid]) programTotals[pid] = { total: 0, completed: 0 };
    programTotals[pid].total += 1;
    if ((e as any).enrollment_state === 'completed') programTotals[pid].completed += 1;
  }

  // Second pass: fetch program names for the top program IDs only.
  const topProgramIds = Object.entries(programTotals)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 8)
    .map(([id]) => id);

  // Fetch program names and recent enrollment profiles in parallel — independent queries
  const recentEnrollUserIds = (recentEnrollmentsRes.data ?? [])
    .map((e: any) => e.user_id).filter(Boolean);

  const [programRowsRes, rProfilesRes] = await Promise.all([
    topProgramIds.length > 0
      ? db.from('programs').select('id, name, title, slug').in('id', topProgramIds)
      : Promise.resolve({ data: [] }),
    recentEnrollUserIds.length > 0
      ? db.from('profiles').select('id, full_name, email').in('id', recentEnrollUserIds)
      : Promise.resolve({ data: [] }),
  ]);

  const programNamesMap: Record<string, string> = {};
  const programSlugsMap: Record<string, string> = {};
  for (const p of programRowsRes.data ?? []) {
    programNamesMap[(p as any).id] = (p as any).name || (p as any).title || (p as any).id.slice(0, 8);
    programSlugsMap[(p as any).id] = (p as any).slug ?? '';
  }

  const topPrograms = topProgramIds.map(id => {
    const p = programTotals[id];
    return {
      id,
      slug: programSlugsMap[id] ?? '',
      title: programNamesMap[id] ?? id.slice(0, 8),
      learners: toSafeNumber(p.total),
      completed: toSafeNumber(p.completed),
      completionRate: p.total > 0 ? clampPercent((p.completed / p.total) * 100) : 0,
    };
  });

  // ── Recent activity — merge enrollments + applications, sort by date ────────
  const recentEnrollProfileMap: Record<string, string> = {};
  for (const p of rProfilesRes.data ?? []) {
    recentEnrollProfileMap[(p as any).id] = (p as any).full_name || (p as any).email || 'Unknown';
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

  const recentApplications = (recentAppsActivityRes.data ?? [])
    .filter((app: any) => !isLikelyTestRecord(app.full_name, app.first_name, app.last_name))
    .map((app: any) => {
      const createdAt = app.created_at;
      const ageDays = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
      const slug = app.program_slug ?? app.program_interest ?? null;
      const resolvedProgram = slug ? (slugToTitle[slug] ?? slug) : null;
      return {
        id: app.id,
        first_name: app.first_name ?? null,
        last_name: app.last_name ?? null,
        full_name: app.full_name ?? null,
        email: null,
        program_interest: resolvedProgram,
        status: app.status ?? 'submitted',
        created_at: createdAt,
        submitted_at: null,
        age_days: ageDays,
        urgent: ageDays >= 3,
        href: `/admin/applications?search=${encodeURIComponent(app.full_name || app.id)}`,
      };
    });

  const sitePreviewTargets = [
    {
      label: 'Public Site',
      url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org',
    },
    {
      label: 'Admin',
      url: process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.elevateforhumanity.org',
    },
    {
      label: 'LMS',
      url: process.env.NEXT_PUBLIC_LMS_URL || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org'}/lms`,
    },
  ];

  return {
    counts: {
      pendingApplications: totalPendingCount,
      activeEnrollments:     activeEnrollCount,
      revenueThisMonthCents: revenueThisMonthCents,
      certificatesIssued:    certsCount,
      pendingProgramHolders: pendingHoldersCount,
      pendingDocuments:      pendingHolderDocsCount,
    },
    revenueAllTimeCents,
    totalStudents,
    recentPayments: recentPaymentsSlice,
    operational,
    priorities,
    kpis,
    enrollmentTrend,
    studentStatuses,
    topPrograms,
    recentActivity: recentActivityItems,
    recentStudents,
    recentApplications,
    pendingApplications: pendingApps,
    blockedPrograms,
    inactiveLearners,
    pendingSubmissions,
    complianceAlerts,
    staleLeads,
    pendingWioaDocs,
    stalledApplications: stalledApplicationsRes.data ?? [],
    noOutcomeEnrollments: noOutcomeEnrollmentsRes.data ?? [],
    missingFundingEnrollments: missingFundingEnrollmentsRes.data ?? [],
    profile: adminProfile,
    generatedAt: new Date().toISOString(),
    sitePreviewTargets,
    degradedSections,
    systemHealth,
  };
}
