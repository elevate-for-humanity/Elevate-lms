'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';
import { Building2, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const MARKETING_HOST_SHOP_APPLICATION = 'https://www.elevateforhumanity.org/host-shop/apply';

const IDENTITY_ERRORS: Record<string, string> = {
  identity: 'Your account could not be verified. Please contact support.',
  no_partner: 'Your account is not linked to an active approved host-shop partner record. Please contact support.',
};

export default function HostShopLoginPage() {
  const router = useRouter();
  const searchParams = useSafeSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  useEffect(() => {
    const code = searchParams.get('error');
    if (code && IDENTITY_ERRORS[code]) setError(IDENTITY_ERRORS[code]);
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw new Error('Invalid email or password.');
      if (!data.user) throw new Error('Login failed. Please try again.');

      // Host-shop authorization requires an explicit active partner_users link.
      // A generic profiles.role value is never sufficient by itself.
      const { data: partnerUser, error: partnerError } = await supabase
        .from('partner_users')
        .select('partner_id, role, status')
        .eq('user_id', data.user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (partnerError || !partnerUser?.partner_id) {
        await supabase.auth.signOut();
        throw new Error('This login is not linked to an active Host Shop account. Use the Host Shop application or contact support.');
      }

      router.replace('/host-shop/dashboard');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email.trim()) {
      setError('Enter your email address first.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (magicLinkError) throw new Error('We could not send the secure sign-in link. Please try again.');
      setMagicLinkSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send a sign-in link.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg lg:grid-cols-2">
        <section className="relative min-h-[240px] bg-slate-100 lg:min-h-[650px]" aria-label="Host shop portal">
          <Image
            src="/images/pages/partner-page-9.webp"
            alt="Host shop partner training environment"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        </section>

        <section className="flex items-center p-6 sm:p-10 lg:p-12">
          <div className="w-full">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-red-50 text-brand-red-700">
              <Building2 className="h-6 w-6" />
            </div>
            <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950">Host Shop Sign In</h1>
            <p className="mt-2 text-base leading-7 text-slate-700">Secure access for approved host-shop users linked to an active partner record.</p>

            {error && (
              <div role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-900">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-950">Email address</span>
                <span className="relative block">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-600" aria-hidden="true" />
                  <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-base text-slate-950 focus:border-brand-red-500 focus:outline-none focus:ring-2 focus:ring-brand-red-200" />
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-950">Password</span>
                <span className="relative block">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-600" aria-hidden="true" />
                  <input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-base text-slate-950 focus:border-brand-red-500 focus:outline-none focus:ring-2 focus:ring-brand-red-200" />
                </span>
              </label>

              <div className="flex justify-end">
                <Link href="/reset-password" className="text-sm font-bold text-brand-red-700 hover:underline">Forgot password?</Link>
              </div>

              <button type="submit" disabled={isLoading} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-5 py-3 font-extrabold text-white hover:bg-brand-red-700 disabled:cursor-not-allowed disabled:bg-slate-400">
                {isLoading ? 'Verifying…' : 'Sign In'}
                {!isLoading && <ArrowRight className="h-5 w-5" />}
              </button>
            </form>

            <div className="mt-4">
              {magicLinkSent ? (
                <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-center text-sm font-semibold text-emerald-900">Secure sign-in link sent to <strong>{email}</strong>.</div>
              ) : (
                <button type="button" onClick={handleMagicLink} disabled={isLoading} className="min-h-11 w-full text-sm font-bold text-slate-800 hover:text-brand-red-700 hover:underline disabled:opacity-50">Send a secure magic link instead</button>
              )}
            </div>

            <div className="mt-7 border-t border-slate-200 pt-6 text-center text-sm text-slate-700">
              <p>Not an approved Host Shop?</p>
              <a href={MARKETING_HOST_SHOP_APPLICATION} className="mt-2 inline-flex font-extrabold text-brand-red-700 hover:underline">Apply to become a Host Shop →</a>
            </div>

            <div className="mt-4 text-center">
              <Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-slate-950 hover:underline">Student or apprentice sign in</Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
