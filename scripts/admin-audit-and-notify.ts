import { createClient } from '@supabase/supabase-js';
import * as https from 'https';
import { config } from 'dotenv';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
config({ path: '.env.local' });

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const SG_KEY       = process.env.SENDGRID_API_KEY!;
const SITE_URL     = 'https://www.elevateforhumanity.org';
const CALLBACK_URL = `${SITE_URL}/auth/callback`;
const FROM_EMAIL   = 'noreply@elevateforhumanity.org';
const FROM_NAME    = 'Elevate for Humanity';

// ── 1. Audit: find all elevated roles ────────────────────────────────────────
const { data: elevated } = await db
  .from('profiles')
  .select('id,email,full_name,role')
  .in('role', ['admin', 'staff']);

console.log('\nCurrent elevated accounts:');
for (const p of elevated || []) {
  console.log(`  ${p.role.padEnd(14)} ${p.email}  (${p.full_name})`);
}

// ── 2. Only keep elizabthpowell6262@gmail.com as admin
//       Downgrade everyone else who is admin/admin (not staff) ──────────
const KEEP_SUPER = 'elizabthpowell6262@gmail.com';
const ELEVATE_ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';

// Demote any other admin or admin to 'partner' unless it's the Elevate system account
const toDowngrade = (elevated || []).filter(p =>
  ['admin'].includes(p.role) &&
  p.email !== KEEP_SUPER &&
  p.email !== ELEVATE_ADMIN_EMAIL  // keep system admin operational
);

if (toDowngrade.length) {
  console.log('\nDowngrading:');
  for (const p of toDowngrade) {
    const { error } = await db.from('profiles').update({ role: 'partner' }).eq('id', p.id);
    console.log(`  ${error ? 'FAIL' : 'OK  '} ${p.email}  ${p.role} → partner`);
  }
} else {
  console.log('\nNo unauthorized admins found.');
}

// ── 3. Mark Elizabeth's onboarding complete ───────────────────────────────────
await db.from('profiles').update({
  onboarding_completed: true,
  onboarding_completed_at: new Date().toISOString(),
}).eq('email', KEEP_SUPER);
console.log('\nOnboarding marked complete for', KEEP_SUPER);

// ── 4. Send Elizabeth her reset email ────────────────────────────────────────
const { data: linkData, error: linkErr } = await db.auth.admin.generateLink({
  type: 'recovery',
  email: KEEP_SUPER,
  options: { redirectTo: CALLBACK_URL },
});

const resetLink = (linkData as any)?.properties?.action_link || `${SITE_URL}/auth/forgot-password`;
if (linkErr) console.error('generateLink error:', linkErr.message);

const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b">
  <img src="${SITE_URL}/images/Elevate_for_Humanity_logo_81bf0fab.jpg" alt="Elevate for Humanity" style="height:60px;margin-bottom:24px"/>
  <h2 style="color:#dc2626">Your Super Admin Access — Elevate for Humanity</h2>
  <p>Dear Elizabeth,</p>
  <p>Your account has been configured as the <strong>Super Administrator</strong> for the Elevate for Humanity platform. Use the button below to set your password and log in.</p>
  <div style="text-align:center;margin:32px 0">
    <a href="${resetLink}" style="background:#dc2626;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px">Set My Password &amp; Log In</a>
  </div>
  <p><strong>This link expires in 24 hours.</strong> If it expires, visit <a href="${SITE_URL}/auth/forgot-password" style="color:#dc2626">${SITE_URL}/auth/forgot-password</a>.</p>
  <h3 style="color:#1e293b;margin-top:32px">Your admin dashboard:</h3>
  <p><a href="/admin/dashboard" style="color:#dc2626">/admin/dashboard</a></p>
  <p>As Super Admin you have full access to all users, programs, enrollments, and platform settings.</p>
  <p style="margin-top:32px">Warm regards,<br/><strong>Elevate for Humanity Platform Team</strong></p>
</div>`;

const body = JSON.stringify({
  personalizations: [{ to: [{ email: KEEP_SUPER, name: 'Elizabeth Greene' }] }],
  from: { email: FROM_EMAIL, name: FROM_NAME },
  reply_to: { email: 'elevate4humanityedu@gmail.com', name: FROM_NAME },
  subject: 'Your Super Admin Access — ' + PLATFORM_DEFAULTS.orgName + '',
  content: [{ type: 'text/html', value: html }],
});

await new Promise<void>((resolve) => {
  const req = https.request({
    hostname: 'api.sendgrid.com',
    path: '/v3/mail/send',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SG_KEY}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  }, res => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      console.log(`\nEmail to ${KEEP_SUPER}: ${res.statusCode === 202 ? 'SENT ✓' : 'FAIL ' + res.statusCode}`);
      resolve();
    });
  });
  req.on('error', e => { console.error('Email error:', e.message); resolve(); });
  req.write(body); req.end();
});

// ── 5. Final state ────────────────────────────────────────────────────────────
const { data: final } = await db
  .from('profiles')
  .select('role,email,full_name')
  .in('role', ['admin'])
  .order('role');

console.log('\nFinal admin accounts:');
for (const p of final || []) {
  console.log(`  ${p.role.padEnd(14)} ${p.email}  (${p.full_name})`);
}
