#!/usr/bin/env node
/**
 * Ask Pedro & Austin to disregard incorrect start-date emails and reply with LMS progress
 * for WorkOne Program Performance & Development.
 *
 *   node scripts/ops/send-pedro-austin-progress-request.mjs
 *   node scripts/ops/send-pedro-austin-progress-request.mjs --dry-run
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org').replace(
  /\/$/,
  '',
);
const ELEVATE_COPY = 'elevate4humanityedu@gmail.com';
const HVAC_COURSE_ID = 'f0593164-55be-5867-98e7-8a86770a8dd0';
const DRY_RUN = process.argv.includes('--dry-run');

const STUDENTS = [
  { userId: '4b6b02f7-6ceb-45bf-960d-6ae5e8545f77', email: 'pedroverajr1125@gmail.com', firstName: 'Pedro' },
  { userId: '9feda5bd-c30b-458d-a22e-4890a1240336', email: 'fletcheraustin98@gmail.com', firstName: 'Austin' },
];

function loadEnvLocal() {
  const p = join(ROOT, '.env.local');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const k = t.slice(0, i);
    let v = t.slice(i + 1);
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key || key === 'placeholder') {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

async function loadSendGridKey() {
  if (process.env.SENDGRID_API_KEY) return process.env.SENDGRID_API_KEY;
  const { data } = await db.from('platform_secrets').select('value').eq('key', 'SENDGRID_API_KEY').maybeSingle();
  if (data?.value) return data.value;
  const { data: app } = await db.from('app_secrets').select('value').eq('key', 'SENDGRID_API_KEY').maybeSingle();
  return app?.value ?? null;
}

function buildHtml(student, snapshot) {
  const courseUrl = `${SITE_URL}/lms/courses/${HVAC_COURSE_ID}`;
  const dashboardUrl = `${SITE_URL}/learner/dashboard`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#1e293b">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;overflow:hidden">
<tr><td style="background:#1e293b;padding:24px 32px">
<p style="margin:0;color:#fff;font-size:18px;font-weight:700">Elevate for Humanity</p>
<p style="margin:6px 0 0;color:#94a3b8;font-size:13px">HVAC Technician Program — Important correction</p>
</td></tr>
<tr><td style="padding:32px">
<p style="margin:0 0 16px;font-size:15px">Hi ${student.firstName},</p>

<div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin:0 0 20px">
<p style="margin:0;font-size:14px;line-height:1.7;color:#92400e">
<strong>Please disregard</strong> any recent Elevate emails about a new enrollment or program start date
(including messages mentioning June 15, 2026). Those were sent in error.
You are <strong>already enrolled and active</strong> in the HVAC Technician program — nothing changed on your account.
</p>
</div>

<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#475569">
We are preparing your file for <strong>Program Performance &amp; Development (PPD)</strong> with WorkOne.
Please <strong>reply to this email</strong> with a short update on your <strong>current online training progress</strong>, including:
</p>
<ul style="margin:0 0 20px;padding-left:20px;font-size:14px;line-height:1.8;color:#475569">
<li>Which HVAC lessons or modules you have started or completed online</li>
<li>Approximate percent complete (or number of lessons done)</li>
<li>Any quizzes or checkpoints you have passed</li>
<li>Any issues logging in or accessing coursework</li>
<li>Your on-the-job (OJT) hours status if applicable</li>
</ul>

<div style="background:#f1f5f9;border-radius:8px;padding:16px 20px;margin:0 0 24px">
<p style="margin:0 0 8px;font-size:13px;font-weight:bold;color:#1e293b">What we have on file (for your reference)</p>
<p style="margin:0;font-size:13px;line-height:1.7;color:#475569">
Program: <strong>HVAC Technician (EPA 608)</strong><br>
Enrollment status: <strong>${snapshot.enrollmentStatus}</strong><br>
Online course progress (system): <strong>${snapshot.progressPercent}%</strong> — ${snapshot.lessonsCompleted} lesson(s) marked complete<br>
OJT hours credited (approved): <strong>${snapshot.ojtHours}</strong> hours
</p>
</div>

<p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#475569">
You can check your coursework here:<br>
<a href="${courseUrl}" style="color:#dc2626">${courseUrl}</a><br>
<a href="${dashboardUrl}" style="color:#dc2626">${dashboardUrl}</a>
</p>

<p style="margin:0;font-size:14px;color:#475569">
Reply directly to <a href="mailto:${ELEVATE_COPY}" style="color:#dc2626">${ELEVATE_COPY}</a> or to this message.
If you have questions, call <strong>(317) 314-3757</strong>.
</p>

<p style="margin:24px 0 0;font-size:14px">
Thank you,<br>
<strong>Elizabeth Greene</strong><br>
Elevate for Humanity Career &amp; Technical Institute
</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

async function getProgressSnapshot(userId) {
  const { data: enr } = await db
    .from('program_enrollments')
    .select('status, enrollment_state')
    .eq('user_id', userId)
    .eq('program_slug', 'hvac-technician')
    .maybeSingle();

  const { data: lms } = await db
    .from('lms_progress')
    .select('progress_percent')
    .eq('user_id', userId)
    .eq('course_id', HVAC_COURSE_ID)
    .maybeSingle();

  const { count: lessonsCompleted } = await db
    .from('lesson_progress')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('completed_at', 'is', null);

  const { data: hours } = await db
    .from('hour_entries')
    .select('hours_claimed, status')
    .eq('user_id', userId)
    .eq('program_slug', 'hvac-technician');

  const ojtHours = (hours ?? [])
    .filter((h) => h.status === 'approved')
    .reduce((sum, h) => sum + Number(h.hours_claimed || 0), 0);

  return {
    enrollmentStatus: enr?.status || enr?.enrollment_state || 'active',
    progressPercent: lms?.progress_percent ?? 0,
    lessonsCompleted: lessonsCompleted ?? 0,
    ojtHours,
  };
}

async function sendEmail(apiKey, student, html) {
  const subject = 'Please disregard prior start-date email — reply with your HVAC training progress (PPD)';
  const payload = JSON.stringify({
    personalizations: [
      {
        to: [{ email: student.email, name: student.firstName }],
        cc: [{ email: ELEVATE_COPY, name: 'Elevate Admin' }],
      },
    ],
    from: { email: 'noreply@elevateforhumanity.org', name: 'Elizabeth Greene | Elevate for Humanity' },
    reply_to: { email: ELEVATE_COPY, name: 'Elizabeth Greene' },
    subject,
    content: [{ type: 'text/html', value: html }],
  });

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would send to ${student.email}`);
    return;
  }

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: payload,
  });
  if (res.status !== 202) throw new Error(`SendGrid ${res.status}: ${await res.text()}`);
  console.log(`  ✅ Sent to ${student.email} (CC ${ELEVATE_COPY})`);
}

async function main() {
  const apiKey = await loadSendGridKey();
  if (!apiKey && !DRY_RUN) {
    console.error('SENDGRID_API_KEY not found');
    process.exit(1);
  }

  console.log(DRY_RUN ? 'DRY RUN\n' : 'LIVE\n');

  for (const student of STUDENTS) {
    const snapshot = await getProgressSnapshot(student.userId);
    console.log(`${student.firstName}: ${snapshot.progressPercent}% online, ${snapshot.ojtHours}h OJT`);
    const html = buildHtml(student, snapshot);
    await sendEmail(apiKey, student, html);
  }

  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
