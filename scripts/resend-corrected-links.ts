#!/usr/bin/env tsx
/**
 * Resend corrected reset links to partners and enrolled students only.
 * The applicant "technical difficulty" emails were already delivered — don't resend those.
 * This batch fixes the redirect issue: links now go to /auth/callback
 * so Supabase routes through the callback and lands users on /auth/reset-password.
 */
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
const CALLBACK_URL  = `${SITE_URL}/auth/callback`;
const ELEVATE_CC    = ['elevate4humanityedu@gmail.com'];

const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

async function getResetLink(email: string): Promise<string> {
  const { data, error } = await db.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: CALLBACK_URL },
  });
  if (error || !data) {
    console.error(`  [WARN] generateLink failed for ${email}: ${error?.message}`);
    return `${SITE_URL}/auth/forgot-password`;
  }
  return (data as any)?.properties?.action_link || `${SITE_URL}/auth/forgot-password`;
}

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
    req.write(body); req.end();
  });
}

function partnerEmail(firstName: string, role: string, resetLink: string): string {
  const portalPath = role === 'partner' ? '/partner/dashboard' : '/program-holder/dashboard';
  const portalLabel = role === 'partner' ? 'Partner Portal' : 'Program Holder Dashboard';
  return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
  <img src="${SITE_URL}/images/Elevate_for_Humanity_logo_81bf0fab.jpg" alt="Elevate for Humanity" style="height:60px;margin-bottom:24px"/>
  <h2 style="color:#dc2626">Your Portal Access Link — Updated</h2>
  <p>Dear ${firstName},</p>
  <p>We are resending your portal link with a correction — the previous link had a redirect issue. Please use the button below to set your password and log in.</p>
  <div style="text-align:center;margin:32px 0">
    <a href="${resetLink}" style="background:#dc2626;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px">Set My Password &amp; Log In</a>
  </div>
  <p><strong>This link expires in 24 hours.</strong> If it expires, visit <a href="${SITE_URL}/auth/forgot-password" style="color:#dc2626">${SITE_URL}/auth/forgot-password</a> to get a new one.</p>
  <h3 style="color:#1e293b;margin-top:32px">After logging in — your ${portalLabel}:</h3>
  <ol style="line-height:2">
    <li>Go to <a href="${SITE_URL}${portalPath}" style="color:#dc2626">${SITE_URL}${portalPath}</a></li>
    <li>Complete your profile information</li>
    <li>Review and accept your current partnership agreement (MOU)</li>
    <li>Set up your student referral process</li>
  </ol>
  <p>Reply to this email if you need any help.</p>
  <p style="margin-top:32px">Warm regards,<br/><strong>" + PLATFORM_DEFAULTS.orgName + " Team</strong><br/>
  <a href="mailto:elevate4humanityedu@gmail.com">elevate4humanityedu@gmail.com</a></p>
</div>`;
}

function studentEmail(firstName: string, resetLink: string, program: string): string {
  return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
  <img src="${SITE_URL}/images/Elevate_for_Humanity_logo_81bf0fab.jpg" alt="Elevate for Humanity" style="height:60px;margin-bottom:24px"/>
  <h2 style="color:#dc2626">Updated Login Link — ${program}</h2>
  <p>Dear ${firstName},</p>
  <p>We are resending your login link with a correction — the previous link had a redirect issue that sent you to the home page. This link will take you directly to the password setup page.</p>
  <div style="text-align:center;margin:32px 0">
    <a href="${resetLink}" style="background:#dc2626;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px">Set My Password &amp; Log In</a>
  </div>
  <p><strong>This link expires in 24 hours.</strong> If it expires, visit <a href="${SITE_URL}/auth/forgot-password" style="color:#dc2626">${SITE_URL}/auth/forgot-password</a>.</p>
  <h3 style="color:#1e293b;margin-top:32px">After setting your password:</h3>
  <ol style="line-height:2">
    <li>You will be taken to your <a href="${SITE_URL}/learner/dashboard" style="color:#dc2626">Student Dashboard</a></li>
    <li>Complete any onboarding steps shown on your dashboard</li>
    <li>Open your course and use the <strong>Clock In</strong> button to start your session</li>
  </ol>
  <p>Reply to this email if you have any trouble.</p>
  <p style="margin-top:32px">Warm regards,<br/><strong>Elevate for Humanity Enrollment Team</strong><br/>
  <a href="mailto:elevate4humanityedu@gmail.com">elevate4humanityedu@gmail.com</a></p>
</div>`;
}

// ── Recipients ─────────────────────────────────────────────────────────────
const STUDENTS = [
  { email: 'fletcheraustin98@gmail.com',  name: 'Austin',   program: 'HVAC EPA 608 Program' },
  { email: 'pedroverajr1125@gmail.com',   name: 'Pedro',    program: 'HVAC EPA 608 Program' },
  { email: 'natataroa@gmail.com',          name: 'Natalia',  program: 'Professional Barber Program' },
  { email: 'jbwhite888@icloud.com',        name: 'Jordan',   program: 'Professional Barber Program' },
  { email: 'msanqin@gmail.com',            name: 'Mercedes', program: 'Professional Barber Program' },
];

const PARTNERS = [
  { email: 'adamkriech1@gmail.com',         name: 'Adam',      role: 'partner' },
  { email: 'elizabethpowell6262@gmail.com', name: 'Elizabeth', role: 'program_holder' },
];

// Also resend to all other partners/program_holders who got the broken link
const { data: profiles } = await db.from('profiles').select('id,email,full_name,role');
const otherPartners = (profiles || []).filter((p: any) =>
  (p.role === 'partner' || p.role === 'program_holder') &&
  p.email?.includes('@') &&
  !PARTNERS.find(k => k.email === p.email)
);

let sent = 0, failed = 0;
console.log('\nResending corrected links...\n');

for (const s of STUDENTS) {
  const link = await getResetLink(s.email);
  const ok = await sendEmail(s.email, s.name, `[Corrected Link] ${s.program} — Set Your Password`, studentEmail(s.name, link, s.program), ELEVATE_CC);
  console.log(`  [STUDENT]  ${ok ? 'OK' : 'FAIL'} → ${s.name} <${s.email}>`);
  ok ? sent++ : failed++;
}

for (const p of PARTNERS) {
  const link = await getResetLink(p.email);
  const ok = await sendEmail(p.email, p.name, '[Corrected Link] Your Elevate Partner Portal Access', partnerEmail(p.name, p.role, link), ELEVATE_CC);
  console.log(`  [PARTNER]  ${ok ? 'OK' : 'FAIL'} → ${p.name} <${p.email}>`);
  ok ? sent++ : failed++;
}

for (const p of otherPartners as any[]) {
  const firstName = (p.full_name || '').split(' ')[0] || 'there';
  const link = await getResetLink(p.email);
  const ok = await sendEmail(p.email, p.full_name || firstName, '[Corrected Link] Your Elevate Partner Portal Access', partnerEmail(firstName, p.role, link), ELEVATE_CC);
  console.log(`  [PARTNER]  ${ok ? 'OK' : 'FAIL'} → ${p.full_name} <${p.email}>`);
  ok ? sent++ : failed++;
}

console.log(`\nDone. Sent: ${sent}  Failed: ${failed}`);
