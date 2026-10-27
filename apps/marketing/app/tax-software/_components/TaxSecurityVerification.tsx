'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export function TaxSecurityVerification({ onVerified }: { onVerified: () => void }) {
  const [factorId, setFactorId] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    void createClient()
      .auth.mfa.listFactors()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setError('Unable to load account verification. Please sign in again.');
        else setFactorId(data?.totp.find((factor) => factor.status === 'verified')?.id ?? '');
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  async function verify(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { error } = await createClient().auth.mfa.challengeAndVerify({ factorId, code });
      if (error) throw error;
      onVerified();
    } catch {
      setError('Verification failed. Check your current authenticator code and try again.');
    } finally {
      setBusy(false);
    }
  }
  async function enroll() {
    setBusy(true);
    setError('');
    try {
      const { data, error } = await createClient().auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Supersonic Tax Workspace',
      });
      if (error) throw error;
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
    } catch {
      setError('Unable to set up verification. Please sign in again and retry.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="mt-8 rounded-2xl border border-blue-200 bg-white p-6 sm:p-8"
      aria-labelledby="tax-verification-heading"
    >
      <h2 id="tax-verification-heading" className="text-2xl font-bold">
        Verify your account to continue
      </h2>
      <p className="mt-3 text-slate-700">
        Your administrator account requires two-step verification before accessing private tax
        records.
      </p>
      {loading ? (
        <p className="mt-4">Loading verification…</p>
      ) : factorId ? (
        <form onSubmit={verify} className="mt-5 space-y-4">
          {qrCode && (
            <div>
              <p className="mb-3">
                Scan this code with your authenticator app, then enter its six-digit code.
              </p>
              <img src={qrCode} alt="Authenticator enrollment QR code" width={220} height={220} />
            </div>
          )}
          <label className="block font-semibold" htmlFor="tax-verification-code">
            Authenticator code
          </label>
          <input
            id="tax-verification-code"
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="w-full rounded-lg border border-slate-300 p-3"
          />
          <button
            disabled={busy}
            className="rounded-xl bg-blue-800 px-6 py-3 font-bold text-white disabled:opacity-50"
          >
            {busy ? 'Verifying…' : 'Verify and continue'}
          </button>
        </form>
      ) : (
        <button
          onClick={() => void enroll()}
          disabled={busy}
          className="mt-5 inline-flex rounded-xl bg-blue-800 px-6 py-3 font-bold text-white disabled:opacity-50"
        >
          {busy ? 'Setting up…' : 'Set up account verification'}
        </button>
      )}
      {error && (
        <p role="alert" className="mt-4 text-red-800">
          {error}
        </p>
      )}
      <Link href="/tax-software/login" className="mt-5 block font-semibold text-blue-800 underline">
        Sign in again
      </Link>
    </section>
  );
}
