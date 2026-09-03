/**
 * Creates a super admin user account
 * Usage: ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=yourpass pnpm tsx scripts/create-super-admin.ts
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Missing ADMIN_EMAIL or ADMIN_PASSWORD environment variables.');
  console.error('Usage: ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=yourpass pnpm tsx scripts/create-super-admin.ts');
  process.exit(1);
}

async function main() {
  try {
    // Check if user already exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id, role, email')
      .eq('email', ADMIN_EMAIL)
      .maybeSingle();

    let userId: string;

    if (existing) {
      console.log(`\n✓ User already exists: ${existing.email}`);
      console.log(`  ID: ${existing.id}`);
      console.log(`  Current role: ${existing.role}`);
      
      userId = existing.id;

      // Update role to admin if not already
      if (existing.role !== 'admin') {
        const { error } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', userId);
        
        if (error) {
          console.error('Failed to update role:', error.message);
          process.exit(1);
        }
        console.log(`✓ Updated role to admin`);
      }
    } else {
      // Create auth user
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
      });

      if (authErr || !authData.user) {
        console.error('Failed to create auth user:', authErr?.message);
        process.exit(1);
      }

      userId = authData.user.id;
      console.log(`\n✓ Created auth user`);
      console.log(`  ID: ${userId}`);
      console.log(`  Email: ${ADMIN_EMAIL}`);

      // Create profile with admin role
      const { error: profileErr } = await supabase.from('profiles').upsert({
        id: userId,
        email: ADMIN_EMAIL,
        full_name: 'Platform Super Admin',
        role: 'admin',
      });

      if (profileErr) {
        console.error('Failed to create profile:', profileErr.message);
        process.exit(1);
      }

      console.log(`✓ Created profile with admin role`);
    }

    // Verify the account
    const { data: verified } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('id', userId)
      .single();

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✓ SUPER ADMIN ACCOUNT READY`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`\nEmail:    ${verified?.email}`);
    console.log(`Password: (provided via env var)`);
    console.log(`Role:     ${verified?.role}`);
    console.log(`\nLogin at: https://www.elevateforhumanity.org/login`);
    console.log(`Dashboard: https://www.elevateforhumanity.org/admin/dashboard\n`);

  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

main();
