'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

interface Credential {
  id: string;
  title: string;
  issuer: string;
  issueDate: string;
  verificationUrl: string;
  status: 'verified' | 'pending' | 'revoked';
  skills: string[];
}

export function BlockchainCredentialVerification() {
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationResult, setVerificationResult] = useState<Credential | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleVerify() {
    const code = verificationCode.trim();
    if (!code) return;
    setIsVerifying(true);
    setMessage(null);
    setVerificationResult(null);

    try {
      const supabase = createClient();
      const { data: cert, error } = await supabase
        .from('certificates')
        .select('id, certificate_number, issued_at, metadata, status')
        .eq('certificate_number', code)
        .maybeSingle();

      if (error || !cert) {
        setMessage('No credential matched that verification code.');
        return;
      }

      const metadata = cert.metadata && typeof cert.metadata === 'object'
        ? cert.metadata as Record<string, unknown>
        : {};
      const skills = Array.isArray(metadata.skills)
        ? metadata.skills.filter((value): value is string => typeof value === 'string')
        : [];
      const status = cert.status === 'revoked' ? 'revoked' : cert.status === 'pending' ? 'pending' : 'verified';

      setVerificationResult({
        id: cert.id,
        title: typeof metadata.course_name === 'string' ? metadata.course_name : 'Program Certificate',
        issuer: `${PLATFORM_DEFAULTS.orgName} Career & Technical Institute`,
        issueDate: cert.issued_at?.split('T')[0] || '',
        verificationUrl: `https://${PLATFORM_DEFAULTS.canonicalDomain}/verify/${cert.certificate_number}`,
        status,
        skills,
      });
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
          <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-red-700">Credential verification</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Verify an Elevate credential</h1>
          <p className="mt-2 text-sm text-slate-600">Enter the certificate number shown on the issued credential. The result is read from the live credential record.</p>
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
            />
            <Button onClick={() => void handleVerify()} disabled={isVerifying || !verificationCode.trim()}>
              {isVerifying ? 'Verifying…' : 'Verify'}
            </Button>
          </div>

          {message && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{message}</p>}

          {verificationResult && (
            <div className={`mt-6 rounded-2xl border p-5 ${verificationResult.status === 'verified' ? 'border-emerald-200 bg-emerald-50' : verificationResult.status === 'revoked' ? 'border-rose-200 bg-rose-50' : 'border-amber-200 bg-amber-50'}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-600">Verification result</p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">{verificationResult.title}</h2>
                  <p className="mt-1 text-sm text-slate-700">{verificationResult.issuer}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase text-slate-800 shadow-sm">{verificationResult.status}</span>
              </div>
              <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="font-bold text-slate-600">Issued</dt><dd className="text-slate-950">{verificationResult.issueDate || 'Not recorded'}</dd></div>
                <div><dt className="font-bold text-slate-600">Record ID</dt><dd className="break-all text-slate-950">{verificationResult.id}</dd></div>
              </dl>
              {verificationResult.skills.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {verificationResult.skills.map((skill) => <span key={skill} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700">{skill}</span>)}
                </div>
              )}
              <a href={verificationResult.verificationUrl} className="mt-5 inline-block text-sm font-bold text-brand-blue-700 hover:underline">Open public verification record</a>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
