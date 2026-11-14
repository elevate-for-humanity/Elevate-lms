import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM = 'noreply@elevateforhumanity.org';
const FROM_NAME = 'Elevate for Humanity';
const REDIRECT_URL = 'https://www.elevateforhumanity.org/learner/dashboard';

const students = [
  { uid: '2d761d18-6ff9-4355-b9dd-5ff55903906b' },
  { uid: '70483e3b-30f1-4c58-8046-d068ab7356ee' },
  { uid: 'b35f3289-614b-4c6e-b029-73617fc46655' },
];

for (const s of students) {
  // Get user details
  const { data: u } = await supabase.auth.admin.getUserById(s.uid);
  const email = u.user?.email;
  const name = u.user?.user_metadata?.full_name || u.user?.user_metadata?.name || 'Apprentice';
  const firstName = name.split(' ')[0];

  // Generate fresh magic link
  const { data: link, error: linkErr } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: REDIRECT_URL },
  });

  if (linkErr) {
    console.error(`Failed to generate link for ${email}: ${linkErr.message}`);
    continue;
  }

  const magicLink = link?.properties?.action_link;

  // Send via SendGrid
  const body = {
    personalizations: [{ to: [{ email }] }],
    from: { email: FROM, name: FROM_NAME },
    reply_to: { email: 'info@elevateforhumanity.org' },
    subject: 'Your Elevate Apprenticeship Portal — Sign In',
    content: [{
      type: 'text/html',
      value: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#fff;">
  <img src="https://www.elevateforhumanity.org/images/Elevate_for_Humanity_logo_81bf0fab.jpg" alt="Elevate for Humanity" style="height:60px;margin-bottom:24px;" />
  <h2 style="color:#1e293b;margin-bottom:8px;">Hi ${firstName},</h2>
  <p style="color:#475569;font-size:15px;line-height:1.6;">
    Your Elevate Barber Apprenticeship portal is ready. Use the button below to sign in and access your dashboard, timeclock, hours log, and competency tracker.
  </p>
  <div style="margin:32px 0;">
    <a href="${magicLink}" style="background:#dc2626;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;font-size:16px;display:inline-block;">
      Sign In to Your Dashboard
    </a>
  </div>
  <p style="color:#94a3b8;font-size:13px;">
    This link expires in 1 hour. If you didn't request this email, you can safely ignore it.
  </p>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
  <p style="color:#94a3b8;font-size:12px;">
    Elevate for Humanity · Indianapolis, IN · <a href="https://www.elevateforhumanity.org" style="color:#94a3b8;">elevateforhumanity.org</a>
  </p>
</div>`,
    }],
  };

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (res.status === 202) {
    console.info(`✓ Sent to ${email} (${name})`);
  } else {
    const result = await res.json().catch(() => ({}));
    console.error(`✗ Failed for ${email}: ${JSON.stringify(result)}`);
  }
}
