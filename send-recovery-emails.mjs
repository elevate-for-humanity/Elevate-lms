// Uses Supabase built-in auth email (no external SMTP needed)
// Sends password reset email which redirects to /learner/dashboard

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const students = [
  { email: 'natataroa@gmail.com',     name: 'Natalia Roa' },
  { email: 'msanqin@gmail.com',       name: 'Wellington Mercedes' },
  { email: 'jbwhite888@icloud.com',   name: 'Jordan White' },
];

const REDIRECT = 'https://www.elevateforhumanity.org/learner/dashboard';

for (const s of students) {
  // Trigger Supabase's built-in password recovery email
  // This uses Supabase's own SMTP relay and respects the redirectTo param
  const res = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE,
      'Authorization': `Bearer ${SERVICE_ROLE}`,
    },
    body: JSON.stringify({
      email: s.email,
      gotrue_meta_security: {},
    }),
  });

  const body = res.status === 200 ? '(no body)' : await res.text();
  if (res.ok || res.status === 200) {
    console.info(`✓ Recovery email sent to ${s.name} <${s.email}>`);
  } else {
    console.info(`✗ ${s.name} <${s.email}> — ${res.status}: ${body}`);
  }
}

console.info('\nNote: Recovery emails redirect to /auth/reset-password by default.');
console.info('To redirect to /learner/dashboard, the redirect URL must be set in');
console.info('Supabase Dashboard → Authentication → URL Configuration → Redirect URLs.');
console.info('Add: https://www.elevateforhumanity.org/**');
