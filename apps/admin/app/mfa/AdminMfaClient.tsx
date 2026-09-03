'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, KeyRound, Loader2, ShieldCheck } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';

function safeReturnPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/dashboard';
  return value;
}

export function AdminMfaClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnPath = useMemo(() => safeReturnPath(searchParams.get('redirect')), [searchParams]);
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [factorId, setFactorId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [mode, setMode] = useState<'enroll' | 'challenge'>('challenge');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      setLoading(true);
      setMessage('');
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          router.replace(`/login?redirect=${encodeURIComponent(`/mfa?redirect=${returnPath}`)}`);
          return;
        }

        const { data: aal, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aalError) throw aalError;
        if (aal.currentLevel === 'aal2') {
          router.replace(returnPath);
          return;
        }

        const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
        if (factorsError) throw factorsError;
        const verifiedTotp = factors.totp.find((factor) => factor.status === 'verified');

        if (verifiedTotp) {
          if (!cancelled) {
            setMode('challenge');
            setFactorId(verifiedTotp.id);
          }
          return;
        }

        const { data: enrollment, error: enrollError } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
          friendlyName: 'Elevate Admin',
        });
        if (enrollError) throw enrollError;

        if (!cancelled) {
          setMode('enroll');
          setFactorId(enrollment.id);
          setQrCode(enrollment.totp.qr_code);
          setSecret(enrollment.totp.secret);
        }
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : 'Unable to prepare MFA.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void initialize();
    return () => { cancelled = true; };
  }, [returnPath, router, supabase]);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!factorId || !/^\d{6,8}$/.test(code.trim())) {
      setMessage('Enter the verification code from your authenticator app.');
      return;
    }

    setSubmitting(true);
    setMessage('');
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: code.trim(),
      });
      if (verifyError) throw verifyError;

      const { data: aal, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalError) throw aalError;
      if (aal.currentLevel !== 'aal2') throw new Error('MFA verification completed but the session did not reach AAL2.');

      router.replace(returnPath);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Verification failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-white">
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-cyan-500/10 p-3"><ShieldCheck className="h-7 w-7 text-cyan-400" /></div>
          <div>
            <h1 className="text-2xl font-black">Administrator multi-factor authentication</h1>
            <p className="mt-1 text-sm text-slate-400">Privileged Elevate access requires an AAL2 session when MFA enforcement is enabled.</p>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 flex items-center justify-center gap-2 py-10 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Preparing secure authentication…</div>
        ) : (
          <>
            {mode === 'enroll' && qrCode && (
              <section className="mt-6 rounded-xl border border-slate-700 bg-white p-5 text-slate-900">
                <p className="font-bold">1. Add Elevate Admin to your authenticator app</p>
                <p className="mt-1 text-sm text-slate-600">Scan this QR code with a TOTP authenticator such as Google Authenticator, Microsoft Authenticator, 1Password, or another compatible app.</p>
                {/* Supabase returns the QR code as a data URL for the enrolled factor. */}
                <img src={qrCode} alt="Elevate Admin MFA QR code" className="mx-auto my-5 h-56 w-56" />
                <details className="rounded-lg bg-slate-100 p-3 text-sm">
                  <summary className="cursor-pointer font-semibold">Can’t scan the QR code?</summary>
                  <p className="mt-2 break-all font-mono text-xs">{secret}</p>
                </details>
              </section>
            )}

            <form onSubmit={verify} className="mt-6 space-y-4">
              <div>
                <label htmlFor="mfa-code" className="text-sm font-semibold text-slate-200">{mode === 'enroll' ? '2. Enter the verification code' : 'Authenticator code'}</label>
                <div className="relative mt-2">
                  <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input id="mfa-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\s/g, ''))} placeholder="000000" className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-10 pr-3 text-lg tracking-[0.25em] outline-none focus:border-cyan-500" />
                </div>
              </div>

              {message && <div className="rounded-lg border border-amber-800 bg-amber-950/40 px-3 py-2 text-sm text-amber-200">{message}</div>}

              <button type="submit" disabled={submitting || !factorId} className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 font-black text-slate-950 hover:bg-cyan-400 disabled:opacity-50">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {mode === 'enroll' ? 'Enable MFA and continue' : 'Verify and continue'}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
