
'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Mail, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState('');
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    // Get email from URL params or current user
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');

    if (emailParam) {
      setEmail(emailParam);
    } else if (supabase) {
      // Get from current user
      supabase.auth.getUser().then(({ data }) => {
        if (data.user?.email) {
          setEmail(data.user.email);
        }
      });
    }
  }, [supabase]);

  const handleResendVerification = async () => {
    setResending(true);
    setError('');
    setResent(false);

    try {
      if (!supabase) throw new Error('Service unavailable');
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) throw error;

      setResent(true);
    } catch (err: any) {
      setError((err as Error).message || 'Failed to resend verification email');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-orange-100 rounded-full mb-4">
            <Mail className="w-8 h-8 text-brand-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-black mb-2">
            Verify Your Email
          </h1>
          <p className="text-black">We sent a verification link to:</p>
          <p className="text-brand-blue-600 font-semibold mt-2">{email}</p>
        </div>

        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-brand-blue-900 mb-2 flex items-center">
            <span className="text-slate-400 flex-shrink-0">•</span>
            Next Steps:
          </h2>
          <ol className="text-sm text-brand-blue-800 space-y-2 ml-7">
            <li>1. Check your email inbox</li>
            <li>2. Click the verification link</li>
            <li>3. Return here and refresh the page</li>
          </ol>
        </div>

        {resent && (
          <div className="bg-brand-green-50 border border-brand-green-200 rounded-lg p-4 mb-4">
            <p className="text-brand-green-800 text-sm flex items-center">
              <span className="text-slate-400 flex-shrink-0">•</span>
              Verification email sent! Check your inbox.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-brand-red-50 border border-brand-red-200 rounded-lg p-4 mb-4">
            <p className="text-brand-red-800 text-sm flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleResendVerification}
            disabled={resending || resent}
            className="w-full px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            {resending
              ? 'Sending...'
              : resent
                ? 'Email Sent!'
                : 'Resend Verification Email'}
          </button>

          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 border-2 border-gray-300 text-black font-semibold rounded-lg hover:bg-gray-50 transition"
          >
            I've Verified - Refresh Page
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-black mb-2">
            Didn't receive the email?
          </p>
          <ul className="text-xs text-black space-y-1">
            <li>• Check your spam/junk folder</li>
            <li>• Make sure {email} is correct</li>
            <li>• Wait a few minutes and try again</li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/contact"
            className="text-sm text-brand-blue-600 hover:text-brand-blue-700 font-medium"
          >
            Need help? Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
