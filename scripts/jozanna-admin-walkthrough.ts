/**
 * Admin dashboard walkthrough as Jozanna George.
 *
 * Steps:
 *  1. Sign in as jozanna.test.elevate@gmail.com
 *  2. Temporarily elevate her profile role to 'admin' (restored on exit)
 *  3. Walk every section of the admin nav — hitting each page with her session cookie
 *  4. Walk key admin API endpoints
 *  5. Restore original role
 *  6. Print full pass/fail report
 *
 * Usage:
 *   pnpm tsx scripts/jozanna-admin-walkthrough.ts
 */

import { createClient } from '@supabase/supabase-js';

// ── Config ────────────────────────────────────────────────────────────────────
// Reads from environment — set these before running:
//   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
//   WALKTHROUGH_EMAIL, WALKTHROUGH_PASSWORD, NEXT_PUBLIC_SITE_URL
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cuxzzpsyufcewtmicszk.supabase.co';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
const EMAIL = process.env.WALKTHROUGH_EMAIL || 'jozanna.test.elevate@gmail.com';
const PASSWORD = process.env.WALKTHROUGH_PASSWORD ?? (() => { throw new Error('WALKTHROUGH_PASSWORD env var is required'); })();
const PROJECT_REF = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? '';

const anonDb = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const adminDb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Session state ─────────────────────────────────────────────────────────────
let accessToken = '';
let sessionCookie = '';
let userId = '';
let originalRole = '';

// ── Result tracking ───────────────────────────────────────────────────────────
interface Result {
  label: string;
  pass: boolean;
  note: string;
}
interface Section {
  name: string;
  results: Result[];
}
const sections: Section[] = [];
let totalPass = 0;
let totalFail = 0;

function section(name: string): { check: (label: string, pass: boolean, note?: string) => void } {
  const s: Section = { name, results: [] };
  sections.push(s);
  return {
    check(label, pass, note = '') {
      s.results.push({ label, pass, note });
      if (pass) totalPass++;
      else totalFail++;
      const icon = pass ? '  ✅' : '  ❌';
      console.log(`${icon} ${label}${note ? ' — ' + note : ''}`);
    },
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
async function signIn() {
  const { data, error } = await anonDb.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  if (error || !data.session) throw new Error(`Sign-in failed: ${error?.message}`);
  accessToken = data.session.access_token;
  userId = data.session.user.id;
  const sessionJson = JSON.stringify({
    access_token: accessToken,
    refresh_token: data.session.refresh_token,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: data.session.expires_at ?? 0,
  });
  sessionCookie = `sb-${PROJECT_REF}-auth-token=base64-${Buffer.from(sessionJson).toString('base64')}`;
  return data.session;
}

async function get(
  path: string,
  timeoutMs = 20000,
): Promise<{ code: number; body: string; json: any }> {
  try {
    const r = await fetch(`${BASE}${path}`, {
      headers: { Cookie: sessionCookie, Authorization: `Bearer ${accessToken}` },
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
    });
    const body = await r.text().catch(() => '');
    let json: any = {};
    try {
      json = JSON.parse(body);
    } catch {}
    return { code: r.status, body, json };
  } catch (e: any) {
    return { code: 0, body: e.message, json: {} };
  }
}

function pageOk(code: number, body: string): boolean {
  if (code === 0) return false;
  if (code >= 500) return false;
  // 401/403 means auth didn't work
  if (code === 401 || code === 403) return false;
  // redirect to login means session not accepted
  if (body.includes('/login') && body.length < 500) return false;
  return true;
}

// ── Elevate / restore role ────────────────────────────────────────────────────
async function elevateToAdmin() {
  const { data: prof } = await adminDb
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();
  originalRole = prof?.role ?? 'program_holder';
  await adminDb.from('profiles').update({ role: 'admin' }).eq('id', userId);
  // Also update auth metadata so middleware role checks pass
  await adminDb.auth.admin.updateUserById(userId, {
    app_metadata: { role: 'admin' },
  });
  // Re-sign in to get a fresh token with updated metadata
  await signIn();
}

async function restoreRole() {
  await adminDb.from('profiles').update({ role: originalRole }).eq('id', userId);
  await adminDb.auth.admin.updateUserById(userId, {
    app_metadata: { role: originalRole },
  });
}

// ── Admin pages by nav section ────────────────────────────────────────────────
const ADMIN_PAGES: { section: string; pages: { label: string; path: string }[] }[] = [
  {
    section: 'Operations',
    pages: [
      { label: 'Dashboard', path: '/admin/dashboard' },
      { label: 'Activity Feed', path: '/admin/activity' },
      { label: 'Analytics', path: '/admin/analytics' },
      { label: 'Analytics — Engagement', path: '/admin/analytics/engagement' },
      { label: 'Analytics — Learning', path: '/admin/analytics/learning' },
      { label: 'Analytics — Programs', path: '/admin/analytics/programs' },
      { label: 'Reporting', path: '/admin/reporting' },
      { label: 'Reports', path: '/admin/reports' },
      { label: 'Reports — Enrollment', path: '/admin/reports/enrollment' },
      { label: 'Reports — Financial', path: '/admin/reports/financial' },
      { label: 'Reports — Leads', path: '/admin/reports/leads' },
      { label: 'Reports — Partners', path: '/admin/reports/partners' },
      { label: 'Reports — Users', path: '/admin/reports/users' },
      { label: 'Reports — Caseload', path: '/admin/reports/caseload' },
      { label: 'Monitoring', path: '/admin/monitoring' },
      { label: 'System Health', path: '/admin/system-health' },
      { label: 'At-Risk', path: '/admin/at-risk' },
      { label: 'Notifications', path: '/admin/notifications' },
      { label: 'Inbox', path: '/admin/inbox' },
    ],
  },
  {
    section: 'Students',
    pages: [
      { label: 'All Students', path: '/admin/students' },
      { label: 'Applications', path: '/admin/applications' },
      { label: 'Applicants', path: '/admin/applications' },
      { label: 'Enrollments', path: '/admin/enrollments' },
      { label: 'Completions', path: '/admin/completions' },
      { label: 'Outcomes', path: '/admin/outcomes' },
      { label: 'Progress', path: '/admin/progress' },
      { label: 'Gradebook', path: '/admin/gradebook' },
      { label: 'Submissions', path: '/admin/submissions' },
      { label: 'Verifications', path: '/admin/verifications' },
      { label: 'Certificates', path: '/admin/certificates' },
      { label: 'Exam Authorizations', path: '/admin/exam-authorizations' },
      { label: 'Barriers', path: '/admin/barriers' },
      { label: 'Next Steps', path: '/admin/next-steps' },
      { label: 'Waitlist', path: '/admin/waitlist' },
      { label: 'Intake', path: '/admin/intake' },
      { label: 'Leads', path: '/admin/leads' },
      { label: 'Contacts', path: '/admin/contacts' },
      { label: 'Transfer Hours', path: '/admin/transfer-hours' },
      { label: 'WorkOne Queue', path: '/admin/workone-queue' },
      { label: 'FERPA', path: '/admin/ferpa' },
      { label: 'Impersonate', path: '/admin/impersonate' },
    ],
  },
  {
    section: 'Programs',
    pages: [
      { label: 'All Programs', path: '/admin/programs' },
      { label: 'Create Program', path: '/admin/programs/new' },
      { label: 'Program Builder', path: '/admin/studio' },
      { label: 'Programs — Catalog', path: '/admin/programs/catalog' },
      { label: 'Curriculum', path: '/admin/studio' },
      { label: 'Modules', path: '/admin/modules' },
      { label: 'Courses', path: '/admin/courses' },
      { label: 'Certifications', path: '/admin/certifications' },
      { label: 'Credentials', path: '/admin/credentials' },
      { label: 'Quizzes', path: '/admin/quizzes' },
      { label: 'Proctor Portal', path: '/admin/proctor-portal' },
      { label: 'Instructors', path: '/admin/instructors' },
      { label: 'Cohorts', path: '/admin/cohorts' },
      { label: 'Apprenticeships', path: '/admin/apprenticeships' },
      { label: 'Career Courses', path: '/admin/career-courses' },
      { label: 'External Courses', path: '/admin/external-courses' },
      { label: 'External Progress', path: '/admin/external-progress' },
      { label: 'ETPL Dashboard', path: '/admin/dashboard/etpl' },
    ],
  },
  {
    section: 'Build',
    pages: [
      { label: 'Blueprint Builder', path: '/admin/studio' },
      { label: 'Course Import', path: '/admin/course-import' },
      { label: 'Editor', path: '/admin/editor' },
      { label: 'Media Studio', path: '/admin/studio' },
      { label: 'Video Manager', path: '/admin/studio' },
      { label: 'Video Generator', path: '/admin/studio' },
      { label: 'Videos', path: '/admin/videos' },
    ],
  },
  {
    section: 'AI',
    pages: [
      { label: 'Lizzy', path: '/admin/dashboard' },
      { label: 'Copilot', path: '/admin/studio' },
      { label: 'Automation', path: '/admin/automation' },
      { label: 'Workflows', path: '/admin/workflows' },
      { label: 'Lizzy Execute', path: '/admin/dashboard?tab=execute' },
    ],
  },
  {
    section: 'Funding',
    pages: [
      { label: 'Funding', path: '/admin/funding' },
      { label: 'Grants', path: '/admin/grants' },
      { label: 'WIOA', path: '/admin/wioa' },
      { label: 'WIOA — Eligibility', path: '/admin/wioa/eligibility' },
      { label: 'WIOA — Documents', path: '/admin/wioa/documents' },
      { label: 'JRI', path: '/admin/jri' },
      { label: 'JRI — Participants', path: '/admin/jri/participants' },
      { label: 'Incentives', path: '/admin/incentives' },
      { label: 'Payout Queue', path: '/admin/payout-queue' },
      { label: 'Payroll', path: '/admin/payroll' },
      { label: 'Tax Filing', path: '/admin/tax-filing' },
      { label: 'WOTC', path: '/admin/wotc' },
      { label: 'RAPIDS', path: '/admin/rapids' },
      { label: 'Funding Verification', path: '/admin/funding-verification' },
      { label: 'Hours Export', path: '/admin/hours-export' },
    ],
  },
  {
    section: 'Partners',
    pages: [
      { label: 'Employers', path: '/admin/employers' },
      { label: 'Partners', path: '/admin/partners' },
      { label: 'Partner Enrollments', path: '/admin/partner-enrollments' },
      { label: 'Partner Inquiries', path: '/admin/partner-inquiries' },
      { label: 'Jobs', path: '/admin/jobs' },
      { label: 'Affiliates', path: '/admin/affiliates' },
      { label: 'Marketplace', path: '/admin/marketplace' },
      { label: 'Providers', path: '/admin/providers' },
      { label: 'Provider Applications', path: '/admin/provider-applications' },
      { label: 'Program Holders', path: '/admin/program-holders' },
      { label: 'Delegates', path: '/admin/delegates' },
      { label: 'Shops', path: '/admin/shops' },
    ],
  },
  {
    section: 'Marketing',
    pages: [
      { label: 'Marketing', path: '/admin/marketing' },
      { label: 'CRM', path: '/admin/crm' },
      { label: 'CRM — Leads', path: '/admin/crm/leads' },
      { label: 'CRM — Contacts', path: '/admin/crm/contacts' },
      { label: 'CRM — Campaigns', path: '/admin/crm/campaigns' },
      { label: 'Campaigns', path: '/admin/campaigns' },
      { label: 'Email Marketing', path: '/admin/email-marketing' },
      { label: 'Blog', path: '/admin/blog' },
      { label: 'Social Media', path: '/admin/social-media' },
      { label: 'Promo Codes', path: '/admin/promo-codes' },
      { label: 'Store', path: '/admin/store' },
      { label: 'Live Chat', path: '/admin/live-chat' },
    ],
  },
  {
    section: 'Compliance',
    pages: [
      { label: 'Compliance', path: '/admin/compliance' },
      { label: 'Compliance Audit', path: '/admin/compliance-audit' },
      { label: 'Accreditation', path: '/admin/accreditation' },
      { label: 'Governance', path: '/admin/governance' },
      { label: 'Audit Logs', path: '/admin/audit-logs' },
      { label: 'Documents', path: '/admin/documents' },
      { label: 'Document Center', path: '/admin/document-center' },
      { label: 'Signatures', path: '/admin/signatures' },
      { label: 'MOU', path: '/admin/mou' },
      { label: 'FSSA Impact', path: '/admin/fssa-impact' },
    ],
  },
  {
    section: 'Finance',
    pages: [
      { label: 'HR', path: '/admin/hr' },
      { label: 'License', path: '/admin/license' },
      { label: 'License Requests', path: '/admin/license-requests' },
      { label: 'Licenses', path: '/admin/licenses' },
      { label: 'Licensing', path: '/admin/licensing' },
    ],
  },
  {
    section: 'Settings',
    pages: [
      { label: 'Settings', path: '/admin/settings' },
      { label: 'Users', path: '/admin/users' },
      { label: 'Staff', path: '/admin/staff' },
      { label: 'API Keys', path: '/admin/api-keys' },
      { label: 'Integrations', path: '/admin/integrations' },
      { label: 'Tenants', path: '/admin/tenants' },
      { label: 'Advanced Tools', path: '/admin/advanced-tools' },
      { label: 'Migrations', path: '/admin/migrations' },
      { label: 'Install', path: '/admin/install' },
    ],
  },
];

// ── Key admin API endpoints ───────────────────────────────────────────────────
const ADMIN_APIS = [
  { label: 'GET /api/admin/students', path: '/api/admin/students' },
  { label: 'GET /api/admin/programs', path: '/api/admin/programs' },
  { label: 'GET /api/admin/enrollments', path: '/api/admin/enrollments' },
  { label: 'GET /api/admin/applications', path: '/api/admin/applications' },
  { label: 'GET /api/admin/certificates', path: '/api/admin/certificates' },
  { label: 'GET /api/admin/users', path: '/api/admin/users' },
  { label: 'GET /api/admin/analytics/overview', path: '/api/admin/analytics/overview' },
  { label: 'GET /api/admin/compliance/alerts', path: '/api/admin/compliance/alerts' },
  { label: 'GET /api/admin/funding/summary', path: '/api/admin/funding/summary' },
  { label: 'GET /api/admin/reports/enrollment', path: '/api/admin/reports/enrollment' },
];

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Jozanna George — Admin Dashboard Walkthrough');
  console.log('  Target:', BASE);
  console.log('═══════════════════════════════════════════════════════════════\n');

  // ── STEP 1: Sign in ─────────────────────────────────────────────────────────
  console.log('── STEP 1: Sign In ─────────────────────────────────────────────');
  const auth = section('Authentication');
  let session: any;
  try {
    session = await signIn();
    auth.check('Sign in succeeded', true, `user_id=${userId}`);
    auth.check('Access token present', !!accessToken);
    auth.check('Session cookie built', !!sessionCookie);
  } catch (e: any) {
    auth.check('Sign in succeeded', false, e.message);
    console.error('\nFatal: cannot sign in. Aborting.');
    printReport();
    process.exit(1);
  }

  // ── STEP 2: Elevate to admin ────────────────────────────────────────────────
  console.log('\n── STEP 2: Elevate to Admin ────────────────────────────────────');
  const elevate = section('Role Elevation');
  try {
    await elevateToAdmin();
    const { data: prof } = await adminDb
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();
    elevate.check('Profile role = admin', prof?.role === 'admin', `role=${prof?.role}`);
    elevate.check('Original role saved', !!originalRole, `was=${originalRole}`);
    elevate.check('Fresh session obtained', !!accessToken);
  } catch (e: any) {
    elevate.check('Elevation succeeded', false, e.message);
    console.error('\nFatal: cannot elevate role. Aborting.');
    await restoreRole().catch(() => {});
    printReport();
    process.exit(1);
  }

  // ── STEP 3: Admin page walk ─────────────────────────────────────────────────
  console.log('\n── STEP 3: Admin Pages ─────────────────────────────────────────');
  for (const navSection of ADMIN_PAGES) {
    console.log(`\n  [${navSection.section}]`);
    const s = section(`Pages — ${navSection.section}`);
    for (const page of navSection.pages) {
      const { code, body } = await get(page.path);
      const ok = pageOk(code, body);
      s.check(page.label, ok, `HTTP ${code}`);
    }
  }

  // ── STEP 4: Admin API walk ──────────────────────────────────────────────────
  console.log('\n── STEP 4: Admin API Endpoints ─────────────────────────────────');
  const api = section('Admin APIs');
  for (const endpoint of ADMIN_APIS) {
    const { code, json } = await get(endpoint.path);
    // APIs return 200/404 (no data) — both are acceptable; 401/403/500 are not
    const ok = code > 0 && code !== 401 && code !== 403 && code < 500;
    api.check(endpoint.label, ok, `HTTP ${code}${json?.error ? ' — ' + json.error : ''}`);
  }

  // ── STEP 5: Restore role ────────────────────────────────────────────────────
  console.log('\n── STEP 5: Restore Role ────────────────────────────────────────');
  const restore = section('Role Restore');
  try {
    await restoreRole();
    const { data: prof } = await adminDb
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();
    restore.check(`Role restored to ${originalRole}`, prof?.role === originalRole, `role=${prof?.role}`);
  } catch (e: any) {
    restore.check('Role restore succeeded', false, e.message);
  }

  printReport();
}

function printReport() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  WALKTHROUGH REPORT');
  console.log('═══════════════════════════════════════════════════════════════');
  for (const s of sections) {
    const sPass = s.results.filter((r) => r.pass).length;
    const sFail = s.results.filter((r) => !r.pass).length;
    const icon = sFail === 0 ? '✅' : '⚠️ ';
    console.log(`\n${icon} ${s.name} — ${sPass}/${s.results.length} passed`);
    for (const r of s.results.filter((r) => !r.pass)) {
      console.log(`     ❌ ${r.label}${r.note ? ' — ' + r.note : ''}`);
    }
  }
  console.log('\n───────────────────────────────────────────────────────────────');
  console.log(`  TOTAL: ${totalPass} passed, ${totalFail} failed`);
  if (totalFail === 0) {
    console.log('  ✅ All checks passed');
  } else {
    console.log(`  ⚠️  ${totalFail} check(s) need attention`);
  }
  console.log('═══════════════════════════════════════════════════════════════\n');
}

main().catch(async (e) => {
  console.error('Unhandled error:', e);
  await restoreRole().catch(() => {});
  process.exit(1);
});
