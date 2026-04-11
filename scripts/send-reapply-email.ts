/**
 * Finds all HVAC applicants (started or submitted) and sends them
 * an apology email with a fresh link to reapply.
 *
 * Usage: pnpm tsx scripts/send-reapply-email.ts
 */

import { getAdminClient } from '@/lib/supabase/admin';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = 'noreply@elevateforhumanity.org';
const FROM_NAME = 'Elizabeth Greene — Elevate for Humanity';
const APPLY_URL = 'https://www.elevateforhumanity.org/programs/hvac-technician/apply';

if (!SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY not set');
  process.exit(1);
}

async function sendEmail(to: string, firstName: string): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Georgia,serif;font-size:12px;color:#111;max-width:620px;margin:0 auto;padding:32px 24px;line-height:1.7;">

  <div style="border-bottom:2px solid #111;padding-bottom:12px;margin-bottom:20px;">
    <div style="font-size:14px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">Elevate for Humanity</div>
    <div style="font-size:10px;color:#444;margin-top:2px;">www.elevateforhumanity.org &nbsp;·&nbsp; Indianapolis, Indiana</div>
  </div>

  <p>Dear ${firstName},</p>

  <p>
    I am writing to personally apologize for a technical issue that affected our HVAC Technician
    program application and enrollment process. Due to a system error, some applicants who started
    or submitted an application may have experienced errors, incomplete submissions, or been unable
    to complete the enrollment process.
  </p>

  <p>
    <strong>This was our error, not yours.</strong> We have identified and fixed the issue, and our
    application system is now fully operational.
  </p>

  <p>
    We would like to invite you to reapply using the link below. Your interest in the HVAC Technician
    program means a great deal to us, and we want to make sure you have a smooth experience from
    start to finish.
  </p>

  <div style="margin:24px 0;text-align:center;">
    <a href="${APPLY_URL}"
       style="background:#111;color:white;padding:12px 28px;text-decoration:none;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;letter-spacing:0.5px;display:inline-block;">
      Reapply Now →
    </a>
  </div>

  <p>
    If you have any questions or need assistance completing your application, please do not hesitate
    to reach out directly. We are here to help.
  </p>

  <p>Again, I sincerely apologize for any inconvenience this may have caused.</p>

  <div style="margin-top:28px;border-top:1px solid #ccc;padding-top:14px;font-family:Arial,sans-serif;font-size:11px;color:#333;">
    <strong>Elizabeth Greene</strong><br>
    Founder &amp; Chief Executive Officer<br>
    Elevate for Humanity<br>
    <a href="https://www.elevateforhumanity.org" style="color:#111;">www.elevateforhumanity.org</a><br>
    elevate4humanityedu@gmail.com<br>
    Indianapolis, Indiana
  </div>

</body>
</html>`;

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to, name: firstName }] }],
      from: { email: FROM_EMAIL, name: FROM_NAME },
      reply_to: { email: 'elevate4humanityedu@gmail.com', name: 'Elizabeth Greene' },
      subject: 'Important: Please Reapply — HVAC Technician Program | Elevate for Humanity',
      content: [{ type: 'text/html', value: html }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`  ❌ SendGrid error for ${to}: ${err}`);
    return false;
  }
  return true;
}

async function main() {
  const db = await getAdminClient();

  // Pull all HVAC applicants — started or submitted
  const { data: applications, error } = await db
    .from('applications')
    .select('id, email, first_name, last_name, status, created_at, program')
    .or('program.ilike.%hvac%,program.ilike.%building-services%,program.ilike.%building_services%')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Failed to fetch applications:', error.message);
    process.exit(1);
  }

  // Also pull from program_enrollments for anyone who got further
  const { data: enrollments } = await db
    .from('program_enrollments')
    .select('id, user_id, program_slug, status, created_at, profiles(email, first_name, last_name)')
    .or('program_slug.ilike.%hvac%,program_slug.ilike.%building-services%')
    .order('created_at', { ascending: false });

  // Merge and deduplicate by email
  const seen = new Set<string>();
  const recipients: { email: string; firstName: string }[] = [];

  for (const app of applications || []) {
    if (!app.email || seen.has(app.email)) continue;
    seen.add(app.email);
    recipients.push({
      email: app.email,
      firstName: app.first_name || 'there',
    });
  }

  for (const enr of enrollments || []) {
    const profile = Array.isArray(enr.profiles) ? enr.profiles[0] : enr.profiles;
    if (!profile?.email || seen.has(profile.email)) continue;
    seen.add(profile.email);
    recipients.push({
      email: profile.email,
      firstName: profile.first_name || 'there',
    });
  }

  if (recipients.length === 0) {
    console.log('\n⚠️  No HVAC applicants found in database.\n');
    console.log('This likely means SUPABASE env vars are not set locally.');
    console.log('Run this script in production or with valid Supabase credentials.\n');
    process.exit(0);
  }

  console.log(`\n📧 Sending reapply emails to ${recipients.length} HVAC applicants\n`);

  let sent = 0, failed = 0;

  for (const r of recipients) {
    process.stdout.write(`  ${r.email} ... `);
    const ok = await sendEmail(r.email, r.firstName);
    console.log(ok ? '✅' : '❌');
    if (ok) sent++; else failed++;
    await new Promise(res => setTimeout(res, 400));
  }

  console.log(`\n─────────────────────────────────`);
  console.log(`✅ Sent:   ${sent}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`─────────────────────────────────\n`);

  if (failed > 0) process.exit(1);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
