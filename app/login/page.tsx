'use client';

// Static shell — no server data needed. Served from CDN, no cold start.

import React from 'react';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';
import Link from 'next/link';
import Image from 'next/image';
import { readRedirectParam, validateRedirect } from '@/lib/auth/validate-redirect';
import { getRoleDestination } from '@/lib/auth/role-destinations';
import { resolvePortalForUser } from '@/lib/portal/router';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { hydrateBrowserSupabaseConfig } from '@/lib/supabase/public-config';
import { mapAuthError } from '@/lib/auth/map-auth-error';


const ADMIN_LOGIN_ROLES = new Set(['admin', 'staff', 'org_admin', 'admin']);
const ADMIN_ORIGIN = (process.env.NEXT_PUBLIC_ADMIN_URL || '').replace(/\/$/, '');

function normalizePostLoginRedirect(target: string, role: string | null | undefined): string | null {
  if (!target) return null;
  const isAdminRole = ADMIN_LOGIN_ROLES.has(String(role ?? ''));

  try {
    if (target.startsWith('https://')) {
      const url = new URL(target);
      const isAdminHost = url.hostname === '';
      if (isAdminHost) return isAdminRole ? url.toString() : null;
      return target;
    }

    if (target.startsWith('/admin')) {
      return isAdminRole ? `${ADMIN_ORIGIN}${target}` : null;
    }
  } catch {
    return null;
  }

  return target;
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [linkEmail, setLinkEmail] = useState('');
  const [linkSending, setLinkSending] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [showLinkForm, setShowLinkForm] = useState(false);
  // 2FA challenge state
  const [show2FA, setShow2FA] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAError, setTwoFAError] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  // Destination stored while 2FA challenge is shown
  const pendingDestRef = React.useRef<string>('');
  const router = useRouter();
  const searchParams = useSafeSearchParams();
  // Support both 'next' and 'redirect' params for backward compatibility
  const rawNext = readRedirectParam(searchParams) || '';
  const next = validateRedirect(rawNext, '');
  const reason = searchParams.get('reason');

  // The middleware cannot write session cookies, so it cannot call signOut().
  // When it detects an idle timeout it redirects here with ?reason=idle.
  // We complete the signOut client-side where the cookie write actually works.
  useEffect(() => {
    if (reason === 'idle') {
      const supabase = createClient();
      supabase.auth.signOut().catch(() => {});
    }
    // Check if already logged in and redirect away
    async function checkSession() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        const role = profile?.role || 'student';
        if (role === 'student') {
          window.location.href = '/learner/dashboard';
        } else {
          window.location.href = getRoleDestination(role);
        }
      }
    }
    checkSession();
  }, [reason]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Check if already logged in - redirect to dashboard
      const supabase = createClient();
      const { data: { user: existingUser } } = await supabase.auth.getUser();
      if (existingUser) {
        // Already logged in - fetch profile and redirect
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, onboarding_completed, portal_type')
          .eq('id', existingUser.id)
          .maybeSingle();
        
        const role = profile?.role || 'student';
        if (role === 'student') {
          window.location.href = await resolvePortalForUser(supabase, existingUser.id);
        } else {
          window.location.href = getRoleDestination(role);
        }
        return;
      }

      const hydrated = await hydrateBrowserSupabaseConfig();
      if (!hydrated) {
        setError(mapAuthError('site configuration'));
        setLoading(false);
        return;
      }

      const { data, error }: any = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password, // never trim passwords — leading/trailing spaces are valid
      });

      if (error) throw error;

      if (!data?.user) throw new Error('Login succeeded but no user returned');

      // Fetch profile — role + portal_type + onboarding status drive routing
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, onboarding_completed, enrollment_status, portal_type')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) {
        // profile fetch failed — non-fatal, user still authenticated
        // Default to student role and continue with login flow
        const dest = getRoleDestination('student');
        window.location.href = dest;
        return;
      }

      if (!profile) {
        // Profile row missing — send to onboarding to create one
        window.location.href = '/onboarding/learner';
        return;
      }

      const role = profile.role;

      // Explicit redirect param takes priority only after role-aware admin-domain normalization.
      // This prevents www /login?redirect=/admin/dashboard from trapping admins on the wrong host
      // and prevents non-admin users from being sent into an admin unauthorized loop.
      const resolvedRedirect = normalizePostLoginRedirect(next, role);
      if (resolvedRedirect) {
        window.location.href = resolvedRedirect;
        return;
      }


      const onboardingDone = profile.onboarding_completed === true;

      // Employer: gate on onboarding before dashboard.
      if (role === 'employer' && !onboardingDone) {
        window.location.href = '/onboarding/employer';
        return;
      }

      // Students: slug-aware portal (barber, cosmetology, …) then category fallback.
      if (role === 'student') {
        const studentDest = await resolvePortalForUser(supabase, data.user.id);
        const twoFARes2 = await fetch('/api/auth/2fa/status');
        if (twoFARes2.ok) {
          const { enabled } = await twoFARes2.json();
          if (enabled) {
            pendingDestRef.current = studentDest;
            setShow2FA(true);
            setLoading(false);
            return;
          }
        }
        window.location.href = studentDest;
        return;
      }

      // All other roles: canonical destination from lib/auth/role-destinations.ts.
      const dest = getRoleDestination(role);

      // Check 2FA before navigating — if enabled, show challenge screen
      const twoFARes = await fetch('/api/auth/2fa/status');
      if (twoFARes.ok) {
        const { enabled } = await twoFARes.json();
        if (enabled) {
          pendingDestRef.current = dest;
          setShow2FA(true);
          setLoading(false);
          return;
        }
      }

      // Hard navigation ensures the session cookie is committed before the
      // middleware reads it — router.push() is a soft nav that races the cookie.
      window.location.href = dest;
    } catch (err: any) {
      // Supabase error objects have non-enumerable properties — extract explicitly
      const raw = err?.message || err?.error_description || err?.msg || 'Invalid email or password';
      setError(mapAuthError(raw));
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFALoading(true);
    setTwoFAError('');
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: twoFACode.trim(), isBackupCode: useBackupCode }),
      });
      if (!res.ok) {
        setTwoFAError(useBackupCode ? 'Invalid backup code.' : 'Invalid or expired code. Try again.');
        return;
      }
      window.location.href = pendingDestRef.current || '/learner/dashboard';
    } catch {
      setTwoFAError('Verification failed. Please try again.');
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkSending(true);
    setLinkError('');
    try {
      const redirectTo = next
        ? next.startsWith('https://')
          ? next
          : next.startsWith('/admin')
            ? `${ADMIN_ORIGIN}${next}`
            : `${window.location.origin}${next}`
        : `${window.location.origin}/learner/dashboard`;
      const res = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: linkEmail.trim(), redirectTo }),
      });
      if (!res.ok) throw new Error('Failed to send link');
      setLinkSent(true);
    } catch (err: any) {
      setLinkError(err?.message || 'Could not send link. Please try again.');
    } finally {
      setLinkSending(false);
    }
  };

  // ── 2FA challenge screen ──────────────────────────────────────────────────
  if (show2FA) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Two-Factor Authentication</h2>
            <p className="text-sm text-slate-500 mt-1">
              {useBackupCode ? 'Enter one of your backup codes' : 'Enter the 6-digit code from your authenticator app'}
            </p>
          </div>
          <form onSubmit={handle2FASubmit} className="space-y-4">
            <input
              type="text"
              inputMode={useBackupCode ? 'text' : 'numeric'}
              pattern={useBackupCode ? undefined : '[0-9]{6}'}
              maxLength={useBackupCode ? 20 : 6}
              value={twoFACode}
              onChange={e => setTwoFACode(e.target.value)}
              placeholder={useBackupCode ? 'Backup code' : '000000'}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
              autoComplete="one-time-code"
            />
            {twoFAError && (
              <p className="text-sm text-red-600 text-center">{twoFAError}</p>
            )}
            <button
              type="submit"
              disabled={twoFALoading || twoFACode.trim().length < 6}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {twoFALoading ? 'Verifying…' : 'Verify'}
            </button>
            <button
              type="button"
              onClick={() => setUseBackupCode(v => !v)}
              className="w-full text-sm text-indigo-600 hover:underline text-center"
            >
              {useBackupCode ? 'Use authenticator app instead' : 'Use a backup code instead'}
            </button>
            <button
              type="button"
              onClick={() => { setShow2FA(false); setTwoFACode(''); setTwoFAError(''); }}
              className="w-full text-sm text-slate-400 hover:text-slate-600 text-center"
            >
              ← Back to login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner */}
      <section className="relative h-[200px] w-full overflow-hidden">
        {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
        <Image
          src="/images/pages/login-page-1.webp"
          alt={`${PLATFORM_DEFAULTS.orgName} login`}
          fill
          className="object-cover"
          priority
          quality={90}
          sizes="100vw"
        />
      </section>

      {/* Login Form */}
      <section className="py-12 relative z-10">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Portal-specific header when redirecting to a known portal */}
            {next?.startsWith('/portal/apprentice') && (
              <div className="mb-5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-center">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-widest">Apprentice Portal</p>
                <p className="text-xs text-amber-600 mt-0.5">DOL Registered Apprenticeship</p>
              </div>
            )}
            {next?.startsWith('/portal/healthcare') && (
              <div className="mb-5 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3 text-center">
                <p className="text-xs font-bold text-rose-700 uppercase tracking-widest">Healthcare Portal</p>
              </div>
            )}
            {next?.startsWith('/portal/trades') && (
              <div className="mb-5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-center">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-widest">Skilled Trades Portal</p>
              </div>
            )}
            {next?.startsWith('/portal/technology') && (
              <div className="mb-5 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 text-center">
                <p className="text-xs font-bold text-indigo-700 uppercase tracking-widest">Technology Portal</p>
              </div>
            )}
            {next?.startsWith('/portal/beauty') && (
              <div className="mb-5 bg-pink-50 border border-pink-200 rounded-lg px-4 py-3 text-center">
                <p className="text-xs font-bold text-pink-700 uppercase tracking-widest">Beauty & Barber Portal</p>
              </div>
            )}
            {next?.startsWith('/portal/business') && (
              <div className="mb-5 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-center">
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Business Portal</p>
              </div>
            )}
            <h1 className="text-3xl font-bold text-center mb-2">Login</h1>
            <p className="text-center text-black mb-8">
              Sign in to manage your training, certifications, and career progress.
            </p>

            {reason === 'idle' && !error && (
              <div
                className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm"
                role="alert"
              >
                Your session expired due to inactivity. Please sign in again.
              </div>
            )}

            {error && (
              <div
                className="mb-6 p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg text-brand-red-800 text-sm"
                role="alert"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-black mb-2">
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
                <label htmlFor="password" className="block text-sm font-semibold text-black mb-2">
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

              <div className="flex items-center justify-end text-sm">
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

            {/* ── Magic link section ─────────────────────────────────── */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              {!showLinkForm ? (
                <button
                  type="button"
                  onClick={() => setShowLinkForm(true)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 transition-all text-sm"
                >
                  No password? Get a sign-in link →
                </button>
              ) : linkSent ? (
                <div className="rounded-lg bg-brand-green-50 border border-brand-green-200 p-4 text-center">
                  <p className="text-sm font-semibold text-brand-green-800 mb-1">Check your email</p>
                  <p className="text-sm text-brand-green-700">
                    A sign-in link was sent to <strong>{linkEmail}</strong>. Click it to log in instantly — no password needed.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setLinkSent(false); setLinkEmail(''); }}
                    className="mt-3 text-xs text-brand-green-600 underline"
                  >
                    Send to a different email
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendLink} className="space-y-3">
                  <p className="text-sm font-semibold text-slate-700">Get a sign-in link by email</p>
                  <input
                    type="email"
                    required
                    value={linkEmail}
                    onChange={(e) => setLinkEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent text-sm"
                  />
                  {linkError && (
                    <p className="text-sm text-brand-red-600">{linkError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={linkSending}
                      className="flex-1 px-4 py-3 bg-brand-blue-600 text-white font-bold rounded-lg hover:bg-brand-blue-700 transition-all disabled:bg-slate-400 text-sm"
                    >
                      {linkSending ? 'Sending…' : 'Send link'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowLinkForm(false); setLinkError(''); }}
                      className="px-4 py-3 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-center text-sm text-black mb-4">Quick Access:</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Apprentice Portal', dest: '/portal/apprentice', highlight: true },
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
                    className={`text-center px-4 py-3 rounded-lg transition-all text-sm font-semibold min-h-[44px] inline-flex items-center justify-center ${'highlight' in item && item.highlight ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-white text-black hover:bg-slate-200'}`}
                  >
                    {item.label}
                  </Link>
                ))}
                {/* Admin portal lives on  — never on the LMS */}
                <a
                  href="/login"
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
              <a href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`} className="text-brand-blue-600 font-semibold">
                {PLATFORM_DEFAULTS.supportPhone}
              </a>{' '}
              or{' '}
              <Link href="/support" className="text-brand-blue-600 font-semibold">
                support center
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function LoginSkeleton() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-4 animate-pulse">
        <div className="h-8 bg-slate-100 rounded-lg w-48 mx-auto" />
        <div className="h-4 bg-slate-100 rounded w-64 mx-auto" />
        <div className="h-12 bg-slate-100 rounded-xl mt-6" />
        <div className="h-12 bg-slate-100 rounded-xl" />
        <div className="h-12 bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
          <LoginForm />
  );
}
