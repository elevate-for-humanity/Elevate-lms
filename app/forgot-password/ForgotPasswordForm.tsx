'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { sendRecoveryEmail } from '@/app/forgot-password/actions';

function Form() {
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
      if (result?.success === false && result.error) {
        setError(result.error);
      } else {
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
      <div className="text-center">
        <CheckCircle className="mx-auto mb-4 h-12 w-12 text-brand-green-500" />
        <h2 className="text-xl font-bold text-slate-900">Check your email</h2>
        <p className="mt-2 text-slate-600">
          If an account exists for <strong>{email}</strong>, you'll receive a reset link shortly.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-brand-red-600 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
          Email address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2.5 text-sm focus:border-brand-red-500 focus:outline-none focus:ring-1 focus:ring-brand-red-500"
          />
        </div>
      </div>
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-brand-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-red-700 disabled:opacity-60"
      >
        {loading ? 'Sending…' : 'Send reset link'}
      </button>
    </form>
  );
}

export default function ForgotPasswordForm() {
  return (
    <Suspense>
      <Form />
    </Suspense>
  );
}
