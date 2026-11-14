'use client';

import { useEffect, useMemo, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';

type FactorSummary = {
  id: string;
  friendlyName?: string;
  status?: string;
};

export default function MfaEnrollmentCard() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [loading, setLoading] = useState(true);
  const [factors, setFactors] = useState<FactorSummary[]>([]);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aal, setAal] = useState<string>('unknown');

  async function refreshStatus() {
    setLoading(true);
    setError(null);
    const [{ data: listData, error: listError }, { data: aalData, error: aalError }] = await Promise.all([
      supabase.auth.mfa.listFactors(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);

    if (listError) setError(listError.message);
    if (aalError) setError(aalError.message);

    const totp = listData?.totp ?? [];
    setFactors(totp.map((f) => ({ id: f.id, friendlyName: f.friendly_name, status: f.status })));
    setAal(aalData?.currentLevel ?? 'aal1');
    setLoading(false);
  }

  useEffect(() => {
    void refreshStatus();
  }, []);

  async function beginEnrollment() {
    setError(null);
    setMessage(null);
    setCode('');

    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Elevate Admin Authenticator',
    });

    if (enrollError || !data?.id || !data.totp) {
      setError(enrollError?.message ?? 'Unable to start TOTP enrollment.');
      return;
    }

    setFactorId(data.id);
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
  }

  async function verifyEnrollment() {
    if (!factorId || !/^\d{6}$/.test(code.trim())) {
      setError('Enter the 6-digit code from your authenticator app.');
      return;
    }

    setError(null);
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: code.trim(),
    });

    if (verifyError) {
      setError(verifyError.message);
      return;
    }

    setMessage('Authenticator verified. This session is now AAL2.');
    setFactorId(null);
    setQrCode(null);
    setSecret(null);
    setCode('');
    await refreshStatus();
  }

  async function removeFactor(id: string) {
    setError(null);
    setMessage(null);
    const { error: removeError } = await supabase.auth.mfa.unenroll({ factorId: id });
    if (removeError) {
      setError(removeError.message);
      return;
    }
    setMessage('Authenticator factor removed.');
    await refreshStatus();
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Your authenticator</h2>
          <p className="text-sm text-slate-500">Enroll and verify TOTP MFA for this administrator account.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${aal === 'aal2' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
          Session {aal.toUpperCase()}
        </span>
      </div>

      {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      {message && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div>}

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Checking MFA status…</p>
      ) : (
        <div className="mt-4 space-y-4">
          {factors.length > 0 ? (
            <div className="space-y-2">
              {factors.map((factor) => (
                <div key={factor.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
                  <div>
                    <div className="font-medium text-slate-900">{factor.friendlyName || 'Authenticator app'}</div>
                    <div className="text-xs text-slate-500">Status: {factor.status || 'unknown'}</div>
                  </div>
                  <button type="button" onClick={() => void removeFactor(factor.id)} className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              No authenticator factor is enrolled for this account.
            </div>
          )}

          {!factorId && (
            <button type="button" onClick={() => void beginEnrollment()} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Enroll authenticator app
            </button>
          )}

          {factorId && qrCode && (
            <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div>
                <h3 className="font-semibold text-slate-900">Scan this QR code</h3>
                <p className="text-sm text-slate-600">Use Google Authenticator, Microsoft Authenticator, 1Password, Authy, or another TOTP app.</p>
              </div>
              <img src={qrCode} alt="TOTP enrollment QR code" className="h-48 w-48 rounded bg-white p-2" />
              {secret && (
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Manual setup secret</div>
                  <code className="mt-1 block break-all rounded bg-white p-2 text-sm text-slate-900">{secret}</code>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="w-40 rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <button type="button" onClick={() => void verifyEnrollment()} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
                  Verify and enable MFA
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
