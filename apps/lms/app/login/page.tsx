'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { validateRedirect } from '@/lib/auth/validate-redirect';
import { resolveRoleCompatiblePostLoginUrl } from '@/lib/auth/post-login-redirect';
import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';
import { siteUrls } from '@/lib/utils/site-urls';
import { resolveStudentHomePath } from '@/lib/portal/resolve-student-home';
import { resolveDashboardUrl } from '@/lib/routing/dashboard-resolver';

const APPRENTICE_ROLES = new Set([
  'student',
  'learner',
  'apprentice',
  'barber_apprentice',
  'cosmetology_apprentice',
]);

type SignInApiResponse = {
  success?: boolean;
  error?: string;
  message?: string;
  user?: { id?: string; email?: string };
};

async function serverSignIn(email: string, password: string): Promise<string> {
  const response = await fetch('/api/auth/signin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    cache: 'no-store',
    body: JSON.stringify({ email: email.trim(), password }),
  });

  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  if (!contentType.includes('application/json')) {
    const raw = await response.text();
    console.error('[login] sign-in endpoint returned non-JSON', {
      status: response.status,
      contentType,
      preview: raw.slice(0, 120),
    });
    throw new Error(`Authentication service returned an invalid response (HTTP ${response.status || 500}).`);
  }

  const body = (await response.json()) as SignInApiResponse;
  if (!response.ok || body.success !== true || !body.user?.id) {
    throw new Error(body.error || body.message || 'Invalid email or password.');
  }

  return body.user.id;
}

export default function LoginPage() {
  const searchParams = useSafeSearchParams();
  const requestedRedirect = searchParams.get('next') || searchParams.get('redirect') || '';
  const safeRedirect = validateRedirect(requestedRedirect, '');
  const reason = searchParams.get('reason');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // An idle-timeout redirect must actually clear the Supabase browser session
  // before the user signs in again.
  useEffect(() => {
    if (reason !== 'idle') return;
    const supabase = createClient();
    void supabase.auth.signOut();
  }, [reason]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hydrated) return;
    setLoading(true);
    setError('');

    try {
      // Sign in through the server route instead of directly from the browser.
      // lib/supabase/server.ts scopes Supabase auth cookies to
      // .elevateforhumanity.org, so a valid session survives role-based moves
      // between app, admin, and www subdomains. The API also applies the auth
      // rate limiter and request validation.
      const userId = await serverSignIn(email, password);
      const supabase = createClient();

      // Resolve the user's authoritative role before evaluating any requested
      // redirect. A historical login path could previously send students to
      // the Admin dashboard immediately after a successful login.
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, portal_type, onboarding_completed')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        throw new Error('Unable to load your profile. Please try again or contact support.');
      }

      if (!profile) {
        window.location.assign(`${siteUrls.app}/onboarding/learner`);
        return;
      }

      const { data: roleRows, error: rolesError } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', userId);

      if (rolesError) {
        throw new Error('Unable to verify your portal access. Please try again.');
      }

      const secondaryRoles = (roleRows ?? [])
        .map((row) => (row as { roles?: { name?: unknown } | null }).roles?.name)
        .filter((role): role is string => typeof role === 'string');
      const effectiveRoles = Array.from(
        new Set([profile.role, ...secondaryRoles].filter(Boolean)),
      ) as string[];

      let destination: string;
      let allowRequestedRedirect = true;

      if (profile.role === 'employer' && profile.onboarding_completed !== true) {
        destination = `${siteUrls.app}/onboarding/employer`;
        allowRequestedRedirect = false;
      } else if (effectiveRoles.some((role) => APPRENTICE_ROLES.has(role))) {
        // Resolve program context while keeping every apprenticeship on the
        // canonical /apprentice runtime. Do not let a stale redirect override it.
        destination = await resolveStudentHomePath(
          supabase,
          userId,
          typeof profile.portal_type === 'string' ? profile.portal_type : undefined,
        );
        allowRequestedRedirect = false;
      } else {
        // portal_type is retained as enrollment metadata, not as permission to
        // invent /portal/* routes. Role ownership determines the actual portal.
        destination = resolveDashboardUrl(profile.role, effectiveRoles);
      }

      if (safeRedirect && allowRequestedRedirect) {
        destination = resolveRoleCompatiblePostLoginUrl(
          safeRedirect,
          profile.role,
          effectiveRoles,
        );
      }

      window.location.assign(destination);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Invalid email or password.';
      setError(message);
      setLoading(false);
    }
  }

  const signupHref = safeRedirect
    ? `/signup?redirect=${encodeURIComponent(safeRedirect)}`
    : '/signup';

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <section className="mx-auto w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Elevate for Humanity</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Student and Partner Login</h1>
          <p className="mt-3 text-sm text-slate-600">Access courses, progress, credentials, apprenticeship records, and portal tools.</p>
        </div>

        {reason === 'idle' && !error ? (
          <div role="alert" className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Your session expired due to inactivity. Please sign in again.
          </div>
        ) : null}

        {error ? (
          <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5" aria-busy={!hydrated || loading}>
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-900">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              disabled={!hydrated || loading}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 disabled:cursor-wait disabled:bg-slate-100"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-900">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={!hydrated || loading}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 disabled:cursor-wait disabled:bg-slate-100"
            />
          </div>

          <div className="flex justify-end">
            <Link href="/reset-password" className="text-sm font-semibold text-blue-700 hover:underline">Forgot password?</Link>
          </div>

          <button
            type="submit"
            disabled={!hydrated || loading}
            className="w-full rounded-lg bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {!hydrated ? 'Loading sign in…' : loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Need an account?{' '}
          <Link href={signupHref} className="font-semibold text-blue-700 hover:underline">Create one</Link>
        </p>

        <div className="mt-8 border-t border-slate-200 pt-6 text-center">
          <a href={siteUrls.adminLogin} className="text-sm font-semibold text-slate-800 hover:underline">Staff and administrator login →</a>
        </div>
      </section>
    </main>
  );
}
