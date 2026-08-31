// PUBLIC ROUTE: authenticate first, then authorize from the authenticated session.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getServerSupabaseEnvMisconfigurationReason } from '@/lib/supabase/server-env';
import { applyNormalizedSupabaseUrlToEnv } from '@/lib/supabase/normalize-url';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { ADMIN_ROLES, normalizeRoles } from '@/lib/rbac/role-matrix';

const ADMIN_PORTAL_LOGIN_ROLES = [
  ...ADMIN_ROLES,
  'instructor',
  'test_admin',
  'proctor',
] as string[];

function jsonError(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const configurationFailure =
    /NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY|SUPABASE_URL|SUPABASE_ANON_KEY|MISSING_ENV/i.test(
      message,
    );
  const transientFailure = /abort|timed?\s*out|fetch failed|network/i.test(message);

  console.error('[admin-login] unexpected authentication failure', {
    configurationFailure,
    message,
  });

  return NextResponse.json(
    {
      error: configurationFailure
        ? 'Admin authentication is temporarily unavailable because the server authentication configuration is incomplete.'
        : transientFailure
          ? 'The sign-in service took too long to respond. Please try again.'
          : 'Admin authentication failed unexpectedly. Please retry.',
    },
    {
      status: configurationFailure || transientFailure ? 503 : 500,
      headers: { 'Cache-Control': 'no-store, private' },
    },
  );
}

function json(body: Record<string, unknown>, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store, private' },
  });
}

export async function POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'auth');
    if (rateLimited) return rateLimited as NextResponse;

    const body = (await req.json().catch(() => null)) as
      | { email?: unknown; password?: unknown }
      | null;
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    // This also serves as the production route-contract probe: an anonymous
    // POST with an empty body must reach this handler and return JSON 400,
    // never a middleware redirect or Next.js HTML document.
    if (!email || !password) {
      return json({ error: 'Email and password required.' }, 400);
    }

    // Production already injects the public Supabase configuration. Avoid
    // blocking every interactive login on remote secret hydration; only use
    // hydration as a recovery path when the deployed public values are absent.
    applyNormalizedSupabaseUrlToEnv();
    let misconfigured = getServerSupabaseEnvMisconfigurationReason();

    if (misconfigured) {
      try {
        const { hydrateProcessEnv } = await import('@/lib/secrets');
        await hydrateProcessEnv();
        applyNormalizedSupabaseUrlToEnv();
        misconfigured = getServerSupabaseEnvMisconfigurationReason();
      } catch {
        // The configuration error below provides the actionable response.
      }
    }
    if (misconfigured) {
      console.error('[admin-login] Supabase public auth configuration invalid', { misconfigured });
      return json(
        {
          error:
            'Admin authentication is misconfigured on this server. Contact engineering to update the Supabase public auth configuration in Northflank.',
        },
        503,
      );
    }

    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData?.user) {
      const raw = authError?.message || 'Invalid email or password.';
      const invalidApiKey = /invalid api key/i.test(raw);
      const transientFailure = /abort|timed?\s*out|fetch failed|network/i.test(raw);
      return json(
        {
          error: invalidApiKey
            ? 'Admin authentication is misconfigured (invalid Supabase anon key on this deployment). Contact engineering.'
            : transientFailure
              ? 'The sign-in service took too long to respond. Please try again.'
              : raw,
        },
        invalidApiKey || transientFailure ? 503 : 401,
      );
    }

    // Do not depend on SUPABASE_SERVICE_ROLE_KEY for interactive sign-in.
    // The authenticated browser/server session must be able to read its own
    // profile; the rest of the platform's route guards use the same RLS path.
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profileError) {
      await supabase.auth.signOut();
      console.error('[admin-login] authenticated profile read failed', {
        userId: authData.user.id,
        code: profileError.code,
        message: profileError.message,
      });
      return json(
        { error: 'Your account authenticated, but its profile could not be verified. Please retry or contact support.' },
        503,
      );
    }

    if (!profile?.role) {
      await supabase.auth.signOut();
      return json({ error: 'No profile or role was found for your account. Contact support.' }, 403);
    }

    const { data: roleRows, error: rolesError } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', authData.user.id);

    const secondaryRoles = rolesError
      ? []
      : (roleRows ?? [])
          .map((row) => (row as { roles?: { name?: unknown } | null }).roles?.name)
          .filter((role): role is string => typeof role === 'string');

    const effectiveRoles = normalizeRoles([profile.role, ...secondaryRoles]);
    const primaryRoleAllowed = ADMIN_PORTAL_LOGIN_ROLES.includes(profile.role);
    const effectiveRoleAllowed = effectiveRoles.some((role) =>
      ADMIN_PORTAL_LOGIN_ROLES.includes(role),
    );

    // If the primary profile role already grants Admin access, a secondary-role
    // RLS failure must not block login. If access depends on a secondary role,
    // however, fail closed because that role could not be verified.
    if (rolesError && !primaryRoleAllowed) {
      await supabase.auth.signOut();
      console.error('[admin-login] secondary role verification failed', {
        userId: authData.user.id,
        code: rolesError.code,
        message: rolesError.message,
      });
      return json({ error: 'Unable to verify your Admin portal role. Please retry.' }, 503);
    }

    if (!primaryRoleAllowed && !effectiveRoleAllowed) {
      await supabase.auth.signOut();
      return json({ error: 'You do not have permission to access the admin portal.' }, 403);
    }

    return json({ ok: true, role: profile.role, effectiveRoles });
  } catch (error) {
    return jsonError(error);
  }
}
