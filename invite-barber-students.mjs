import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const userIds = [
  '2d761d18-6ff9-4355-b9dd-5ff55903906b',
  '70483e3b-30f1-4c58-8046-d068ab7356ee',
  'b35f3289-614b-4c6e-b029-73617fc46655',
];

const REDIRECT_URL = 'https://www.elevateforhumanity.org/learner/dashboard';

for (const uid of userIds) {
  const { data: u, error } = await supabase.auth.admin.getUserById(uid);
  if (error) {
    console.info(`${uid} — ERROR: ${error.message}`);
    continue;
  }

  const email = u.user?.email;
  const name = u.user?.user_metadata?.full_name || u.user?.user_metadata?.name || '(no name)';
  const confirmed = !!u.user?.email_confirmed_at;
  console.info(`\nUser: ${email} | name: ${name} | email_confirmed: ${confirmed}`);

  // Send magic link (invite / sign-in link) so they can access the dashboard
  const { data: link, error: linkErr } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: REDIRECT_URL },
  });

  if (linkErr) {
    console.info(`  Magic link error: ${linkErr.message}`);
  } else {
    console.info(`  Magic link generated: ${link?.properties?.action_link}`);
  }
}
