'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { validateRedirect } from '@/lib/auth/validate-redirect';

export default function AuthCallbackPage() {
  const [message, setMessage] = useState('Completing your secure sign-in…');
  const [failed, setFailed] = useState(false);
  const [loginHref, setLoginHref] = useState('/login');

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
      let destination = '/lms/dashboard';
      try {
        destination = validateRedirect(requested, destination);
      } catch {
        // Malformed URL encoding must not interrupt session completion.
      }
      setLoginHref(`/login?redirect=${encodeURIComponent(destination)}`);

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
        const { error: initializationError } = await supabase.auth.initialize();
        if (!active) return;

        if (code) {
          if (initializationError) throw initializationError;
          // The browser SDK automatically exchanges a PKCE code and removes it
          // from the live URL. A previously initialized client may still need an
          // explicit exchange; never retry a code the SDK already consumed.
          if (new URL(window.location.href).searchParams.get('code') === code) {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) throw error;
          }
        } else if (accessToken && refreshToken) {
          // Keep legacy fragment/recovery links working: the PKCE client rejects
          // automatic fragment detection, but setSession verifies these tokens.
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        } else if (initializationError) {
          throw initializationError;
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.user?.id) throw sessionError || new Error('No valid sign-in session was returned.');
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user || user.id !== session.user.id) throw userError || new Error('The sign-in session could not be verified.');
        if (!active) return;

        // Best-effort owner notification; never blocks sign-in.
        void fetch('/api/auth/notify-signin', { method: 'POST', cache: 'no-store' }).catch(
          () => {},
        );

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
            href={loginHref}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800"
          >
            Return to secure login
          </Link>
        ) : null}
      </section>
    </main>
  );
}
