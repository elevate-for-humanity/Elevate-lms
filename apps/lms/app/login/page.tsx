'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getRoleDestination } from '@/lib/auth/role-destinations';
import { validateRedirect } from '@/lib/auth/validate-redirect';
import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';
import { siteUrls } from '@/lib/utils/site-urls';
import { absoluteRoleDestination } from '@/lib/auth/absolute-role-destination';

export default function LoginPage() {
  const searchParams = useSafeSearchParams();
  const requestedRedirect = searchParams.get('next') || searchParams.get('redirect') || '';
  const safeRedirect = validateRedirect(requestedRedirect, '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, portal_type, onboarding_completed')
        .eq('id', data.user.id)
        .maybeSingle();

      let destination: string;
      if (!profile) {
        destination = `${siteUrls.app}/onboarding/learner`;
      } else if (profile.role === 'employer' && profile.onboarding_completed !== true) {
        destination = `${siteUrls.app}/onboarding/employer`;
      } else if (
        profile.role === 'student' &&
        typeof profile.portal_type === 'string' &&
        profile.portal_type.trim() !== ''
      ) {
        // Program portals are learner-specific. Never let a stale portal_type
        // override an admin, staff, instructor, employer, or partner role.
        destination = `${siteUrls.app}/portal/${profile.portal_type.trim()}`;
      } else {
        destination = absoluteRoleDestination(getRoleDestination(profile.role));
      }

      window.location.assign(destination);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Invalid email or password.';
      setError(message);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <section className="mx-auto w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Elevate for Humanity</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Student and Partner Login</h1>
          <p className="mt-3 text-sm text-slate-600">Access courses, progress, credentials, apprenticeship records, and portal tools.</p>
        </div>

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
          <Link href="/signup" className="font-semibold text-blue-700 hover:underline">Create one</Link>
        </p>

        <div className="mt-8 border-t border-slate-200 pt-6 text-center">
          <a href={siteUrls.adminLogin} className="text-sm font-semibold text-slate-800 hover:underline">Staff and administrator login →</a>
        </div>
      </section>
    </main>
  );
}
