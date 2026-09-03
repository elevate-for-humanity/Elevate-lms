'use client';

import { AlertCircle, Clock, Share2, Download, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface CredentialShareClientProps {
  token: string;
  validation: {
    status: 'valid' | 'invalid' | 'expired' | 'used';
    shareLink?: any;
    credential?: any;
    errorMessage?: string;
  };
}

export default function CredentialShareClient({
  token,
  validation,
}: CredentialShareClientProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (validation.status === 'valid' && validation.credential) {
    const { credential } = validation;
    const issuedDate = new Date(credential.issued_at || credential.issued_date);
    const expiresDate = credential.expires_at ? new Date(credential.expires_at) : null;

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        {/* Header */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-brand-blue-600 hover:text-brand-blue-700 mb-4"
            >
              ← Back to Elevate For Humanity
            </Link>
            <h1 className="text-3xl font-bold text-slate-900">Digital Credential</h1>
            <p className="text-slate-600 mt-1">Verified credential from Elevate For Humanity</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Success Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-8 flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-emerald-600 inline-block flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h3 className="font-semibold text-emerald-900">Credential Verified</h3>
              <p className="text-sm text-emerald-700 mt-1">
                This credential has been verified and is authentic.
              </p>
            </div>
          </div>

          {/* Credential Card */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-brand-blue-600 to-brand-blue-700 px-8 py-12 text-white">
              <div className="mb-8">
                <p className="text-sm font-medium text-blue-100 mb-2">CREDENTIAL</p>
                <h2 className="text-4xl font-bold">{credential.name}</h2>
                {credential.abbreviation && (
                  <p className="text-lg text-blue-100 mt-2">{credential.abbreviation}</p>
                )}
              </div>

              {credential.issuing_authority && (
                <div className="flex items-center gap-2 text-sm text-blue-100">
                  <span className="inline-block w-2 h-2 bg-blue-300 rounded-full"></span>
                  Issued by {credential.issuing_authority}
                </div>
              )}
            </div>

            <div className="px-8 py-8">
              {/* Credential Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-8">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Issued Date
                  </p>
                  <p className="text-lg font-semibold text-slate-900">
                    {issuedDate.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                {expiresDate && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Expires
                    </p>
                    <p className="text-lg font-semibold text-slate-900">
                      {expiresDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}

                {credential.credential_code && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Code
                    </p>
                    <p className="text-lg font-mono font-semibold text-slate-900 break-all">
                      {credential.credential_code.substring(0, 12)}...
                    </p>
                  </div>
                )}
              </div>

              {credential.description && (
                <div className="mb-8 pb-8 border-b border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    Description
                  </p>
                  <p className="text-slate-700 leading-relaxed">{credential.description}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={copyLink}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-medium rounded-lg transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Share Credential'}
                </button>
                {credential.certificate_url && (
                  <a
                    href={credential.certificate_url}
                    download
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </a>
                )}
                <Link
                  href="/verify"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-red-600 hover:bg-brand-red-700 text-white font-medium rounded-lg transition-colors"
                >
                  View Full Details
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <p className="text-sm text-slate-700">
              <span className="font-semibold text-slate-900">About this credential:</span>{' '}
              Digital credentials from Elevate For Humanity are verified and authentic. This
              credential has been issued as proof of completion and achievement of the specified
              training program.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Invalid Token
  if (validation.status === 'invalid') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Invalid Link</h1>
            <p className="text-slate-600 mb-6">
              {validation.errorMessage ||
                'This credential link is invalid or no longer exists.'}
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/verify"
                className="inline-flex items-center justify-center px-4 py-2.5 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Search Credentials
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-medium rounded-lg transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Expired Token
  if (validation.status === 'expired') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <Clock className="w-12 h-12 text-amber-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Link Expired</h1>
            <p className="text-slate-600 mb-6">
              {validation.errorMessage || 'This credential link has expired.'}
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/verify"
                className="inline-flex items-center justify-center px-4 py-2.5 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Search Credentials
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-medium rounded-lg transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Used (One-Time) Token
  if (validation.status === 'used') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Link Already Used</h1>
            <p className="text-slate-600 mb-6">
              {validation.errorMessage || 'This credential link has already been accessed.'}
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/verify"
                className="inline-flex items-center justify-center px-4 py-2.5 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Search Credentials
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-medium rounded-lg transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}