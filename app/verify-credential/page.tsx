'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Search,
  XCircle,
  AlertTriangle,
  Shield,
CheckCircle, } from 'lucide-react';



export default function VerifyCredentialPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/credentials/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Verification failed');
        return;
      }

      setResult(data);
    } catch (err) {
      setError('Failed to verify credential. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Simple Header - No Hero */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-brand-blue-600" />
            <h1 className="text-3xl font-semibold text-black">
              Verify Credential
            </h1>
          </div>
          <p className="text-base text-black">
            Confirm the authenticity of a credential or certificate
          </p>
        </div>
      </section>

      {/* Verification Form */}
      <section className="py-16">
        <div className="max-w-2xl mx-auto px-6">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <label
                  htmlFor="code"
                  className="block text-lg font-semibold text-black mb-2"
                >
                  Credential Code
                </label>
                <p className="text-sm text-black mb-4">
                  Enter the credential code found on the certificate or
                  credential document.
                </p>
                <div className="relative">
                  <input
                    type="text"
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="crd_XXXXXXXXXXXXXXXXXXXX"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-brand-blue-500 focus:outline-none text-lg font-mono"
                    required
                  />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !code.trim()}
                className="w-full bg-brand-blue-600 text-white py-3 px-6 rounded-lg font-semibold text-lg hover:bg-brand-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Verifying...' : 'Verify Credential'}
              </button>
            </form>

            {/* Error Message */}
            {error && (
              <div className="mt-6 p-4 bg-brand-red-50 border-l-4 border-brand-red-500 rounded">
                <div className="flex items-start gap-3">
                  <XCircle className="w-6 h-6 text-brand-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-brand-red-900">
                      Verification Failed
                    </h3>
                    <p className="text-brand-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Success Result */}
            {result && result.valid && (
              <div className="mt-6 p-6 bg-brand-green-50 border-2 border-brand-green-500 rounded-lg">
                <div className="flex items-start gap-4">
                  <span className="text-slate-500 flex-shrink-0">•</span>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-brand-green-900 mb-4">
                      • Valid Credential
                    </h3>

                    <div className="space-y-3">
                      <div>
                        <div className="text-sm font-semibold text-black">
                          Credential Type
                        </div>
                        <div className="text-lg text-black">
                          {result.credential.type}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-semibold text-black">
                          Issued To
                        </div>
                        <div className="text-lg text-black">
                          {result.credential.student.first_name}{' '}
                          {result.credential.student.last_initial ||
                            result.credential.student.last_name}
                        </div>
                      </div>

                      {result.credential.program && (
                        <div>
                          <div className="text-sm font-semibold text-black">
                            Program
                          </div>
                          <div className="text-lg text-black">
                            {result.credential.program.title}
                          </div>
                        </div>
                      )}

                      <div>
                        <div className="text-sm font-semibold text-black">
                          Issued Date
                        </div>
                        <div className="text-lg text-black">
                          {new Date(
                            result.credential.issued_at
                          ).toLocaleDateString()}
                        </div>
                      </div>

                      {result.credential.expires_at && (
                        <div>
                          <div className="text-sm font-semibold text-black">
                            Expires
                          </div>
                          <div className="text-lg text-black">
                            {new Date(
                              result.credential.expires_at
                            ).toLocaleDateString()}
                          </div>
                        </div>
                      )}

                      <div className="pt-4 border-t border-brand-green-200">
                        <div className="text-sm text-black">
                          This credential has been verified as authentic and is
                          currently valid.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Invalid/Revoked/Expired Result */}
            {result && !result.valid && (
              <div className="mt-6 p-6 bg-brand-red-50 border-2 border-brand-red-500 rounded-lg">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="w-8 h-8 text-brand-red-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-brand-red-900 mb-4">
                      ✗ Invalid Credential
                    </h3>

                    <div className="space-y-3">
                      <div>
                        <div className="text-sm font-semibold text-black">
                          Status
                        </div>
                        <div className="text-lg text-brand-red-900 font-semibold uppercase">
                          {result.status}
                        </div>
                      </div>

                      {result.credential?.revoked_reason && (
                        <div>
                          <div className="text-sm font-semibold text-black">
                            Reason
                          </div>
                          <div className="text-lg text-black">
                            {result.credential.revoked_reason}
                          </div>
                        </div>
                      )}

                      <div className="pt-4 border-t border-brand-red-200">
                        <div className="text-sm text-black">
                          This credential is not currently valid. Please contact
                          the issuing organization for more information.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="mt-12 bg-brand-blue-50 rounded-lg p-6">
            <h2 className="text-xl font-bold text-black mb-4">
              About Credential Verification
            </h2>
            <div className="space-y-3 text-black">
              <p>
                This verification system allows employers, partners, and other
                organizations to confirm the authenticity of credentials issued
                by Elevate for Humanity.
              </p>
              <p>
                Each credential has a unique code that can be verified at any
                time. The system will show:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Whether the credential is valid, expired, or revoked</li>
                <li>The type of credential and program</li>
                <li>When it was issued and when it expires</li>
                <li>The name of the credential holder</li>
              </ul>
              <p className="text-sm text-black mt-4">
                For privacy protection, only minimal information is displayed
                publicly. Authenticated partners can view additional details.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
