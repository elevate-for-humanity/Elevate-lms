#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import * as https from 'https';
import { config } from 'dotenv';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
config({ path: '.env.local' });

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SG_KEY        = process.env.SENDGRID_API_KEY!;
const FROM_EMAIL    = 'noreply@elevateforhumanity.org';
const FROM_NAME     = 'Elevate for Humanity';
const SITE_URL      = 'https://www.elevateforhumanity.org';
const ELEVATE_CC    = ['elevate4humanityedu@gmail.com'];

const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// ── Accounts to KEEP (skip reset for these — handled separately) ─────────────
const KEEP_IDS = new Set([
  '9feda5bd-c30b-458d-a22e-4890a1240336', // Austin Fletcher  (HVAC)
  '4b6b02f7-6ceb-45bf-960d-6ae5e8545f77', // Pedro Carpintero (HVAC)
  '2d761d18-6ff9-4355-b9dd-5ff55903906b', // Natalia Roa      (Barber)
  'b35f3289-614b-4c6e-b029-73617fc46655', // Jordan White     (Barber)
  '70483e3b-30f1-4c58-8046-d068ab7356ee', // Mercedes Wellington (Barber)
  '5f20c09c-7fd5-4aac-b2d2-aef12b78fbb2', // Adam Kriech      (Kountry Kutz partner)
  '8e352e99-d552-4690-b8e7-8a560bb1f873', // Elizabeth Greene (program_holder)
  '4994cf7e-98dc-4337-968b-243957fff6c9', // Elizabeth L Greene (admin)
  'b543fa81-69d4-4d6e-995a-e570e2aed0d2', // elevate4humanityedu@gmail.com
  '964dc85a-bce8-4e67-92eb-198ffafb2384', // curvaturebodysculpting@gmail.com
]);

// ── SendGrid send helper ─────────────────────────────────────────────────────
function sendEmail(to: string, toName: string, subject: string, html: string, cc: string[] = []): Promise<boolean> {
  return new Promise((resolve) => {
    const personalizations: any[] = [{ to: [{ email: to, name: toName }] }];
    if (cc.length) personalizations[0].cc = cc.map(e => ({ email: e }));
    const body = JSON.stringify({
      personalizations,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      reply_to: { email: 'elevate4humanityedu@gmail.com', name: FROM_NAME },
      subject,
      content: [{ type: 'text/html', value: html }],
    });
    const req = https.request({
      hostname: 'api.sendgrid.com',
      path: '/v3/mail/send',
      method: 'POST',
      headers: { Authorization: `Bearer ${SG_KEY}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(res.statusCode === 202));
    });
    req.on('error', () => resolve(false));
    req.write(body);
    req.end();
  });
}

// ── Email templates ──────────────────────────────────────────────────────────

function applicantEmail(firstName: string): string {
  return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
  <img src="${SITE_URL}/images/Elevate_for_Humanity_logo_81bf0fab.jpg" alt="Elevate for Humanity" style="height:60px;margin-bottom:24px"/>
  <h2 style="color:#dc2626">Important Update About Your Application</h2>
  <p>Dear ${firstName},</p>
  <p>We want to sincerely apologize — we are currently experiencing <strong>technical difficulties with our enrollment system</strong> and your application may have been affected. We are actively working to resolve this and want to make sure you don't lose your spot.</p>

  <p><strong>If you are still interested in attending Elevate for Humanity, here is what we need you to do:</strong></p>

  <ol style="line-height:2">
    <li><strong>Email us</strong> at <a href="mailto:elevate4humanityedu@gmail.com">elevate4humanityedu@gmail.com</a> and let us know you are still interested. This keeps your application active.</li>
    <li><strong>Complete Work One registration</strong> — this is required for our programs. Visit your nearest WorkOne location or go online to get registered.</li>
    <li><strong>Create your Indiana Career Connect account</strong> — visit <a href="https://www.indianacareerconnect.com" style="color:#dc2626">www.indianacareerconnect.com</a>, register, and set up an appointment. This is a required step before enrollment can be finalized.</li>
    <li><strong>Once those steps are done</strong>, we will send you a new onboarding link to complete your enrollment through our student portal at <a href="${SITE_URL}/learner/dashboard" style="color:#dc2626">${SITE_URL}/learner/dashboard</a>.</li>
  </ol>

  <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:16px;margin:24px 0;border-radius:4px">
    <strong>If you are NO longer interested</strong>, please reply to this email and let us know so we can update our records. We completely understand and appreciate you letting us know.
  </div>

  <p>We apologize for any confusion this has caused. Our team is committed to making sure your path to a new career stays on track.</p>

  <p>Thank you for your patience and interest in Elevate for Humanity.</p>
  <p style="margin-top:32px">Warm regards,<br/><strong>Elevate for Humanity Enrollment Team</strong><br/>
  <a href="mailto:elevate4humanityedu@gmail.com">elevate4humanityedu@gmail.com</a><br/>
  <a href="${SITE_URL}">${SITE_URL}</a></p>
</div>`;
}

function partnerOnboardingEmail(firstName: string, role: string, resetLink: string): string {
  const portalPath = role === 'partner' ? '/partner/dashboard' : '/program-holder/dashboard';
  const portalLabel = role === 'partner' ? 'Partner Portal' : 'Program Holder Dashboard';
  return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
  <img src="${SITE_URL}/images/Elevate_for_Humanity_logo_81bf0fab.jpg" alt="Elevate for Humanity" style="height:60px;margin-bottom:24px"/>
  <h2 style="color:#dc2626">Your New Portal Access Link — Action Required</h2>
  <p>Dear ${firstName},</p>
  <p>We are updating our partner portal and sending you a fresh onboarding link. Please use the button below to set your password and complete your account setup.</p>

  <div style="text-align:center;margin:32px 0">
    <a href="${resetLink}" style="background:#dc2626;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px">Set Your Password &amp; Log In</a>
  </div>

  <p><strong>This link expires in 24 hours.</strong> If it expires, visit <a href="${SITE_URL}/login" style="color:#dc2626">${SITE_URL}/login</a> and use "Forgot Password" to get a new one.</p>

  <h3 style="color:#1e293b;margin-top:32px">After logging in — your ${portalLabel}:</h3>
  <ol style="line-height:2">
    <li>Go to <a href="${SITE_URL}${portalPath}" style="color:#dc2626">${SITE_URL}${portalPath}</a></li>
    <li>Complete your profile information</li>
    <li>Review and accept your current partnership agreement (MOU)</li>
    <li>Set up your student referral process</li>
    <li>Review any active student placements or enrollments</li>
  </ol>

  <p>If you run into any issues or your dashboard is not loading correctly, reply to this email and we will assist you immediately.</p>

  <p style="margin-top:32px">Warm regards,<br/><strong>" + PLATFORM_DEFAULTS.orgName + " Team</strong><br/>
  <a href="mailto:elevate4humanityedu@gmail.com">elevate4humanityedu@gmail.com</a></p>
</div>`;
}

function studentResetEmail(firstName: string, resetLink: string, program: string): string {
  return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
  <img src="${SITE_URL}/images/Elevate_for_Humanity_logo_81bf0fab.jpg" alt="Elevate for Humanity" style="height:60px;margin-bottom:24px"/>
  <h2 style="color:#dc2626">Welcome Back — Set Your New Password</h2>
  <p>Dear ${firstName},</p>
  <p>Your ${program} account has been refreshed. Please click the button below to set your own password and access your student dashboard.</p>

  <div style="text-align:center;margin:32px 0">
    <a href="${resetLink}" style="background:#dc2626;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px">Set My Password &amp; Log In</a>
  </div>

  <p><strong>This link expires in 24 hours.</strong></p>

  <h3 style="color:#1e293b;margin-top:32px">After logging in:</h3>
  <ol style="line-height:2">
    <li>Go to your <a href="${SITE_URL}/learner/dashboard" style="color:#dc2626">Student Dashboard</a></li>
    <li>Complete any remaining onboarding steps shown on your dashboard</li>
    <li>Make sure your profile information is up to date</li>
    <li>Open your course and review where you left off</li>
    <li>Use the <strong>Clock In</strong> button in your dashboard when you are ready to begin a session</li>
  </ol>

  <p>If you have any trouble logging in, reply to this email and we will help you right away.</p>

  <p style="margin-top:32px">Warm regards,<br/><strong>Elevate for Humanity Enrollment Team</strong><br/>
  <a href="mailto:elevate4humanityedu@gmail.com">elevate4humanityedu@gmail.com</a></p>
</div>`;
}

// ── Main ─────────────────────────────────────────────────────────────────────
const { data: profiles } = await db.from('profiles').select('id,email,full_name,role');
const { data: enrollments } = await db.from('program_enrollments').select('user_id,program_id,status').in('status', ['active','enrolled','approved']);

const enrolledIds = new Set((enrollments || []).map((e: any) => e.user_id));

// Categorise
const applicants = (profiles || []).filter((p: any) =>
  p.role === 'student' && !KEEP_IDS.has(p.id) && !enrolledIds.has(p.id) && p.email?.includes('@')
);
const partners = (profiles || []).filter((p: any) =>
  (p.role === 'partner' || p.role === 'program_holder') && !KEEP_IDS.has(p.id) && p.email?.includes('@')
);
const confirmedStudents = [
  { id: '9feda5bd-c30b-458d-a22e-4890a1240336', email: 'fletcheraustin98@gmail.com',  name: 'Austin',   program: 'HVAC EPA 608 Program' },
  { id: '4b6b02f7-6ceb-45bf-960d-6ae5e8545f77', email: 'pedroverajr1125@gmail.com',   name: 'Pedro',    program: 'HVAC EPA 608 Program' },
  { id: '2d761d18-6ff9-4355-b9dd-5ff55903906b', email: 'natataroa@gmail.com',          name: 'Natalia',  program: 'Professional Barber Program' },
  { id: 'b35f3289-614b-4c6e-b029-73617fc46655', email: 'jbwhite888@icloud.com',        name: 'Jordan',   program: 'Professional Barber Program' },
  { id: '70483e3b-30f1-4c58-8046-d068ab7356ee', email: 'msanqin@gmail.com',            name: 'Mercedes', program: 'Professional Barber Program' },
];
const confirmedPartners = [
  { id: '5f20c09c-7fd5-4aac-b2d2-aef12b78fbb2', email: 'adamkriech1@gmail.com',         name: 'Adam',      role: 'partner' },
  { id: '8e352e99-d552-4690-b8e7-8a560bb1f873', email: 'elizabethpowell6262@gmail.com', name: 'Elizabeth', role: 'program_holder' },
];

console.log(`\nApplicants (no enrollment): ${applicants.length}`);
console.log(`Other partners/holders:     ${partners.length}`);
console.log(`Confirmed students:         ${confirmedStudents.length}`);
console.log(`Confirmed partners:         ${confirmedPartners.length}`);
console.log('\nSending...\n');

let sent = 0, failed = 0;

// 1. Applicant "technical difficulty" emails
for (const p of applicants as any[]) {
  const firstName = (p.full_name || '').split(' ')[0] || 'there';
  const ok = await sendEmail(p.email, p.full_name || firstName, 'Important Update About Your ' + PLATFORM_DEFAULTS.orgName + ' Application', applicantEmail(firstName), ELEVATE_CC);
  console.log(`  [APPLICANT] ${ok ? 'OK' : 'FAIL'} → ${p.full_name} <${p.email}>`);
  ok ? sent++ : failed++;
}

// Recovery links must include redirectTo → /auth/callback so Supabase
// sends a PKCE code that the callback route exchanges for a session,
// then redirects to /auth/reset-password (not the home page).
const CALLBACK_URL = `${SITE_URL}/auth/callback`;

async function getResetLink(email: string): Promise<string> {
  const { data: linkData, error } = await db.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: CALLBACK_URL },
  });
  if (error || !linkData) {
    console.error(`  [WARN] generateLink failed for ${email}: ${error?.message}`);
    return `${SITE_URL}/auth/forgot-password`;
  }
  return (linkData as any)?.properties?.action_link || `${SITE_URL}/auth/forgot-password`;
}

// 2. Other partner/program_holder onboarding emails
for (const p of partners as any[]) {
  const firstName = (p.full_name || '').split(' ')[0] || 'there';
  const resetLink = await getResetLink(p.email);
  const ok = await sendEmail(p.email, p.full_name || firstName, 'Your ' + PLATFORM_DEFAULTS.orgName + ' Partner Portal — New Access Link', partnerOnboardingEmail(firstName, p.role, resetLink), ELEVATE_CC);
  console.log(`  [PARTNER]    ${ok ? 'OK' : 'FAIL'} → ${p.full_name} <${p.email}>`);
  ok ? sent++ : failed++;
}

// 3. Confirmed partners (Adam + Elizabeth)
for (const p of confirmedPartners) {
  const resetLink = await getResetLink(p.email);
  const ok = await sendEmail(p.email, p.name, 'Your ' + PLATFORM_DEFAULTS.orgName + ' Partner Portal — New Access Link', partnerOnboardingEmail(p.name, p.role, resetLink), ELEVATE_CC);
  console.log(`  [CONF PARTNER] ${ok ? 'OK' : 'FAIL'} → ${p.name} <${p.email}>`);
  ok ? sent++ : failed++;
}

// 4. Confirmed enrolled students (Austin, Pedro, Natalia, Jordan, Mercedes)
for (const s of confirmedStudents) {
  const resetLink = await getResetLink(s.email);
  const ok = await sendEmail(s.email, s.name, `Your ${s.program} Account — Set Your Password`, studentResetEmail(s.name, resetLink, s.program), ELEVATE_CC);
  console.log(`  [STUDENT]    ${ok ? 'OK' : 'FAIL'} → ${s.name} <${s.email}>`);
  ok ? sent++ : failed++;
}

console.log(`\n✓ Done. Sent: ${sent}  Failed: ${failed}`);
