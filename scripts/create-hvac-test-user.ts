import { getAdminClient } from '@/lib/supabase/admin';

const TEST_EMAIL = process.env.HVAC_TEST_EMAIL || 'hvac.test@elevateforhumanity.org';
const TEST_PASSWORD = process.env.HVAC_TEST_PASSWORD;

if (!TEST_PASSWORD) {
  console.error('HVAC_TEST_PASSWORD env var is required');
  process.exit(1);
}

async function main() {
  const supabase = await getAdminClient();

  // Clean up existing test user
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', TEST_EMAIL)
    .maybeSingle();

  if (existing?.id) {
    await supabase.auth.admin.deleteUser(existing.id);
    console.log('Deleted existing test user');
  }

  // Create fresh test user
  const { data, error } = await supabase.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: {
      first_name: 'Test',
      last_name: 'Applicant',
      full_name: 'Test Applicant',
    },
  });

  if (error) {
    console.error('❌ Create user error:', error.message);
    process.exit(1);
  }

  console.log('\n✅ Test user created');
  console.log('   ID:       ', data.user.id);
  console.log(`   Email:    ${TEST_EMAIL}`);
  console.log('   Password: (provided via env var)');
  console.log('   Login at: /login\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
