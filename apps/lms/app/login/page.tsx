'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { validateRedirect } from '@/lib/auth/validate-redirect';
import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';
import { siteUrls } from '@/lib/utils/site-urls';
import { absoluteRoleDestination } from '@/lib/auth/absolute-role-destination';
import { resolveStudentHomePath } from '@/lib/portal/resolve-student-home';
import { resolveDashboardUrl } from '@/lib/routing/dashboard-resolver';

export default function LoginPage() {
  const searchParams = useSafeSearchParams();
  const requestedRedirect = searchParams.get('next') || searchParams.get('redirect') || '';
  const safeRedirect = validateRedirect(requestedRedirect, '');
  const reason = searchParams.get('reason');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Restore the May behavior: an idle-timeout redirect must actually clear the
  // Supabase browser session before the user signs in again.
  useEffect(() => {
    if (reason !== 'idle') return;
    const supabase = createClient();
    void supabase.auth.signOut();
  }, [reason]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) throw signInError;
      if (!data.user) throw new Error('Authentication completed without a user session.');

      if (safeRedirect) {
        window.location.assign(absoluteRoleDestination(safeRedirect));
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, portal_type, onboarding_completed')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) {
        throw new Error('Unable to load your profile. Please try again or contact support.');
      }

      if (!profile) {
        window.location.assign(`${siteUrls.app}/onboarding/learner`);
        return;
      }

      const { data: roleRows } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', data.user.id);

      const secondaryRoles = (roleRows ?? [])
        .map((row) => (row as { roles?: { name?: unknown } | null }).roles?.name)
        .filter((role): role is string => typeof role === 'string');
      const effectiveRoles = Array.from(new Set([profile.role, ...secondaryRoles].filter(Boolean))) as string[];

      let destination: string;

      if (profile.role === 'employer' && profile.onboarding_completed !== true) {
        destination = `${siteUrls.app}/onboarding/employer`;
      } else if (effectiveRoles.some((role) => ['apprentice', 'barber_apprentice', 'cosmetology_apprentice'].includes(role))) {
        // Resolve the apprentice's actual occupation/program portal. Never hard-code barber.
        destination = await resolveStudentHomePath(
          supabase,
          data.user.id,
          typeof profile.portal_type === 'string' ? profile.portal_type : undefined,
        );
      } else if (
        profile.role === 'student' &&
        typeof profile.portal_type === 'string' &&
        profile.portal_type.trim() !== ''
      ) {
        destination = `${siteUrls.app}/portal/${profile.portal_type.trim()}`;
      } else {
        destination = resolveDashboardUrl(profile.role, effectiveRoles);
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-900">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-900">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div className="flex justify-end">
            <Link href="/reset-password" className="text-sm font-semibold text-blue-700 hover:underline">Forgot password?</Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? 'Signing in…' : 'Sign in'}
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
