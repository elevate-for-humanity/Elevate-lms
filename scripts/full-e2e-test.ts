/**
 * Full end-to-end test suite using Jozanna's account.
 * Tests: program pages, application flow, onboarding, all role portals, login/auth flows.
 */
import { createClient } from '@supabase/supabase-js';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org';
const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? '';
const SUPABASE_URL = 'https://cuxzzpsyufcewtmicszk.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.SUPABASE_ANON_KEY!;

const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

async function httpStatus(url: string): Promise<{ code: number; final: string }> {
  try {
    const r = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(12000) });
    return { code: r.status, final: r.url };
  } catch (e: any) {
    return { code: 0, final: e.message };
  }
}

async function httpNoFollow(url: string): Promise<{ code: number; location: string }> {
  try {
    const r = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(12000) });
    return { code: r.status, location: r.headers.get('location') || '' };
  } catch (e: any) {
    return { code: 0, location: e.message };
  }
}

async function post(url: string, body: object): Promise<{ code: number; json: any }> {
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12000),
    });
    const json = await r.json().catch(() => ({}));
    return { code: r.status, json };
  } catch (e: any) {
    return { code: 0, json: { error: e.message } };
  }
}

function icon(code: number, expected = 200) {
  if (code === expected || (expected === 200 && (code === 200 || code === 301 || code === 307))) return '✅';
  if (code === 0) return '❌';
  return '⚠️ ';
}

const results: { section: string; pass: number; fail: number; items: string[] }[] = [];

function section(name: string) {
  const s = { section: name, pass: 0, fail: 0, items: [] as string[] };
  results.push(s);
  return s;
}

async function checkUrl(s: ReturnType<typeof section>, label: string, url: string, expectCode = 200) {
  const { code, final } = await httpStatus(url);
  const ok = code === expectCode || (expectCode === 200 && code >= 200 && code < 400);
  s.items.push(`${ok ? '✅' : '❌'} ${code} ${label}`);
  if (ok) s.pass++; else s.fail++;
}

async function main() {
  console.log('=== ELEVATE LMS — FULL E2E TEST SUITE ===\n');
  console.log(`Base: ${BASE}`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  // ── 1. PROGRAM PAGES ──────────────────────────────────────────────────────
  const prog = section('Program Pages');
  const programs = [
    'hvac-technician','cna','phlebotomy','medical-assistant','ekg-technician',
    'pharmacy-technician','patient-care-technician','medical-admin-assistant',
    'cybersecurity-analyst','it-support','data-analytics','project-management',
    'cosmetology-apprenticeship','barbershop-apprenticeship','nail-technician-apprenticeship',
    'esthetician-apprenticeship','cdl-class-a','cdl-class-b','forklift-operator',
    'osha-10','osha-30','bookkeeping','real-estate',
    'social-media-marketing','graphic-design','web-development','business-management',
    'workforce-readiness',
  ];
  await Promise.all(programs.map(slug => checkUrl(prog, `/programs/${slug}`, `${BASE}/programs/${slug}`)));

  // ── 2. APPLICATION FLOW ───────────────────────────────────────────────────
  const app = section('Application Flow');
  await Promise.all([
    checkUrl(app, '/apply', `${BASE}/apply`),
    checkUrl(app, '/apply/intake', `${BASE}/apply/intake`),
    checkUrl(app, '/apply/intake?program=hvac-technician', `${BASE}/apply/intake?program=hvac-technician`),
    checkUrl(app, '/apply/start', `${BASE}/apply/start`),
    checkUrl(app, '/apply/fssa', `${BASE}/apply/fssa`),
    checkUrl(app, '/apply/success', `${BASE}/apply/success`),
    checkUrl(app, '/apply/pending-workone', `${BASE}/apply/pending-workone`),
    checkUrl(app, '/apply/status', `${BASE}/apply/status`),
  ]);

  // API: intake POST
  const intake = await post(`${BASE}/api/intake`, {
    first_name: 'Jozanna', last_name: 'Williams', email: 'jozanna.test.elevate@gmail.com',
    phone: '3175550001', program_interest: 'cosmetology-apprenticeship',
    referral_source: 'workone', zip: '46268',
  });
  app.items.push(`${intake.code === 200 && intake.json?.success ? '✅' : '❌'} POST /api/intake → ${JSON.stringify(intake.json).slice(0,80)}`);
  if (intake.code === 200 && intake.json?.success) app.pass++; else app.fail++;

  // ── 3. ONBOARDING FLOWS ───────────────────────────────────────────────────
  const onb = section('Onboarding Pages');
  await Promise.all([
    checkUrl(onb, '/onboarding', `${BASE}/onboarding`),
    checkUrl(onb, '/onboarding/learner', `${BASE}/onboarding/learner`),
    checkUrl(onb, '/onboarding/start', `${BASE}/onboarding/start`),
    checkUrl(onb, '/onboarding/handbook', `${BASE}/onboarding/handbook`),
    checkUrl(onb, '/onboarding/mou', `${BASE}/onboarding/mou`),
    checkUrl(onb, '/onboarding/legal', `${BASE}/onboarding/legal`),
    checkUrl(onb, '/onboarding/payroll-setup', `${BASE}/onboarding/payroll-setup`),
    checkUrl(onb, '/onboarding/partner', `${BASE}/onboarding/partner`),
    checkUrl(onb, '/onboarding/employer', `${BASE}/onboarding/employer`),
    checkUrl(onb, '/onboarding/staff', `${BASE}/onboarding/staff`),
    checkUrl(onb, '/onboarding/school', `${BASE}/onboarding/school`),
  ]);

  // ── 4. LOGIN / AUTH FLOW ──────────────────────────────────────────────────
  const auth = section('Login & Auth Flow');
  await Promise.all([
    checkUrl(auth, '/login', `${BASE}/login`),
    checkUrl(auth, '/logout', `${BASE}/logout`),
    checkUrl(auth, '/signup', `${BASE}/signup`),
    checkUrl(auth, '/forgot-password', `${BASE}/forgot-password`),
    checkUrl(auth, '/reset-password', `${BASE}/reset-password`),
  ]);

  // Auth: sign in with Jozanna's credentials via Supabase API
  const anonDb = createClient(SUPABASE_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: signInData, error: signInErr } = await anonDb.auth.signInWithPassword({
    email: 'jozanna.test.elevate@gmail.com',
    password: process.env.JOZANNA_PASSWORD || 'test-password-placeholder',
  });
  const signedIn = !signInErr && !!signInData?.session;
  auth.items.push(`${signedIn ? '✅' : '⚠️ '} Supabase signInWithPassword → ${signInErr?.message || 'session obtained'}`);
  if (signedIn) auth.pass++; else auth.fail++;

  // Password reset email trigger
  const { error: resetErr } = await anonDb.auth.resetPasswordForEmail('jozanna.test.elevate@gmail.com', {
    redirectTo: `${BASE}/reset-password`,
  });
  auth.items.push(`${!resetErr ? '✅' : '❌'} resetPasswordForEmail → ${resetErr?.message || 'email queued'}`);
  if (!resetErr) auth.pass++; else auth.fail++;

  // ── 5. PROGRAM-HOLDER PORTAL ──────────────────────────────────────────────
  const ph = section('Program-Holder Portal');
  await Promise.all([
    checkUrl(ph, '/program-holder', `${BASE}/program-holder`),
    checkUrl(ph, '/program-holder/dashboard', `${BASE}/program-holder/dashboard`),
    checkUrl(ph, '/program-holder/students', `${BASE}/program-holder/students`),
    checkUrl(ph, '/program-holder/students/pending', `${BASE}/program-holder/students/pending`),
    checkUrl(ph, '/program-holder/students/at-risk', `${BASE}/program-holder/students/at-risk`),
    checkUrl(ph, '/program-holder/programs', `${BASE}/program-holder/programs`),
    checkUrl(ph, '/program-holder/grades', `${BASE}/program-holder/grades`),
    checkUrl(ph, '/program-holder/analytics', `${BASE}/program-holder/analytics`),
    checkUrl(ph, '/program-holder/payroll', `${BASE}/program-holder/payroll`),
    checkUrl(ph, '/program-holder/reports', `${BASE}/program-holder/reports`),
    checkUrl(ph, '/program-holder/compliance', `${BASE}/program-holder/compliance`),
    checkUrl(ph, '/program-holder/documents', `${BASE}/program-holder/documents`),
    checkUrl(ph, '/program-holder/notifications', `${BASE}/program-holder/notifications`),
    checkUrl(ph, '/program-holder/campaigns', `${BASE}/program-holder/campaigns`),
    checkUrl(ph, '/program-holder/mou', `${BASE}/program-holder/mou`),
    checkUrl(ph, '/program-holder/handbook', `${BASE}/program-holder/handbook`),
    checkUrl(ph, '/program-holder/onboarding', `${BASE}/program-holder/onboarding`),
    checkUrl(ph, '/program-holder/settings', `${BASE}/program-holder/settings`),
    checkUrl(ph, '/program-holder/verification', `${BASE}/program-holder/verification`),
    checkUrl(ph, '/program-holder/portal', `${BASE}/program-holder/portal`),
    checkUrl(ph, '/program-holder/portal/students', `${BASE}/program-holder/portal/students`),
    checkUrl(ph, '/program-holder/portal/attendance', `${BASE}/program-holder/portal/attendance`),
    checkUrl(ph, '/program-holder/portal/messages', `${BASE}/program-holder/portal/messages`),
  ]);

  // ── 6. OTHER ROLE PORTALS ─────────────────────────────────────────────────
  const roles = section('Role Portals (auth-gated — expect redirect to login)');
  await Promise.all([
    checkUrl(roles, '/employer/dashboard', `${BASE}/employer/dashboard`),
    checkUrl(roles, '/employer/candidates', `${BASE}/employer/candidates`),
    checkUrl(roles, '/employer/jobs', `${BASE}/employer/jobs`),
    checkUrl(roles, '/employer/hours', `${BASE}/employer/hours`),
    checkUrl(roles, '/instructor/dashboard', `${BASE}/instructor/dashboard`),
    checkUrl(roles, '/instructor/students', `${BASE}/instructor/students`),
    checkUrl(roles, '/instructor/gradebook', `${BASE}/instructor/gradebook`),
    checkUrl(roles, '/admin/staff-portal/dashboard', `${BASE}/admin/staff-portal/dashboard`),
    checkUrl(roles, '/admin/staff-portal/students', `${BASE}/admin/staff-portal/students`),
    checkUrl(roles, '/partner/dashboard', `${BASE}/partner/dashboard`),
    checkUrl(roles, '/partner/students', `${BASE}/partner/students`),
    checkUrl(roles, '/partner/hours', `${BASE}/partner/hours`),
  ]);

  // ── 7. LMS ROUTES ─────────────────────────────────────────────────────────
  const lms = section('LMS Routes (Railway)');
  await Promise.all([
    checkUrl(lms, '/lms', `${BASE}/lms`),
    checkUrl(lms, '/lms/programs', `${BASE}/lms/programs`),
    checkUrl(lms, '/lms/courses', `${BASE}/lms/courses`),
    checkUrl(lms, '/learner/dashboard', `${BASE}/learner/dashboard`),
  ]);

  // ── 8. API HEALTH ─────────────────────────────────────────────────────────
  const api = section('API Health');
  const health = await post(`${BASE}/api/health`, {});
  api.items.push(`${health.code === 200 ? '✅' : '❌'} GET /api/health → ${JSON.stringify(health.json).slice(0,60)}`);
  if (health.code === 200) api.pass++; else api.fail++;

  const sched = await post(`${BASE}/api/schedule-consultation`, {
    name: 'Jozanna Williams', email: 'jozanna.test.elevate@gmail.com',
    phone: '3175550001', program: 'cosmetology-apprenticeship', message: 'Test',
  });
  api.items.push(`${sched.code === 200 && sched.json?.success ? '✅' : '❌'} POST /api/schedule-consultation → ${JSON.stringify(sched.json).slice(0,60)}`);
  if (sched.code === 200 && sched.json?.success) api.pass++; else api.fail++;

  // ── 9. EMAIL FLOWS (DB verification) ─────────────────────────────────────
  const email = section('Email Flows (DB state)');
  const { data: jUser } = await db.auth.admin.getUserById('2596804e-7f7f-4a1f-9f6d-8a8c513861c9');
  email.items.push(`${jUser.user?.email_confirmed_at ? '✅' : '❌'} Email confirmed: ${jUser.user?.email_confirmed_at || 'NOT CONFIRMED'}`);
  if (jUser.user?.email_confirmed_at) email.pass++; else email.fail++;

  // Check MOU signed
  const { data: holder } = await db.from('program_holders').select('mou_signed, status, approved_at').eq('id', '4bc589d3-bd39-4a50-a724-73e50506c1f1').single();
  email.items.push(`${holder?.mou_signed ? '✅' : '❌'} MOU signed: ${holder?.mou_signed}`);
  email.items.push(`${holder?.status === 'active' ? '✅' : '❌'} Holder status: ${holder?.status}`);
  email.items.push(`${holder?.approved_at ? '✅' : '❌'} Approved at: ${holder?.approved_at}`);
  if (holder?.mou_signed) email.pass++; else email.fail++;
  if (holder?.status === 'active') email.pass++; else email.fail++;
  if (holder?.approved_at) email.pass++; else email.fail++;

  // Check acknowledgements
  const { data: acks } = await db.from('program_holder_acknowledgements').select('document_type').eq('user_id', '2596804e-7f7f-4a1f-9f6d-8a8c513861c9');
  const ackTypes = acks?.map((a: any) => a.document_type) || [];
  email.items.push(`${ackTypes.includes('handbook') ? '✅' : '❌'} Handbook acknowledged`);
  email.items.push(`${ackTypes.includes('rights') ? '✅' : '❌'} Rights acknowledged`);
  if (ackTypes.includes('handbook')) email.pass++; else email.fail++;
  if (ackTypes.includes('rights')) email.pass++; else email.fail++;

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  let totalPass = 0, totalFail = 0;
  for (const s of results) {
    const status = s.fail === 0 ? '✅' : s.pass > 0 ? '⚠️ ' : '❌';
    console.log(`\n${status} ${s.section} (${s.pass}/${s.pass + s.fail})`);
    s.items.forEach(i => console.log(`   ${i}`));
    totalPass += s.pass;
    totalFail += s.fail;
  }
  console.log('\n' + '='.repeat(60));
  console.log(`\nTOTAL: ${totalPass} passed, ${totalFail} failed out of ${totalPass + totalFail} checks`);
  console.log(totalFail === 0 ? '\n✅ ALL CHECKS PASSED' : `\n⚠️  ${totalFail} checks need attention`);
}

main().catch(console.error);
