#!/usr/bin/env node
/**
 * Staff ops: enroll WIOA HVAC students and send welcome email.
 *
 *   pnpm tsx --env-file=.env.local scripts/ops/enroll-hvac-wioa-student.mjs
 *   pnpm tsx --env-file=.env.local scripts/ops/enroll-hvac-wioa-student.mjs --resend-only
 */
import { createClient } from '@supabase/supabase-js';

const STUDENTS = [
  {
    email: 'ehouse2768@gmail.com',
    fullName: 'Ethan House',
    firstName: 'Ethan',
    phone: '317-854-2867',
    userId: '90649f25-a6fe-4b94-99a8-7e6a57090448',
    revisedEmail: true,
  },
  {
    email: 'pedroverajr1125@gmail.com',
    fullName: 'Pedro Carpintero',
    firstName: 'Pedro',
    phone: null,
    userId: '4b6b02f7-6ceb-45bf-960d-6ae5e8545f77',
  },
  {
    email: 'fletcheraustin98@gmail.com',
    fullName: 'Austin Fletcher',
    firstName: 'Austin',
    phone: null,
    userId: '9feda5bd-c30b-458d-a22e-4890a1240336',
  },
];

const HVAC_PROGRAM_ID = '4226f7f6-fbc1-44b5-83e8-b12ea149e4c7';
const HVAC_COURSE_ID = 'f0593164-55be-5867-98e7-8a86770a8dd0';
const PROGRAM_SLUG = 'hvac-technician';
const PROGRAM_NAME = 'HVAC Technician (EPA 608 Certification)';
const START_DATE = '2026-06-15';
const START_DATE_DISPLAY = 'Monday, June 15, 2026';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org').replace(
  /\/$/,
  '',
);
const ELEVATE_COPY_EMAIL = 'elevate4humanityedu@gmail.com';
const RESEND_ONLY = process.argv.includes('--resend-only');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey || serviceKey === 'placeholder') {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function loadSendGridKey() {
  if (process.env.SENDGRID_API_KEY) return process.env.SENDGRID_API_KEY;
  const { data } = await db.from('platform_secrets').select('value').eq('key', 'SENDGRID_API_KEY').maybeSingle();
  if (data?.value) return data.value;
  const { data: app } = await db.from('app_secrets').select('value').eq('key', 'SENDGRID_API_KEY').maybeSingle();
  return app?.value ?? null;
}

function buildWelcomeHtml(student, { passwordSetUrl }) {
  const loginUrl = `${SITE_URL}/login`;
  const dashboardUrl = `${SITE_URL}/learner/dashboard`;
  const workoneUrl = `${SITE_URL}/find-workone`;
  const courseUrl = `${SITE_URL}/lms/courses/${HVAC_COURSE_ID}`;

  return `
<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1e293b">
  <div style="background:#1e293b;padding:24px 32px">
    <p style="margin:0;color:#fff;font-size:18px;font-weight:700">Elevate for Humanity</p>
    <p style="margin:4px 0 0;color:#94a3b8;font-size:13px">Career &amp; Technical Institute</p>
  </div>
  <div style="padding:32px">
    ${
      student.revisedEmail
        ? `<p style="background:#fef3c7;border:1px solid #fcd34d;border-radius:6px;padding:10px 14px;color:#92400e;font-size:13px;margin:0 0 16px">
        <strong>Corrected start date:</strong> Your program begins on <strong>Monday, June 15, 2026</strong> (not Sunday). Please use this date when you contact WorkOne.
      </p>`
        : ''
    }
    <h1 style="margin:0 0 16px;font-size:22px">Welcome, ${student.firstName} — you're enrolled!</h1>
    <p style="color:#475569;line-height:1.6;margin:0 0 12px">
      You are officially enrolled in <strong>${PROGRAM_NAME}</strong> through workforce funding (WIOA).
    </p>
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:0 0 20px">
      <p style="margin:0 0 6px;font-weight:700;color:#1e40af">Program start date</p>
      <p style="margin:0;color:#1e3a8a;font-size:18px;font-weight:700">${START_DATE_DISPLAY}</p>
    </div>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:0 0 20px">
      <p style="margin:0 0 8px;font-weight:700;color:#991b1b">Important — contact your WorkOne career navigator</p>
      <p style="margin:0;color:#7f1d1d;font-size:14px;line-height:1.6">
        Please call or visit your <strong>WorkOne career navigator</strong> and let them know:
        (1) you are enrolled with Elevate for Humanity in the HVAC program, and
        (2) your official start date is <strong>${START_DATE_DISPLAY}</strong>.
        This keeps your WIOA funding file active and on schedule.
      </p>
      <p style="margin:12px 0 0">
        <a href="${workoneUrl}" style="color:#dc2626;font-weight:700">Find your nearest WorkOne office →</a>
      </p>
    </div>
    <p style="color:#475569;line-height:1.6;margin:0 0 20px">Your next steps in the student portal:</p>
    <ol style="margin:0 0 24px;padding-left:20px;color:#475569;font-size:14px;line-height:2">
      <li>Log in to your student dashboard</li>
      <li>Complete enrollment confirmation and orientation</li>
      <li>Submit any outstanding enrollment documents</li>
      <li>Begin online coursework before your on-site lab sessions</li>
    </ol>
    ${
      passwordSetUrl
        ? `<p style="text-align:center;margin:0 0 12px">
        <a href="${passwordSetUrl}" style="display:inline-block;background:#dc2626;color:#fff;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px">
          Set My Password &amp; Log In →
        </a>
      </p>
      <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0 0 20px">Password link expires in 24 hours. After that, use Forgot Password at login.</p>`
        : `<p style="text-align:center;margin:0 0 20px">
        <a href="${loginUrl}" style="display:inline-block;background:#dc2626;color:#fff;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px">
          Log In to Your Dashboard →
        </a>
      </p>`
    }
    <p style="text-align:center;margin:0 0 24px">
      <a href="${courseUrl}" style="color:#2563eb;font-weight:600">Open HVAC program →</a>
      &nbsp;·&nbsp;
      <a href="${dashboardUrl}" style="color:#2563eb;font-weight:600">Student dashboard →</a>
    </p>
    <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6">
      Questions? Reply to this email or call <strong>(317) 555-0199</strong>.<br>
      Elizabeth Greene — Director, Elevate for Humanity Career &amp; Technical Institute
    </p>
  </div>
</div>`;
}

async function sendEmail(sendgridKey, { to, subject, html, bcc }) {
  const personalization = { to: [{ email: to }] };
  if (bcc?.length) personalization.bcc = bcc.map((email) => ({ email }));

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sendgridKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [personalization],
      from: { email: 'noreply@elevateforhumanity.org', name: 'Elevate for Humanity' },
      reply_to: { email: ELEVATE_COPY_EMAIL, name: 'Elevate for Humanity' },
      subject,
      content: [{ type: 'text/html', value: html }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SendGrid ${res.status}: ${body}`);
  }
}

async function enrollStudent(student, sendgridKey) {
  const now = new Date().toISOString();
  console.log(`\n── ${student.fullName} (${student.email}) ──`);

  const profileUpdate = {
    role: 'student',
    enrollment_status: 'active',
    updated_at: now,
  };
  if (student.phone) profileUpdate.phone = student.phone;

  await db.from('profiles').update(profileUpdate).eq('id', student.userId);

  const enrollmentPayload = {
    user_id: student.userId,
    student_id: student.userId,
    program_id: HVAC_PROGRAM_ID,
    program_slug: PROGRAM_SLUG,
    course_id: HVAC_COURSE_ID,
    email: student.email,
    full_name: student.fullName.trim(),
    phone: student.phone,
    funding_source: 'wioa',
    funding_pathway: 'wioa',
    status: 'active',
    enrollment_state: 'enrolled',
    payment_status: 'waived',
    funding_verified: true,
    enrolled_at: now,
    enrollment_confirmed_at: now,
    start_date: START_DATE,
    next_required_action: 'COMPLETE_ORIENTATION',
    updated_at: now,
  };

  const { data: enrollment, error: enrollErr } = await db
    .from('program_enrollments')
    .upsert(enrollmentPayload, { onConflict: 'user_id,program_id' })
    .select('id, status, start_date')
    .single();

  if (enrollErr) {
    throw new Error(`Enrollment failed for ${student.email}: ${enrollErr.message}`);
  }

  console.log('✅ Enrollment:', enrollment.id, 'start', enrollment.start_date);

  await db.from('lms_progress').upsert(
    {
      user_id: student.userId,
      course_id: HVAC_COURSE_ID,
      course_slug: PROGRAM_SLUG,
      status: 'in_progress',
      progress_percent: 0,
      started_at: now,
      last_activity_at: now,
    },
    { onConflict: 'user_id,course_id' },
  );

  await db.from('training_enrollments').upsert(
    {
      user_id: student.userId,
      course_id: HVAC_COURSE_ID,
      program_id: HVAC_PROGRAM_ID,
      program_slug: PROGRAM_SLUG,
      status: 'active',
      progress: 0,
      enrolled_at: now,
    },
    { onConflict: 'user_id,course_id' },
  );

  let passwordSetUrl = null;
  const { data: linkData, error: linkErr } = await db.auth.admin.generateLink({
    type: 'recovery',
    email: student.email,
    options: {
      redirectTo: `${SITE_URL}/auth/callback?redirect=${encodeURIComponent('/learner/dashboard')}`,
    },
  });
  if (!linkErr && linkData?.properties?.action_link) {
    passwordSetUrl = linkData.properties.action_link;
  }

  const subjectPrefix = student.revisedEmail ? 'CORRECTED: ' : '';
  const subject = `${subjectPrefix}Welcome to HVAC — start date ${START_DATE_DISPLAY}`;
  const html = buildWelcomeHtml(student, { passwordSetUrl });

  await sendEmail(sendgridKey, {
    to: student.email,
    subject,
    html,
    bcc: [ELEVATE_COPY_EMAIL],
  });
  console.log('✅ Email sent to', student.email);

  await sendEmail(sendgridKey, {
    to: ELEVATE_COPY_EMAIL,
    subject: `[COPY] ${subject} — ${student.fullName.trim()}`,
    html: `<p style="font-family:Arial,sans-serif;color:#475569">Internal copy for <strong>${student.email}</strong>.</p><hr />${html}`,
  });
  console.log('✅ Admin copy sent');
}

async function main() {
  const sendgridKey = await loadSendGridKey();
  if (!sendgridKey) {
    console.error('SENDGRID_API_KEY not found');
    process.exit(1);
  }

  for (const student of STUDENTS) {
    await enrollStudent(student, sendgridKey);
  }

  console.log('\n✅ All students enrolled — learner dashboard: ' + SITE_URL + '/learner/dashboard');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
