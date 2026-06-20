'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { validateRedirect } from '@/lib/auth/validate-redirect';

function getSafeRedirect(raw: string | null | undefined): string {
  return validateRedirect(raw, '/admin/dashboard');
}

export default function AdminLoginForm({ redirectTo, initialError }: { redirectTo?: string; initialError?: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError ?? '');
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const next = getSafeRedirect(redirectTo ?? null);

  // Check if already logged in on mount
  useEffect(() => {
    async function checkSession() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Already logged in - redirect to admin dashboard
        window.location.href = next;
      }
    }
    checkSession();
  }, [next]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Server-side endpoint: signs in + verifies role using service role key.
      // Avoids RLS blocking the profile read when using the anon client.
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }), // never trim passwords
      });

      const body = await res.json();

      if (!res.ok) {
        setError(body.error || 'Invalid email or password.');
        setLoading(false);
        return;
      }

      window.location.href = next;
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/confirm`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        forgotEmail.trim(),
        { redirectTo },
      );

      if (resetError) throw resetError;
      setForgotSent(true);
    } catch (err: any) {
      setForgotError(err?.message || 'Failed to send reset email. Try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Image
              src="/favicon.png"
              alt="Elevate for Humanity"
              width={48}
              height={48}
              className="rounded-xl"
              priority
            />
          </div>
          <h1 className="text-xl font-bold text-white">Elevate Admin</h1>
          <p className="text-slate-400 text-sm mt-1">Admin Portal</p>
        </div>

        {mode === 'login' ? (
          /* ── Login Form ── */
          <form onSubmit={handleLogin} className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
            {error && (
              <div className="bg-red-950 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent text-sm"
                placeholder="you@elevateforhumanity.org"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setForgotEmail(email); setForgotError(''); setForgotSent(false); }}
                  className="text-xs text-brand-blue-400 hover:text-brand-blue-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        ) : (
          /* ── Forgot Password Form ── */
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
            {forgotSent ? (
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-900 mx-auto">
                  <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-white text-sm font-semibold">Check your email</p>
                <p className="text-slate-400 text-xs leading-relaxed">
                  A password reset link has been sent to <span className="text-slate-200">{forgotEmail}</span>. The link expires in 1 hour.
                </p>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs text-brand-blue-400 hover:text-brand-blue-300 transition-colors"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <p className="text-white text-sm font-semibold mb-1">Reset your password</p>
                  <p className="text-slate-400 text-xs">Enter your admin email and we&apos;ll send a reset link.</p>
                </div>

                {forgotError && (
                  <div className="bg-red-950 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-lg">
                    {forgotError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent text-sm"
                    placeholder="you@elevateforhumanity.org"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-2.5 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm"
                >
                  {forgotLoading ? 'Sending…' : 'Send Reset Link'}
                </button>

                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Cancel — back to sign in
                </button>
              </form>
            )}
          </div>
        )}

        <p className="text-center text-slate-600 text-xs mt-6">
          {PLATFORM_DEFAULTS.orgName} · Admin Portal · Restricted Access
        </p>
      </div>
    </div>
  );
}
