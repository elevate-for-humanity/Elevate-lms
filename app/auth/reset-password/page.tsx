'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function AuthResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [sessionReady, setSessionReady] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // First check for an existing session (set by /auth/confirm via cookie).
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSessionReady(true);
        return;
      }

      // No cookie session yet — listen for auth state events.
      // PASSWORD_RECOVERY fires when the user arrives via a hash-fragment link.
      // SIGNED_IN fires when the browser picks up the session cookie set by
      // /auth/confirm after a short propagation delay.
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
          setSessionReady(true);
        }
      });

      // After 3 s with no auth event, declare the session invalid.
      const timeout = setTimeout(() => {
        setSessionReady(prev => prev === null ? false : prev);
      }, 3000);

      return () => {
        subscription.unsubscribe();
        clearTimeout(timeout);
      };
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
      } else {
        // Sign out so the user logs in fresh with the new password
        await supabase.auth.signOut();
        setSuccess(true);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-brand-green-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-black mb-4">Password Updated</h1>
          <p className="text-gray-600 mb-8 text-lg">
            Your password has been reset. Sign in with your new password.
          </p>
          <Link
            href="/login"
            className="inline-block bg-brand-red-600 text-white font-bold px-10 py-4 rounded-lg text-lg hover:bg-brand-red-700 transition"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // No valid recovery session — link expired or direct navigation
  if (sessionReady === false) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-brand-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-brand-red-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-black mb-4">Link Expired</h1>
          <p className="text-gray-600 mb-8 text-lg">
            This password reset link is invalid or has expired. Request a new one.
          </p>
          <Link
            href="/auth/forgot-password"
            className="inline-block bg-brand-red-600 text-white font-bold px-10 py-4 rounded-lg text-lg hover:bg-brand-red-700 transition"
          >
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  // Checking session
  if (sessionReady === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-black mb-2">Set New Password</h1>
          <p className="text-gray-600 text-lg">Enter your new password below.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          {error && (
            <div className="mb-6 p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-brand-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-brand-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-black mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 text-black text-lg"
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
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
              <label className="block text-sm font-bold text-black mb-2">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 text-black text-lg"
                placeholder="Re-enter your password"
                autoComplete="new-password"
              />
            </div>

            {password.length > 0 && (
              <p className={`text-sm ${password.length >= 8 ? 'text-brand-green-600' : 'text-brand-red-500'}`}>
                {password.length >= 8
                  ? '✓ Meets minimum length'
                  : `${8 - password.length} more character${8 - password.length === 1 ? '' : 's'} needed`}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-brand-red-600 text-white font-bold rounded-lg text-lg hover:bg-brand-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-gray-600 hover:text-black transition font-medium">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
