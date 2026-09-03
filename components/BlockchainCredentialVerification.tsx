'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface IntegrityResult {
  found: boolean;
  integrity_valid: boolean;
  algorithm?: string;
  payload_hash?: string | null;
  status?: string | null;
  certificate_number?: string | null;
  issued_at?: string | null;
  verification_url?: string | null;
}

export function BlockchainCredentialVerification() {
  const [verificationCode, setVerificationCode] = useState('');
  const [result, setResult] = useState<IntegrityResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleVerify() {
    const code = verificationCode.trim();
    if (!code) return;

    setIsVerifying(true);
    setMessage(null);
    setResult(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('verify_certificate_integrity', {
        p_certificate_number: code,
      });

      if (error) throw error;
      const parsed = data && typeof data === 'object' ? data as IntegrityResult : null;
      if (!parsed?.found) {
        setMessage('No credential matched that certificate number.');
        return;
      }
      setResult(parsed);
    } catch {
      setMessage('Credential verification is temporarily unavailable.');
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-6">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-red-700">Credential integrity</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Verify an Elevate credential</h1>
          <p className="mt-2 text-sm text-slate-600">
            Enter the certificate number. Verification compares the live canonical certificate record with its issuance-time SHA-256 integrity evidence.
          </p>
        </div>

        <Card className="p-6">
          <label className="block text-sm font-bold text-slate-800" htmlFor="verification-code">Certificate number</label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              id="verification-code"
              type="text"
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') void handleVerify(); }}
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-slate-950 focus:border-brand-blue-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-200"
              placeholder="Enter certificate number"
              autoComplete="off"
            />
            <Button onClick={() => void handleVerify()} disabled={isVerifying || !verificationCode.trim()}>
              {isVerifying ? 'Verifying…' : 'Verify'}
            </Button>
          </div>

          {message && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{message}</p>}

          {result && (
            <div className={`mt-6 rounded-2xl border p-5 ${result.integrity_valid ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-600">Integrity result</p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">
                    {result.integrity_valid ? 'Cryptographic integrity verified' : 'Integrity mismatch detected'}
                  </h2>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase text-slate-800 shadow-sm">
                  {result.status ?? 'unknown'}
                </span>
              </div>

              <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="font-bold text-slate-600">Certificate</dt><dd className="break-all text-slate-950">{result.certificate_number}</dd></div>
                <div><dt className="font-bold text-slate-600">Algorithm</dt><dd className="uppercase text-slate-950">{result.algorithm ?? 'sha256'}</dd></div>
                <div><dt className="font-bold text-slate-600">Issued</dt><dd className="text-slate-950">{result.issued_at ? new Date(result.issued_at).toLocaleDateString() : 'Not recorded'}</dd></div>
                <div><dt className="font-bold text-slate-600">Integrity</dt><dd className="text-slate-950">{result.integrity_valid ? 'Valid' : 'Invalid'}</dd></div>
              </dl>

              {result.payload_hash && (
                <div className="mt-4 rounded-xl bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">SHA-256 issuance hash</p>
                  <p className="mt-2 break-all font-mono text-xs text-slate-800">{result.payload_hash}</p>
                </div>
              )}

              {result.verification_url && (
                <a href={result.verification_url} className="mt-5 inline-block text-sm font-bold text-brand-blue-700 hover:underline">Open public verification record</a>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
