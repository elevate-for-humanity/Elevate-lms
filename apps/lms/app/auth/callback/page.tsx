'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { validateRedirect } from '@/lib/auth/validate-redirect';

export default function AuthCallbackPage() {
  const [message, setMessage] = useState('Completing your secure sign-in…');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    async function completeSignIn() {
      const url = new URL(window.location.href);
      const fragment = new URLSearchParams(url.hash.replace(/^#/, ''));
      const errorCode =
        fragment.get('error_code') || fragment.get('error') || url.searchParams.get('error');
      const errorDescription =
        fragment.get('error_description') || url.searchParams.get('error_description');
      const requested =
        url.searchParams.get('redirect') || url.searchParams.get('next') || '/lms/dashboard';
      const destination = validateRedirect(requested, '/lms/dashboard');

      if (errorCode) {
        const expired = errorCode === 'otp_expired' || /expired|invalid/i.test(errorDescription || '');
        const reason = expired ? 'magic_link_expired' : 'magic_link_failed';
        window.location.replace(
          `/login?error=${reason}&redirect=${encodeURIComponent(destination)}`,
        );
        return;
      }

      try {
        const supabase = createClient();
        const code = url.searchParams.get('code');
        const accessToken = fragment.get('access_token');
        const refreshToken = fragment.get('refresh_token');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        } else {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session) throw new Error('No valid sign-in session was returned.');
        }

        window.location.replace(destination);
      } catch {
        if (!active) return;
        setFailed(true);
        setMessage('This sign-in link is invalid or has expired. Request a new secure link.');
        window.history.replaceState({}, '', `/auth/callback?redirect=${encodeURIComponent(destination)}`);
      }
    }

    void completeSignIn();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
        <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
          Elevate for Humanity
        </p>
        <h1 className="mt-3 text-2xl font-black text-slate-950">
          {failed ? 'Request a new sign-in link' : 'Secure sign-in'}
        </h1>
        <p role={failed ? 'alert' : 'status'} className="mt-4 leading-7 text-slate-700">
          {message}
        </p>
        {failed ? (
          <Link
            href="/host-shop/login"
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800"
          >
            Return to secure login
          </Link>
        ) : null}
      </section>
    </main>
  );
}
