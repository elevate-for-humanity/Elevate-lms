import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError } from '@/lib/api/safe-error';
import { withErrorHandling, APIErrors } from '@/lib/api';
import { APIError } from '@/lib/api/api-error';
import { ErrorCode } from '@/lib/api/error-codes';
import { validatePassword } from '@/lib/auth/password-validation';
import { verify2FAToken, verifyBackupCode } from '@/lib/auth/two-factor';
import { resolvePortalForUser } from '@/lib/portal/router';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { validateRedirect } from '@/lib/auth/validate-redirect';
import { getRoleDestinationUrl } from '@/lib/auth/role-destinations';
import { logger } from '@/lib/logger';

const ADMIN_ROLES = ['admin', 'super_admin', 'org_admin', 'staff'];

export async function handleOAuthCallback(request: Request, fallbackPath: string) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = validateRedirect(requestUrl.searchParams.get('next'), fallbackPath);

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_oauth_code', requestUrl.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL('/login?error=oauth_failed', requestUrl.origin));
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}

export async function getAuthLanding(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ redirectTo: '/login' });

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (error || !profile?.role) {
      logger.error('Auth landing profile lookup failed', error);
      return NextResponse.json({ redirectTo: '/login' });
    }

    return NextResponse.json({ redirectTo: getRoleDestinationUrl(profile.role) });
  } catch (error) {
    logger.error('Auth landing failed', error as Error);
    return NextResponse.json({ error: 'Authentication error' }, { status: 500 });
  }
}

export async function getTwoFactorStatus(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'auth');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return safeError('Not authenticated', 401);

  const { data } = await supabase
    .from('two_factor_auth')
    .select('enabled')
    .eq('user_id', user.id)
    .maybeSingle();

  return NextResponse.json({ enabled: data?.enabled === true });
}

export async function verifyTwoFactor(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'auth');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return safeError('Not authenticated', 401);

  const { token, isBackupCode } = await request.json().catch(() => ({}));
  if (!token || typeof token !== 'string') return safeError('Token required', 400);

  const valid = isBackupCode
    ? await verifyBackupCode(user.id, token.trim())
    : await verify2FAToken(user.id, token.trim());

  if (!valid) return safeError('Invalid or expired code', 401);
  return NextResponse.json({ ok: true });
}

async function checkRole(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const requiredRole = request.nextUrl.searchParams.get('role');

  if (!requiredRole) {
    return NextResponse.json({ error: 'Role parameter required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ hasRole: false, authenticated: false }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const allowedRoles = [requiredRole, 'admin', 'super_admin'];
  const hasRole = Boolean(profile && allowedRoles.includes(profile.role));

  return NextResponse.json({
    hasRole,
    authenticated: true,
    role: profile?.role,
  });
}

export const getCheckRole = withApiAudit('/api/auth/check-role', checkRole);

export async function resolvePortal(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'auth');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ path: '/login' }, { status: 401 });
  }

  const path = await resolvePortalForUser(supabase, user.id);
  return NextResponse.json({ path });
}

export async function getSession(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ user: null });

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
    },
  });
}

const signup = withErrorHandling(async (request: NextRequest) => {
  const rateLimited = await applyRateLimit(request, 'auth');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const body = await request.json();
  const { email, password, firstName, lastName } = body;

  if (!email || !password) {
    throw APIErrors.validation('email and password', 'Email and password are required');
  }

  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) {
    throw new APIError(
      ErrorCode.VAL_OUT_OF_RANGE,
      400,
      passwordCheck.errors[0] || 'Password does not meet requirements',
      { errors: passwordCheck.errors },
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw APIErrors.validation('email', 'Invalid email format');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    },
  });

  if (error) {
    if (error.message.includes('already registered')) {
      throw APIErrors.conflict('Email already registered');
    }
    throw APIErrors.external('Supabase Auth');
  }

  if (!data.user) throw APIErrors.internal('Failed to create user');

  if (!data.user.email_confirmed_at) {
    const adminClient = await requireAdminClient();
    await adminClient.auth.admin.updateUserById(data.user.id, { email_confirm: true });
  }

  return NextResponse.json({
    success: true,
    user: {
      id: data.user.id,
      email: data.user.email,
      emailConfirmed: true,
    },
    message: 'Account created successfully',
  });
});

export const postSignup = withApiAudit('/api/auth/signup', signup);

export async function verifyAdminRole(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'auth');
  if (rateLimited) return rateLimited;

  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || !ADMIN_ROLES.includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ ok: true, role: profile.role });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
