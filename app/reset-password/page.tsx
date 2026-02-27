
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, ArrowLeft, AlertCircle } from 'lucide-react';
import { sendRecoveryEmail } from '@/app/auth/forgot-password/actions';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await sendRecoveryEmail(email);
      if (!result.success && result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    } catch {
      setError('Unable to send reset link. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-slate-400 flex-shrink-0">•</span>
          </div>
          <h1 className="text-2xl font-bold text-black mb-4">Check Your Email</h1>
          <p className="text-gray-600 mb-6">
            We've sent a password reset link to <strong>{email}</strong>. 
            Click the link in the email to reset your password.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Didn't receive the email? Check your spam folder or try again.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-700 font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/">
            <Image
              src="/images/heroes/about-mission.jpg"
              alt="Elevate for Humanity"
              width={180}
              height={60}
              className="mx-auto mb-6"
            />
          </Link>
          <h1 className="text-3xl font-bold text-black mb-2">Reset Password</h1>
          <p className="text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-brand-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-brand-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 text-black"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-blue-600 text-white font-bold rounded-lg hover:bg-brand-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-black transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          Don't have an account?{' '}
          <Link href="/signup" className="text-brand-blue-600 hover:underline font-semibold">
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  );
}
