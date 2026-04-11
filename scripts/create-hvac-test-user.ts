import { getAdminClient } from '@/lib/supabase/admin';

async function main() {
  const supabase = await getAdminClient();

  // Clean up existing test user
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', 'hvac.test@elevateforhumanity.org')
    .maybeSingle();

  if (existing?.id) {
    await supabase.auth.admin.deleteUser(existing.id);
    console.log('Deleted existing test user');
  }

  // Create fresh test user
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'hvac.test@elevateforhumanity.org',
    password: 'TestUser2026!',
    email_confirm: true,
    user_metadata: {
      first_name: 'Test',
      last_name: 'Applicant',
      full_name: 'Test Applicant',
    },
  });

  if (error) { console.error('❌ Create user error:', error.message); process.exit(1); }

  console.log('\n✅ Test user created');
  console.log('   ID:       ', data.user.id);
  console.log('   Email:    hvac.test@elevateforhumanity.org');
  console.log('   Password: TestUser2026!');
  console.log('   Login at: /login\n');
}

main().catch(e => { console.error(e); process.exit(1); });
