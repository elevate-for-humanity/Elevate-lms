import { Metadata } from 'next';
import Link from 'next/link';
import { Award, Shield, CheckCircle, FileText, Clock, Globe, Link2, Fingerprint } from 'lucide-react';
import { getAdminUrl } from '@/lib/config/admin-url';

export const metadata: Metadata = {
  title: 'Credential Engine | Digital Certification & Verification',
  description: 'Issue, manage, and verify digital credentials with live status checks and SHA-256 issuance-integrity evidence.',
};

const features = [
  {
    icon: Fingerprint,
    title: 'SHA-256 Integrity Evidence',
    description: 'Each canonical certificate receives issuance-time SHA-256 integrity evidence so later record tampering can be detected.',
  },
  {
    icon: Globe,
    title: 'Public Verification',
    description: 'Certificate numbers can be checked against the live canonical credential registry, including current status and integrity result.',
  },
  {
    icon: Shield,
    title: 'Revocation-Aware Status',
    description: 'Verification returns the current credential status so revoked or pending records are not presented as valid.',
  },
  {
    icon: FileText,
    title: 'Issuance Evidence',
    description: 'Credential records can retain program, completion, funding, exam-session, and issuance snapshot evidence when applicable.',
  },
  {
    icon: Clock,
    title: 'Expiration Tracking',
    description: 'Time-limited credentials can retain an expiration date for downstream verification and renewal workflows.',
  },
  {
    icon: CheckCircle,
    title: 'Canonical Registry',
    description: 'Issuance and verification use the production certificate registry rather than an independent marketing-only credential database.',
  },
];

export default function CredentialEnginePage() {
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-900 via-orange-900 to-red-900 text-white">
        <div className="relative mx-auto max-w-7xl px-4 py-24">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/20 px-4 py-2 text-sm">
              <Award className="h-4 w-4" /> Digital Credential Platform
            </div>
            <h1 className="mb-6 text-5xl font-bold md:text-6xl">Credential Engine</h1>
            <p className="mb-8 text-xl text-slate-200">
              Issue and verify digital credentials through the canonical certificate registry with live status checks and cryptographic integrity evidence.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href={getAdminUrl('/credentials')} className="rounded-lg bg-amber-600 px-8 py-4 font-semibold transition hover:bg-amber-500">
                Manage Credentials
              </a>
              <Link href="/contact" className="rounded-lg border border-white/30 bg-white/10 px-8 py-4 font-semibold transition hover:bg-white/20">
                Request Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold">Verifiable Credential Infrastructure</h2>
            <p className="mx-auto max-w-2xl text-slate-600">
              Public claims on this page map to implemented credential-registry controls. No blockchain or issuance-volume claim is made without corresponding production evidence.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                    <Icon className="h-6 w-6 text-amber-700" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold">{feature.title}</h3>
                  <p className="text-sm text-slate-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Verification Lifecycle</h2>
            <p className="text-slate-600">One evidence chain from issuance through public verification.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <Award className="mx-auto mb-4 h-10 w-10 text-amber-700" />
              <h3 className="mb-2 font-bold">1. Issue</h3>
              <p className="text-sm text-slate-600">An eligible completion produces a canonical certificate record with a unique certificate number.</p>
            </div>
            <div className="text-center">
              <Fingerprint className="mx-auto mb-4 h-10 w-10 text-amber-700" />
              <h3 className="mb-2 font-bold">2. Protect</h3>
              <p className="text-sm text-slate-600">Issuance-time evidence is hashed with SHA-256 and stored separately for later integrity comparison.</p>
            </div>
            <div className="text-center">
              <Link2 className="mx-auto mb-4 h-10 w-10 text-amber-700" />
              <h3 className="mb-2 font-bold">3. Verify</h3>
              <p className="text-sm text-slate-600">The verifier checks the live credential, current status, and stored issuance hash before reporting integrity.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-amber-600 to-orange-600 py-20 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">Issue Verifiable Digital Credentials</h2>
          <p className="mb-8 text-xl text-amber-100">Use live credential status and cryptographic integrity evidence instead of unverifiable marketing claims.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={getAdminUrl('/credentials')} className="rounded-lg bg-white px-8 py-4 font-semibold text-amber-700 hover:bg-amber-50">Manage Credentials</a>
            <Link href="/platform/enterprise" className="rounded-lg border-2 border-white px-8 py-4 font-semibold text-white hover:bg-white/10">Enterprise Solutions</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
