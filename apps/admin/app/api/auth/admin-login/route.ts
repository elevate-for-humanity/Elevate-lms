// RLS-safe admin login — uses service role key to read profiles and effective roles.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getServerSupabaseEnvMisconfigurationReason } from '@/lib/supabase/server-env';
import { applyNormalizedSupabaseUrlToEnv } from '@/lib/supabase/normalize-url';
import { ADMIN_ROLES } from '@/lib/rbac/role-matrix';

const ADMIN_PORTAL_LOGIN_ROLES = [
  ...ADMIN_ROLES,
  'instructor',
  'test_admin',
  'proctor',
] as string[];

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required.' }, { status: 400 });
  }

  try {
    const { hydrateProcessEnv } = await import('@/lib/secrets');
    await hydrateProcessEnv();
  } catch {
    // platform_secrets hydration unavailable — continue with injected env
  }
  applyNormalizedSupabaseUrlToEnv();

  const misconfigured = getServerSupabaseEnvMisconfigurationReason();
  if (misconfigured) {
    return NextResponse.json(
      {
        error:
          'Admin authentication is misconfigured on this server. Contact engineering to update Supabase keys in Northflank.',
        detail: misconfigured,
      },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (authError || !authData?.user) {
    const raw = authError?.message || 'Invalid email or password.';
    const invalidApiKey = /invalid api key/i.test(raw);
    return NextResponse.json(
      {
        error: invalidApiKey
          ? 'Admin authentication is misconfigured (invalid Supabase anon key on this deployment). Contact engineering.'
          : raw,
      },
      { status: invalidApiKey ? 503 : 401 },
    );
  }

  const db = await requireAdminClient();
  const { data: profile, error: profileError } = await db
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileError) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: `Profile load failed: ${profileError.message}. Contact support.` },
      { status: 500 },
    );
  }

  if (!profile) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: 'No profile found for your account. Contact support.' },
      { status: 403 },
    );
  }

  const { data: roleRows } = await db
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', authData.user.id);

  const secondaryRoles = (roleRows ?? [])
    .map((row) => (row as { roles?: { name?: unknown } | null }).roles?.name)
    .filter((role): role is string => typeof role === 'string');
  const effectiveRoles = Array.from(new Set([profile.role, ...secondaryRoles]));

  if (!effectiveRoles.some((role) => ADMIN_PORTAL_LOGIN_ROLES.includes(role))) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: 'You do not have permission to access the admin portal.' },
      { status: 403 },
    );
  }

  return NextResponse.json({ ok: true, role: profile.role, effectiveRoles });
}
