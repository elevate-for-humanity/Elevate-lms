'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      if (!supabase) throw new Error('Service unavailable. Please try again later.');

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Banner */}
      <section className="relative h-[180px] w-full overflow-hidden">
        <Image
          src="/images/heroes/success-story-3.jpg"
          alt="Forgot password"
          fill
          className="object-cover"
          priority
          quality={100}
          sizes="100vw"
        />
      </section>

      <section className="py-12">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {sent ? (
              <div className="text-center">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h1>
                <p className="text-gray-600 mb-6">
                  We sent a password reset link to <strong>{email}</strong>. Click the link in the email to set a new password.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Didn&apos;t receive it? Check your spam folder or try again.
                </p>
                <Link
                  href="/login"
                  className="text-brand-blue-600 font-semibold hover:text-brand-blue-700 inline-flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <Mail className="w-10 h-10 text-brand-blue-600 mx-auto mb-3" />
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
                  <p className="text-gray-600 text-sm">
                    Enter your email address and we&apos;ll send you a link to reset your password.
                  </p>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg text-brand-red-800 text-sm" role="alert">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                      placeholder="your.email@gmail.com"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-8 py-4 bg-brand-blue-600 text-white font-bold rounded-lg hover:bg-brand-blue-700 transition-all disabled:bg-slate-400 disabled:cursor-not-allowed text-lg"
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    href="/login"
                    className="text-brand-blue-600 font-semibold hover:text-brand-blue-700 text-sm inline-flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
