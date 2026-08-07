'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';
import Link from 'next/link';
import Image from 'next/image';
import { validateRedirect } from '@/lib/auth/validate-redirect';
import { getRoleDestination } from '@/lib/auth/role-destinations';
import { absoluteRoleDestination } from '@/lib/auth/absolute-role-destination';
import { siteUrls } from '@/lib/utils/site-urls';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const searchParams = useSafeSearchParams();
  const rawNext = searchParams.get('next') || searchParams.get('redirect') || '';
  const next = validateRedirect(rawNext, '');
  const reason = searchParams.get('reason');

  useEffect(() => {
    if (reason === 'idle') {
      const supabase = createClient();
      supabase.auth.signOut().catch(() => {});
    }
  }, [reason]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data, error }: any = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;
      if (!data?.user) throw new Error('Login succeeded but no user returned');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, onboarding_completed')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) {
        setError('Unable to load your profile. Please try again or contact support.');
        setLoading(false);
        return;
      }

      if (!profile) {
        window.location.assign(`${siteUrls.app}/onboarding/learner`);
        return;
      }

      if (next) {
        window.location.assign(absoluteRoleDestination(next));
        return;
      }

      const role = profile.role;
      const onboardingDone = profile.onboarding_completed === true;

      if (role === 'employer' && !onboardingDone) {
        window.location.assign(`${siteUrls.app}/onboarding/employer`);
      } else {
        window.location.assign(absoluteRoleDestination(getRoleDestination(role)));
      }
    } catch (err: any) {
      const msg = err?.message || err?.error_description || err?.msg || 'Invalid email or password';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <section className="relative h-[200px] w-full overflow-hidden">
        <Image
          src="/images/pages/login-page-1.webp"
          alt="Elevate for Humanity login"
          fill
          className="object-cover"
          priority
          quality={90}
          sizes="100vw"
        />
      </section>

      <section className="py-12 relative z-10">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-center mb-2">Login</h1>
            <p className="text-center text-black mb-8">
              Sign in to manage your training, certifications, and career progress.
            </p>

            {reason === 'idle' && !error && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm" role="alert">
                Your session expired due to inactivity. Please sign in again.
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg text-brand-red-800 text-sm" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-black mb-2">Email Address</label>
                <input
                  type="email"
                  id="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-black mb-2">Password</label>
                <input
                  type="password"
                  id="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center justify-end text-sm">
                <Link href="/reset-password" className="text-brand-blue-600 hover:text-brand-blue-700">Forgot password?</Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-8 py-4 bg-brand-blue-600 text-white font-bold rounded-lg hover:bg-brand-blue-700 transition-all disabled:bg-slate-400 disabled:cursor-not-allowed text-lg cursor-pointer"
              >
                {loading ? 'Logging in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-black">
              Don&apos;t have an account?{' '}
              <Link
                href={`/signup${next ? `?redirect=${encodeURIComponent(next)}` : ''}`}
                className="text-brand-blue-600 font-semibold hover:text-brand-blue-700"
              >
                Sign up
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-center text-sm text-black mb-4">Quick Access:</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Student Portal', dest: '/learner/dashboard' },
                  { label: 'Program Holder', dest: '/program-holder/dashboard' },
                  { label: 'Instructor', dest: '/admin/instructor/dashboard' },
                  { label: 'Employer', dest: '/employer/dashboard' },
                  { label: 'Partner Portal', dest: '/partner/dashboard' },
                  { label: 'Staff Portal', dest: '/admin/staff-portal/dashboard' },
                  { label: 'Mentor', dest: '/mentor/dashboard' },
                  { label: 'Case Manager', dest: '/case-manager/dashboard' },
                  { label: 'Workforce Board', dest: '/workforce-board/dashboard' },
                  { label: 'Provider Admin', dest: '/provider/dashboard' },
                  { label: 'Creator', dest: '/creator/products' },
                ].map((item) => (
                  <Link
                    key={item.dest}
                    href={`/login?redirect=${encodeURIComponent(item.dest)}`}
                    prefetch={false}
                    className="text-center px-4 py-3 bg-white text-black rounded-lg hover:bg-slate-200 transition-all text-sm font-semibold min-h-[44px] inline-flex items-center justify-center"
                  >
                    {item.label}
                  </Link>
                ))}
                <a
                  href={siteUrls.adminLogin}
                  className="text-center px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition-all text-sm font-semibold min-h-[44px] inline-flex items-center justify-center col-span-2"
                >
                  Admin Portal →
                </a>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-black">
            <p>
              Need help?{' '}
              <a href={`tel:${siteUrls.org.phone.replace(/[^+\d]/g, '')}`} className="text-brand-blue-600 font-semibold">
                {siteUrls.org.phone}
              </a>{' '}
              or{' '}
              <Link href="/support" className="text-brand-blue-600 font-semibold">support center</Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function LoginPage() {
  return <LoginForm />;
}
