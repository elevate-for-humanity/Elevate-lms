
'use client';

import React from 'react';

import { useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { validateRedirect } from '@/lib/auth/validate-redirect';
import { getRoleDestination } from '@/lib/auth/role-destinations';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  // Support both 'next' and 'redirect' params for backward compatibility
  const rawNext = searchParams.get('next') || searchParams.get('redirect') || '';
  const next = validateRedirect(rawNext, '');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      
      const { data, error }: any = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) throw error;

      if (!data?.user) throw new Error('Login succeeded but no user returned');

      // Fetch profile — role + onboarding + enrollment status drive routing
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, onboarding_completed, enrollment_status')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch failed:', profileError.message);
        setError('Unable to load your profile. Please try again or contact support.');
        setLoading(false);
        return;
      }

      if (!profile) {
        // Profile row missing — send to onboarding to create one
        router.push('/onboarding/learner');
        return;
      }

      // Explicit redirect param takes priority
      if (next) {
        router.push(next);
        return;
      }

      const role = profile.role;
      const onboardingDone = profile.onboarding_completed === true;

      // Employer: gate on onboarding before dashboard. All other roles:
      // canonical destination from lib/auth/role-destinations.ts.
      if (role === 'employer' && !onboardingDone) {
        router.push('/onboarding/employer');
      } else {
        router.push(getRoleDestination(role));
      }
    } catch (err: any) {
      // Supabase error objects have non-enumerable properties — extract explicitly
      const msg = err?.message || err?.error_description || err?.msg || 'Invalid email or password';
      console.error('Login error:', msg, err?.status ?? '');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner */}
      <section className="relative h-[200px] w-full overflow-hidden">
        <Image
          src="/images/pages/login-page-1.jpg"
          alt="Elevate for Humanity login"
          fill
          className="object-cover"
          priority
          quality={100}
          sizes="100vw"
        />
      </section>

      {/* Login Form */}
      <section className="py-12 relative z-10">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-center mb-2">Login</h1>
            <p className="text-center text-black mb-8">
              Sign in to manage your training, certifications, and career progress.
            </p>

            {error && (
              <div className="mb-6 p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg text-brand-red-800 text-sm" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-black mb-2"
                >
                  Email Address
                </label>
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
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-black mb-2"
                >
                  Password
                </label>
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

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-black">Remember me</span>
                </label>
                <Link
                  href="/reset-password"
                  className="text-brand-blue-600 hover:text-brand-blue-700"
                >
                  Forgot password?
                </Link>
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
              Don't have an account?{' '}
              <Link
                href={`/signup${next ? `?redirect=${encodeURIComponent(next)}` : ''}`}
                className="text-brand-blue-600 font-semibold hover:text-brand-blue-700"
              >
                Sign up
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-center text-sm text-black mb-4">
                Quick Access:
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Student Portal',     href: '/learner/dashboard' },
                  { label: 'Admin Portal',        href: '/admin/dashboard' },
                  { label: 'Program Holder',      href: '/program-holder/dashboard' },
                  { label: 'Instructor',          href: '/instructor/dashboard' },
                  { label: 'Employer',            href: '/employer/dashboard' },
                  { label: 'Partner Portal',      href: '/partner-portal' },
                  { label: 'Staff Portal',        href: '/staff-portal/dashboard' },
                  { label: 'Mentor',              href: '/mentor/dashboard' },
                  { label: 'Case Manager',        href: '/case-manager/dashboard' },
                  { label: 'Workforce Board',     href: '/workforce-board/dashboard' },
                  { label: 'Provider Admin',      href: '/provider/dashboard' },
                  { label: 'Creator',             href: '/creator/dashboard' },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    className="text-center px-4 py-3 bg-white text-black rounded-lg hover:bg-slate-200 transition-all text-sm font-semibold min-h-[44px] inline-flex items-center justify-center"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-black">
            <p>
              Need help? Call{' '}
              <a
                href="/support"
                className="text-brand-blue-600 font-semibold"
              >
                support center
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
