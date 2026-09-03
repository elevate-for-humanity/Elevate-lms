/**
 * Full Elevate LMS walkthrough — Jozanna Williams (program_holder)
 *
 * Two-track approach:
 *  1. Playwright (Chromium) — public pages, login page render, signup, partner landing
 *  2. Supabase JS client — all authenticated flows (auth, dashboard, portal, API, sign-out)
 *
 * The Playwright track skips authenticated pages because headless Chromium won't send
 * non-Secure cookies to HTTPS (Supabase JS sets them without the Secure flag in headless
 * mode). The Supabase JS track proves auth works end-to-end at the API/DB layer.
 */

import { chromium } from 'playwright';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// ── Config ────────────────────────────────────────────────────────────────────
const BASE          = 'https://www.elevateforhumanity.org';
const SUPABASE_URL  = 'https://cuxzzpsyufcewtmicszk.supabase.co';
const ANON_KEY      = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const EMAIL         = process.env.WALKTHROUGH_EMAIL || 'jozanna.test.elevate@gmail.com';
const PASSWORD      = process.env.WALKTHROUGH_PASSWORD ?? (() => { throw new Error('WALKTHROUGH_PASSWORD env var is required'); })();
const SCREENSHOT_DIR = '/tmp/elevate-walkthrough';

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

// ── Tracking ──────────────────────────────────────────────────────────────────
let pass = 0, fail = 0;
const failures: string[] = [];

function ok(label: string, note = '') {
  pass++;
  console.log(`  ✅ ${label}${note ? ' — ' + note : ''}`);
}
function ko(label: string, note = '') {
  fail++;
  failures.push(`${label}${note ? ' — ' + note : ''}`);
  console.log(`  ❌ ${label}${note ? ' — ' + note : ''}`);
}
function check(label: string, cond: boolean, note = '') {
  cond ? ok(label, note) : ko(label, note);
}

// ── TRACK 1: Playwright public pages ─────────────────────────────────────────
async function runPlaywrightTrack() {
  console.log('\n══ TRACK 1: Browser (Playwright) — Public Pages ══');

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx     = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page    = await ctx.newPage();
  page.on('dialog', d => d.dismiss().catch(() => {}));

  async function visit(url: string, label: string, opts: { expectLogin?: boolean; notError?: boolean } = {}) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1200);
      const final = page.url();
      const shot  = label.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${shot}.png`), fullPage: false });

      if (opts.expectLogin) {
        check(label, final.includes('/login'), `→ ${final.slice(0, 70)}`);
      } else if (opts.notError) {
        check(label, !final.includes('/500') && !final.includes('/error'), `→ ${final.slice(0, 70)}`);
      } else {
        // Public page: must not 500 and must not redirect to login
        check(label, !final.includes('/500') && !final.includes('/login'), `→ ${final.slice(0, 70)}`);
      }
    } catch (e: any) {
      ko(label, e.message?.slice(0, 60));
    }
  }

  // ── Public program pages ──
  console.log('\n  ── Program Pages ──');
  await visit(`${BASE}/programs`,                    'Programs listing');
  await visit(`${BASE}/programs/hvac-technician`,    'HVAC program page');
  await visit(`${BASE}/programs/cosmetology`,        'Cosmetology program page');
  await visit(`${BASE}/programs/cybersecurity`,      'Cybersecurity program page');

  // ── Application flow ──
  console.log('\n  ── Application Flow ──');
  await visit(`${BASE}/apply`,          'Apply landing page');
  await visit(`${BASE}/apply/intake`,   'Intake form');
  await visit(`${BASE}/apply/fssa`,     'FSSA form');
  await visit(`${BASE}/apply/success`,  'Application success');
  await visit(`${BASE}/apply/status`,   'Application status');

  // ── Auth pages ──
  console.log('\n  ── Auth Pages ──');
  await visit(`${BASE}/login`,            'Login page renders',   { expectLogin: true });
  await visit(`${BASE}/signup`,           'Signup page renders',  { notError: true });
  await visit(`${BASE}/forgot-password`,  'Forgot password page', { notError: true });
  await visit(`${BASE}/reset-password`,   'Reset password page',  { notError: true });

  // ── Partner public pages ──
  console.log('\n  ── Partner Public Pages ──');
  await visit(`${BASE}/partner`,        'Partner landing page', { notError: true });
  await visit(`${BASE}/partner/apply`,  'Partner apply page',   { notError: true });

  // ── Onboarding public entry points ──
  console.log('\n  ── Onboarding Entry Points ──');
  // These redirect to /login for unauthenticated users — that's correct
  for (const role of ['learner', 'employer', 'partner']) {
    try {
      await page.goto(`${BASE}/onboarding/${role}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(800);
      const u = page.url();
      check(`Onboarding/${role} (unauth → login or page)`, !u.includes('/500'), `→ ${u.slice(0, 60)}`);
    } catch (e: any) {
      ko(`Onboarding/${role}`, e.message?.slice(0, 50));
    }
  }

  await browser.close();
}

// ── TRACK 2: Supabase JS — Authenticated flows ────────────────────────────────
async function runSupabaseTrack() {
  console.log('\n══ TRACK 2: Supabase JS — Authenticated Flows ══');

  const client  = createClient(SUPABASE_URL, ANON_KEY);
  const admin   = createClient(SUPABASE_URL, SERVICE_KEY);

  // ── Auth: sign in ──
  console.log('\n  ── Authentication ──');
  const { data: signInData, error: signInErr } = await client.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  check('Sign in with email/password', !signInErr && !!signInData.user, signInErr?.message);

  if (!signInData.user) { ko('Cannot continue — sign in failed'); return; }

  const user    = signInData.user;
  const session = signInData.session!;
  check('Session has access_token',  !!session.access_token);
  check('Session has refresh_token', !!session.refresh_token);
  check('User email confirmed',      !!user.email_confirmed_at, user.email_confirmed_at ?? 'null');
  check('User email matches',        user.email === EMAIL, user.email ?? '');

  // ── Profile ──
  console.log('\n  ── Profile ──');
  const { data: profile, error: profileErr } = await client
    .from('profiles')
    .select('id, role, full_name, onboarding_completed, program_holder_id')
    .eq('id', user.id)
    .single();
  check('Profile row exists',           !profileErr && !!profile, profileErr?.message);
  check('Role = program_holder',        profile?.role === 'program_holder', profile?.role ?? '');
  check('program_holder_id linked',     !!profile?.program_holder_id, profile?.program_holder_id ?? 'null');

  const phId = profile?.program_holder_id;

  // ── Program holder record ──
  console.log('\n  ── Program Holder Record ──');
  if (phId) {
    const { data: ph, error: phErr } = await client
      .from('program_holders')
      .select('id, status, mou_signed, approved_at')
      .eq('id', phId)
      .single();
    check('program_holders row readable',  !phErr && !!ph, phErr?.message);
    check('Status = active',               ph?.status === 'active', ph?.status ?? '');
    check('MOU signed',                    ph?.mou_signed === true);
    check('Approved at set',               !!ph?.approved_at);
  } else {
    ko('program_holder_id missing — skipping PH record checks');
  }

  // ── Program holder programs ──
  console.log('\n  ── Program Holder Programs ──');
  if (phId) {
    const { data: phPrograms, error: phpErr } = await client
      .from('program_holder_programs')
      .select('program_id')
      .eq('program_holder_id', phId);
    check('program_holder_programs readable', !phpErr, phpErr?.message);
    check('At least one program linked',      (phPrograms?.length ?? 0) > 0, `${phPrograms?.length ?? 0} programs`);
  }

  // ── Acknowledgements ──
  // Real columns: id, user_id, document_type, acknowledged_at, ip_address, created_at
  console.log('\n  ── Acknowledgements ──');
  const { data: acks, error: acksErr } = await client
    .from('program_holder_acknowledgements')
    .select('id, document_type, acknowledged_at')
    .eq('user_id', user.id);
  check('Acknowledgements readable', !acksErr, acksErr?.message);
  check('Has acknowledgements',      (acks?.length ?? 0) > 0, `${acks?.length ?? 0} rows`);

  // ── Canonical program enrollments ──
  console.log('\n  ── Program Enrollments ──');
  const { data: enrollments, error: enrollErr } = await client
    .from('program_enrollments')
    .select('id, status, student_id')
    .limit(5);
  check('program_enrollments readable', !enrollErr, enrollErr?.message);

  // ── Programs ──
  console.log('\n  ── Programs ──');
  const { data: programs, error: progErr } = await client
    .from('programs')
    .select('id, title, slug, status')
    .eq('status', 'active')
    .limit(10);
  check('Programs readable',        !progErr, progErr?.message);
  check('Programs exist',           (programs?.length ?? 0) > 0, `${programs?.length ?? 0} programs`);

  // ── Onboarding flow: program_holder ──
  console.log('\n  ── Onboarding Flow (program_holder) ──');
  // Verify the onboarding page would load — check the DB state
  check('Onboarding: profile has role',             profile?.role === 'program_holder');
  check('Onboarding: program_holder_id set',        !!profile?.program_holder_id);
  // onboarding_completed may be null/false for program_holder (they use a different flow)
  check('Onboarding: profile row accessible',       !!profile);

  // ── Dashboard data queries (what the dashboard page runs) ──
  console.log('\n  ── Dashboard Data Queries ──');
  if (phId) {
    // Students query (fixed FK)
    const { data: students, error: studErr } = await client
      .from('program_enrollments')
      .select('id, status, student_id')
      .limit(10);
    check('Dashboard: students query (fixed FK)', !studErr, studErr?.message);

    // Analytics: program IDs
    const { data: phProgs } = await client
      .from('program_holder_programs')
      .select('program_id')
      .eq('program_holder_id', phId);
    const programIds = (phProgs ?? []).map((p: any) => p.program_id);
    check('Dashboard: analytics program IDs', programIds.length > 0, `${programIds.length} IDs`);

    // Compliance: program_holders by id
    const { data: compPH, error: compErr } = await client
      .from('program_holders')
      .select('id, status, mou_signed')
      .eq('id', phId)
      .single();
    check('Dashboard: compliance query (by id)', !compErr, compErr?.message);

    // Reports — real columns: id, user_id, document_type, file_name, file_path, status
    const { data: reports, error: repErr } = await client
      .from('program_holder_documents')
      .select('id, document_type, created_at')
      .eq('user_id', user.id)
      .limit(10);
    check('Dashboard: reports/documents query', !repErr, repErr?.message);

    // Grades (no grade column)
    const { data: grades, error: gradeErr } = await client
      .from('program_enrollments')
      .select('id, status, student_id')
      .limit(10);
    check('Dashboard: grades query (no grade col)', !gradeErr, gradeErr?.message);
  }

  // ── Portal sections: settings/notifications ──
  console.log('\n  ── Portal: Settings / Notifications ──');
  const { data: notifProfile, error: notifErr } = await client
    .from('profiles')
    .select('id, program_holder_id')
    .eq('id', user.id)
    .single();
  check('Settings: profile readable for notifications', !notifErr, notifErr?.message);

  // ── Portal sections: verification ──
  console.log('\n  ── Portal: Verification ──');
  if (phId) {
    const { data: verif, error: verifErr } = await client
      .from('program_holders')
      .select('id, status, approved_at')
      .eq('id', phId)
      .single();
    check('Verification: program_holder readable', !verifErr, verifErr?.message);
  }

  // ── Portal sections: sign-mou ──
  console.log('\n  ── Portal: Sign MOU ──');
  if (phId) {
    const { data: mou, error: mouErr } = await client
      .from('program_holders')
      .select('id, mou_signed, mou_signed_at')
      .eq('id', phId)
      .single();
    check('Sign MOU: mou_signed readable', !mouErr, mouErr?.message);
    check('Sign MOU: mou_signed = true',   mou?.mou_signed === true);
  }

  // ── Email / password flows (API layer) ──
  console.log('\n  ── Email / Password Flows ──');
  // Verify password reset email would work (check user exists)
  const { data: adminUser } = await admin.auth.admin.getUserById(user.id);
  check('Password reset: user exists in auth',    !!adminUser?.user);
  check('Password reset: email confirmed',        !!adminUser?.user?.email_confirmed_at);
  check('Password reset: not banned',             !adminUser?.user?.banned_until);

  // ── Partner flows (API layer) ──
  // partner_applications has no user_id — use partner_users (user_id → partner_id)
  console.log('\n  ── Partner Flows ──');
  const { data: partnerUsers, error: partnerErr } = await client
    .from('partner_users')
    .select('id, status, partner_id')
    .eq('user_id', user.id)
    .limit(1);
  // program_holder won't have a partner_users row — that's correct
  check('Partner: partner_users query runs without error', !partnerErr, partnerErr?.message);
  check('Partner: no partner_users row for program_holder (correct)', (partnerUsers?.length ?? 0) === 0);

  // ── Sign out ──
  console.log('\n  ── Sign Out ──');
  const { error: signOutErr } = await client.auth.signOut();
  check('Sign out succeeds', !signOutErr, signOutErr?.message);

  const { data: { user: userAfterSignOut } } = await client.auth.getUser();
  check('Session cleared after sign out', !userAfterSignOut, userAfterSignOut?.id ?? 'still has user');

  // ── Verify protected data inaccessible after sign out ──
  console.log('\n  ── Post-Sign-Out Access Control ──');
  const { data: phAfterSignOut, error: phAfterErr } = await client
    .from('program_holders')
    .select('id')
    .eq('id', phId ?? '')
    .single();
  check('program_holders blocked after sign out', !!phAfterErr || !phAfterSignOut, 
    phAfterErr?.message ?? (phAfterSignOut ? 'still readable!' : 'blocked'));
}

// ── TRACK 3: Live HTTP — authenticated page rendering ─────────────────────────
async function runHttpTrack() {
  console.log('\n══ TRACK 3: HTTP — Authenticated Page Rendering ══');

  // Get a fresh session token
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const data = await res.json();
  const session = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    expires_at: data.expires_at ?? Math.floor(Date.now() / 1000) + data.expires_in,
    token_type: 'bearer',
    user: data.user,
  };
  const b64url = Buffer.from(JSON.stringify(session), 'utf8')
    .toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const cookieHeader = `sb-cuxzzpsyufcewtmicszk-auth-token=base64-${b64url}`;

  async function httpCheck(url: string, label: string, opts: { expectRedirect?: string; expectOk?: boolean } = {}) {
    try {
      const r = await fetch(url, {
        headers: { Cookie: cookieHeader, 'User-Agent': 'Mozilla/5.0', Accept: 'text/html' },
        redirect: 'manual',
      });
      const loc = r.headers.get('location') ?? '';

      if (opts.expectRedirect) {
        check(label, loc.includes(opts.expectRedirect), `${r.status} → ${loc.slice(0, 60)}`);
      } else if (opts.expectOk) {
        check(label, r.status === 200, `status=${r.status}`);
      } else {
        // Expect NOT redirected to /login
        const redirectedToLogin = r.status === 307 && loc.includes('/login');
        check(label, !redirectedToLogin, `${r.status}${loc ? ' → ' + loc.slice(0, 60) : ''}`);
      }
    } catch (e: any) {
      ko(label, e.message?.slice(0, 60));
    }
  }

  // Note: Netlify Edge middleware calls supabase.auth.getUser() which validates
  // the JWT via network call. If that call fails/times out on the edge, all
  // protected routes redirect to /login regardless of cookie validity.
  // We document the actual behavior here.
  console.log('\n  ── Program-Holder Portal (HTTP with cookie) ──');
  const phPages = [
    '/program-holder/dashboard',
    '/program-holder/programs',
    '/program-holder/students',
    '/program-holder/grades',
    '/program-holder/analytics',
    '/program-holder/compliance',
    '/program-holder/reports',
    '/program-holder/documents',
    '/program-holder/sign-mou',
    '/program-holder/verification',
    '/program-holder/settings',
    '/program-holder/settings/notifications',
  ];

  for (const p of phPages) {
    await httpCheck(`${BASE}${p}`, `HTTP: ${p}`, { expectOk: false });
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 300));
  }

  // Public pages must return 200
  console.log('\n  ── Public Pages (HTTP 200 check) ──');
  for (const p of ['/programs', '/apply', '/login', '/signup']) {
    const r = await fetch(`${BASE}${p}`, { redirect: 'follow' });
    check(`HTTP 200: ${p}`, r.status === 200, `status=${r.status}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Elevate LMS Full Walkthrough — Jozanna Williams (program_holder)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  await runPlaywrightTrack();
  await runSupabaseTrack();
  await runHttpTrack();

  console.log('\n' + '═'.repeat(63));
  console.log(`  TOTAL: ${pass} passed, ${fail} failed`);
  console.log('═'.repeat(63));

  if (failures.length > 0) {
    console.log('\nFailed checks:');
    failures.forEach(f => console.log(`  ❌ ${f}`));
  }

  console.log(`\nScreenshots: ${SCREENSHOT_DIR}`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
