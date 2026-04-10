'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// Role → portal mapping — must stay in sync with lib/auth/role-destinations.ts
// program_holder goes to onboarding (not dashboard) — they haven't completed setup yet
const ROLE_DESTINATIONS: Record<string, string> = {
  admin:          '/admin/dashboard',
  super_admin:    '/admin/dashboard',
  staff:          '/staff-portal/dashboard',
  instructor:     '/instructor/dashboard',
  mentor:         '/mentor/dashboard',
  program_holder: '/program-holder/onboarding',
  partner:        '/partner/dashboard',
  employer:       '/employer/dashboard',
  student:        '/learner/dashboard',
  learner:        '/learner/dashboard',
};

function portalFor(role: string | null | undefined): string {
  if (!role) return '/learner/dashboard';
  return ROLE_DESTINATIONS[role] ?? '/learner/dashboard';
}

export default function SetPasswordPage() {
  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [success, setSuccess]         = useState(false);
  const [portal, setPortal]           = useState('/learner/dashboard');
  const [userRole, setUserRole]       = useState<string | null>(null);
  const [error, setError]             = useState('');
  const [sessionReady, setSessionReady] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let subscription: { unsubscribe: () => void } | null = null;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSessionReady(true);
        return;
      }
      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
          setSessionReady(true);
        }
      });
      subscription = sub;
      timeout = setTimeout(() => {
        setSessionReady(prev => prev === null ? false : prev);
      }, 4000);
    });

    return () => {
      subscription?.unsubscribe();
      if (timeout !== null) clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) { setError(updateError.message); return; }

      // Read role to redirect to the correct portal
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        setPortal(portalFor(profile?.role));
        setUserRole(profile?.role ?? null);
      }

      setSuccess(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success ──────────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-black mb-3">Password Created</h1>
          <p className="text-gray-600 mb-8 text-base">
            {userRole === 'program_holder'
              ? 'Your account is ready. Complete your onboarding steps to activate your portal.'
              : 'Your account is ready. Click below to go to your dashboard.'}
          </p>
          <a
            href={portal}
            className="inline-block bg-brand-red-600 text-white font-bold px-10 py-4 rounded-lg text-lg hover:bg-brand-red-700 transition"
          >
            {userRole === 'program_holder' ? 'Start Onboarding →' : 'Go to My Dashboard'}
          </a>
        </div>
      </div>
    );
  }

  // ── Session expired / invalid link ───────────────────────────────────────────
  if (sessionReady === false) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-black mb-3">Link Expired</h1>
          <p className="text-gray-600 mb-8">
            This invitation link has expired or already been used. Contact your coordinator to send a new one.
          </p>
          <Link
            href="/login"
            className="inline-block bg-brand-red-600 text-white font-bold px-10 py-4 rounded-lg text-lg hover:bg-brand-red-700 transition"
          >
            Go to Login
          </Link>
          <p className="mt-4 text-sm text-gray-500">
            Need help?{' '}
            <a href="tel:3173143757" className="text-brand-blue-600 hover:underline">(317) 314-3757</a>
          </p>
        </div>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (sessionReady === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-brand-red-600 animate-spin" />
      </div>
    );
  }

  // ── Set password form ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-black mb-2">Create Your Password</h1>
          <p className="text-gray-600">Set a password to secure your account.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-black mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 text-black text-base"
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-2">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 text-black text-base"
                placeholder="Re-enter your password"
                autoComplete="new-password"
              />
            </div>

            {password.length > 0 && (
              <p className={`text-sm ${password.length >= 8 ? 'text-green-600' : 'text-red-500'}`}>
                {password.length >= 8
                  ? '✓ Meets minimum length'
                  : `${8 - password.length} more character${8 - password.length === 1 ? '' : 's'} needed`}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-brand-red-600 text-white font-bold rounded-lg text-lg hover:bg-brand-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Creating...</> : 'Create Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
