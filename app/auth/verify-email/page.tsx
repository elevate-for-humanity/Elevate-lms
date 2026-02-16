
'use client';

import React from 'react';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Mail, AlertCircle } from 'lucide-react';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>(
    'idle'
  );
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [supabaseReady, setSupabaseReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (supabase) {
      setSupabaseReady(true);
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user?.email) {
          setUserEmail(user.email);
        }
      });
    }
  }, []);

  const resendVerification = async () => {
    const supabase = createClient();
    if (!supabase || !userEmail) {
      setStatus('error');
      return;
    }
    
    setStatus('sending');
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
      });

      if (error) throw error;
      setStatus('sent');
    } catch (error) {
      console.error('Resend verification error:', error);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <Mail className="w-16 h-16 text-orange-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-black mb-2">
            Verify Your Email
          </h1>
          <p className="text-black">
            Please check your email and click the verification link to access
            your account.
          </p>
        </div>

        {status === 'sent' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <span className="text-slate-400 flex-shrink-0">•</span>
            <div>
              <p className="text-sm font-medium text-green-900">
                Verification email sent!
              </p>
              <p className="text-sm text-green-700">
                Check your inbox and spam folder.
              </p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3" role="alert">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">
                Error sending email
              </p>
              <p className="text-sm text-red-700">
                Please try again or contact support.
              </p>
            </div>
          </div>
        )}

        <button
          onClick={resendVerification}
          disabled={status === 'sending' || status === 'sent'}
          className="w-full py-3 px-4 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {status === 'sending'
            ? 'Sending...'
            : status === 'sent'
              ? 'Email Sent'
              : 'Resend Verification Email'}
        </button>

        <div className="mt-6 text-center">
          <p className="text-sm text-black">
            Need help?{' '}
            <a
              href="/contact"
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
