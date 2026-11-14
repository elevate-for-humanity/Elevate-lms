'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Award, ExternalLink, Clock, CheckCircle, ShieldCheck, FileText } from 'lucide-react';

export type CredentialWalletItem = {
  id: string;
  name: string;
  description: string;
  issuer: string;
  issuerType: string;
  issuedAt: string | null;
  expiresAt: string | null;
  verificationCode: string | null;
  status: string;
  badgeUrl: string | null;
  certificateUrl: string | null;
  openBadgeStatus: string;
  openBadgeCredentialUrl: string | null;
  openBadgeProofType: string | null;
};

function formatDate(value: string | null) {
  if (!value) return 'No expiration';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function statusLabel(status: string) {
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
}

export default function CredentialsClient({ credentials }: { credentials: CredentialWalletItem[] }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Breadcrumbs items={[{ label: 'My Credentials' }]} />

      <section className="border-b border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4">
          <div>
            <h1 className="text-2xl font-bold text-black">My Credentials</h1>
            <p className="mt-1 text-slate-600">
              Your verified certificates, external credentials, and Elevate digital badges.
            </p>
          </div>
          <Award className="h-12 w-12 text-brand-blue-600" />
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-black">Credential Wallet</h2>
            <span className="text-sm text-slate-500">
              {credentials.length} credential{credentials.length === 1 ? '' : 's'}
            </span>
          </div>

          {credentials.length ? (
            <div className="space-y-4">
              {credentials.map((cred) => {
                const isNativeBadge = cred.openBadgeStatus === 'issued';
                const pendingSignature = cred.openBadgeStatus === 'pending';
                const verifyHref = cred.verificationCode
                  ? `https://www.elevateforhumanity.org/credentials/verify/${encodeURIComponent(cred.verificationCode)}`
                  : null;

                return (
                  <article key={cred.id} className="rounded-xl border border-slate-200 bg-white p-6">
                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-green-100">
                          {cred.badgeUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={cred.badgeUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Award className="h-7 w-7 text-brand-green-700" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold text-black">{cred.name}</h3>
                            <span className="inline-flex items-center gap-1 rounded-full bg-brand-green-100 px-2 py-0.5 text-xs font-medium text-brand-green-800">
                              <CheckCircle className="h-3 w-3" />
                              {statusLabel(cred.status)}
                            </span>
                            {isNativeBadge && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-800">
                                <ShieldCheck className="h-3 w-3" />
                                Open Badge 3.0
                              </span>
                            )}
                            {pendingSignature && (
                              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                                Badge signing pending
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-sm text-slate-600">Issued by: {cred.issuer}</p>
                          {cred.description && (
                            <p className="mt-2 max-w-2xl text-sm text-slate-600">{cred.description}</p>
                          )}
                          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-500">
                            <span>Issued: {formatDate(cred.issuedAt)}</span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Expires: {formatDate(cred.expiresAt)}
                            </span>
                          </div>
                          {cred.verificationCode && (
                            <p className="mt-2 text-xs text-slate-400">
                              Verification ID: {cred.verificationCode}
                            </p>
                          )}
                          {cred.openBadgeProofType && (
                            <p className="mt-1 text-xs text-slate-400">
                              Proof: {cred.openBadgeProofType}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 md:justify-end">
                        {cred.certificateUrl && (
                          <a
                            href={cred.certificateUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <FileText className="h-4 w-4" />
                            Certificate
                          </a>
                        )}
                        {cred.openBadgeCredentialUrl && (
                          <a
                            href={cred.openBadgeCredentialUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <ShieldCheck className="h-4 w-4" />
                            Badge JSON
                          </a>
                        )}
                        {verifyHref && (
                          <a
                            href={verifyHref}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg bg-brand-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue-700"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Verify
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
              <Award className="mx-auto mb-4 h-16 w-16 text-slate-300" />
              <h3 className="mb-2 text-lg font-bold text-slate-700">No credentials yet</h3>
              <p className="mb-4 text-slate-500">
                Credentials appear here after they are issued and recorded in your learner profile.
              </p>
              <Link
                href="/programs"
                className="inline-block rounded-lg bg-brand-blue-600 px-4 py-2 font-semibold text-white hover:bg-brand-blue-700"
              >
                View programs
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
