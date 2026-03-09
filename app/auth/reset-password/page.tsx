'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, CheckCircle, Lock, Eye, EyeOff } from 'lucide-react';

type PageState = 'loading' | 'ready' | 'no-session' | 'success';

export default function AuthResetPasswordPage() {
  const [pageState, setPageState] = useState<PageState>('loading');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = createClient();

    // Check if we already have a valid recovery session from /auth/confirm
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setPageState('ready');
      } else {
        // Also listen for PASSWORD_RECOVERY event (PKCE flow fallback)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
          if (event === 'PASSWORD_RECOVERY') {
            setPageState('ready');
          }
        });
        // Give it 2s for the auth state to propagate, then show no-session
        const timer = setTimeout(() => setPageState('no-session'), 2000);
        return () => {
          subscription.unsubscribe();
          clearTimeout(timer);
        };
      }
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
        if (updateError.message.toLowerCase().includes('session') ||
            updateError.message.toLowerCase().includes('expired')) {
          setError('Your reset link has expired. Please request a new one.');
        } else {
          setError(updateError.message);
        }
      } else {
        // Sign out so they log in fresh with the new password
        await supabase.auth.signOut();
        setPageState('success');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Loading — waiting for session check
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-red-600 mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Verifying reset link…</p>
        </div>
      </div>
    );
  }

  // Expired / invalid link
  if (pageState === 'no-session') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-brand-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-brand-red-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-3">Link Expired</h1>
          <p className="text-slate-600 mb-8">
            This password reset link has expired or already been used. Reset links are valid for 24 hours.
          </p>
          <Link
            href="/reset-password"
            className="inline-block bg-brand-red-600 text-white font-bold px-8 py-3 rounded-lg hover:bg-brand-red-700 transition"
          >
            Request New Link
          </Link>
          <div className="mt-4">
            <Link href="/login" className="text-slate-500 hover:text-slate-700 text-sm">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success
  if (pageState === 'success') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-brand-green-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-4">Password Updated</h1>
          <p className="text-slate-600 mb-8 text-lg">
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

  // Ready — show the form
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-brand-red-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Set New Password</h1>
          <p className="text-slate-600">Enter your new password below.</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          {error && (
            <div className="mb-6 p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-brand-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-brand-red-700 text-sm font-medium">{error}</p>
                {error.includes('expired') && (
                  <Link href="/reset-password" className="text-brand-red-600 underline text-sm mt-1 inline-block">
                    Request a new link →
                  </Link>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-11 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500 text-slate-900 text-base"
                  placeholder="Minimum 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {password.length > 0 && password.length < 8 && (
                <p className="text-xs text-brand-red-500 mt-1">At least 8 characters required</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500 text-slate-900 text-base"
                placeholder="Re-enter your password"
              />
              {confirm.length > 0 && password !== confirm && (
                <p className="text-xs text-brand-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || password.length < 8 || password !== confirm}
              className="w-full py-4 bg-brand-red-600 text-white font-bold rounded-lg text-base hover:bg-brand-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-slate-500 hover:text-slate-700 text-sm transition">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
