'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Award, Calendar, User, Building2, XCircle, Loader2, ShieldCheck } from 'lucide-react';

type VerifyRecord = {
  credentialId: string;
  fullName: string;
  program: string;
  credentialType: string;
  issuedAt: string;
  expiresAt: string | null;
  status: string;
};

type VerifyResponse =
  | { ok: true; record: VerifyRecord }
  | { ok: false; reason: string };

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function VerifyClient({ initialId }: { initialId?: string }) {
  const [credentialId, setCredentialId] = useState(initialId || '');
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<VerifyResponse | null>(null);
  const [searched, setSearched] = useState(false);

  const normalized = useMemo(() => credentialId.trim(), [credentialId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (normalized.length < 4) return;
    setLoading(true);
    setResp(null);
    setSearched(true);
    try {
      const r = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentialId: normalized }),
      });
      const j = (await r.json().catch(() => null)) as VerifyResponse | null;
      setResp(j ?? { ok: false, reason: 'server_error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Title */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-brand-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Award className="w-8 h-8 text-brand-orange-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Certificate Verification</h1>
        <p className="text-gray-600">
          Enter a certificate ID or verification code to verify its authenticity.
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <form onSubmit={onSubmit} className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="credentialId" className="sr-only">Certificate ID</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                id="credentialId"
                value={credentialId}
                onChange={(e) => setCredentialId(e.target.value)}
                placeholder="Enter certificate ID or verification code"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-brand-orange-500"
                autoComplete="off"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || normalized.length < 4}
            className="px-6 py-3 bg-brand-orange-600 text-white font-medium rounded-lg hover:bg-brand-orange-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>
      </div>

      {/* Results */}
      {searched && !loading && resp && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {resp.ok ? (
            <>
              <div className="bg-brand-green-50 border-b border-brand-green-200 p-6">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-8 h-8 text-brand-green-600" />
                  <div>
                    <h2 className="text-xl font-bold text-brand-green-800">Certificate Verified</h2>
                    <p className="text-brand-green-700">
                      {resp.record.status === 'revoked'
                        ? 'This certificate has been revoked.'
                        : 'This certificate is authentic and valid.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <User className="w-4 h-4" />
                      <span>Recipient</span>
                    </div>
                    <p className="font-semibold text-gray-900">{resp.record.fullName}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <Award className="w-4 h-4" />
                      <span>Credential</span>
                    </div>
                    <p className="font-semibold text-gray-900">{resp.record.credentialType}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <Calendar className="w-4 h-4" />
                      <span>Issue Date</span>
                    </div>
                    <p className="font-semibold text-gray-900">{fmtDate(resp.record.issuedAt)}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <Building2 className="w-4 h-4" />
                      <span>Certificate Number</span>
                    </div>
                    <p className="font-semibold text-gray-900 font-mono">{resp.record.credentialId}</p>
                  </div>
                </div>

                {resp.record.program && resp.record.program !== 'N/A' && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Program:</span> {resp.record.program}
                    </p>
                  </div>
                )}

                {resp.record.expiresAt && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Expires:</span> {fmtDate(resp.record.expiresAt)}
                    </p>
                  </div>
                )}

                <p className="pt-2 text-xs text-gray-400">
                  If you need written confirmation, contact support with the Certificate Number.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-brand-red-50 border-b border-brand-red-200 p-6">
                <div className="flex items-center gap-3">
                  <XCircle className="w-8 h-8 text-brand-red-600" />
                  <div>
                    <h2 className="text-xl font-bold text-brand-red-800">Certificate Not Found</h2>
                    <p className="text-brand-red-700">
                      {resp.reason === 'rate_limited'
                        ? 'Too many attempts. Please wait a minute and try again.'
                        : 'We could not find a certificate with the provided ID or code.'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-4">
                  Please check the certificate ID and try again. If you believe this is an error,
                  please contact our support team.
                </p>
                <Link
                  href="/contact"
                  className="text-brand-orange-600 hover:text-brand-orange-700 font-medium"
                >
                  Contact Support →
                </Link>
              </div>
            </>
          )}
        </div>
      )}

      {/* Info Section */}
      {!searched && (
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-brand-blue-900 mb-2">How to Verify</h3>
          <ul className="text-brand-blue-800 space-y-2 text-sm">
            <li>• Enter the certificate ID found on the bottom of the certificate</li>
            <li>• Or scan the QR code on the certificate to auto-fill the verification code</li>
            <li>• Click &ldquo;Verify&rdquo; to check the certificate&apos;s authenticity</li>
          </ul>
        </div>
      )}
    </main>
  );
}
