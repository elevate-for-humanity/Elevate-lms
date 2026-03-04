export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  Shield,
  GraduationCap,
  Building2,
  Award,
  FileCheck,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Credential Partner Registry | Compliance | Elevate for Humanity',
  description:
    'Formal registry of credential partners, license status, program assignments, credential issuance, and MOU status for Elevate for Humanity workforce training programs.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/compliance/credential-partners',
  },
};

/* ── Credential Partner Registry Data ── */

export default async function CredentialPartnersPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const { data: dbRows } = await db.from('compliance_audits').select('*').limit(50);
const CREDENTIAL_PARTNERS = (dbRows as any[]) || [];

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Compliance', href: '/compliance' },
            { label: 'Credential Partner Registry' },
          ]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[240px] sm:h-[300px]">
        <Image
          src="/images/pages/credential-partners-hero.jpg"
          alt="Credential partners and training providers"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
          <div className="max-w-6xl mx-auto">
            <p className="text-white/80 text-sm font-medium uppercase tracking-wider mb-2">
              Compliance Registry
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Credential Partner Registry
            </h1>
          </div>
        </div>
      </section>

      {/* Purpose */}
      <section className="py-10 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="border-l-4 border-brand-blue-600 pl-6 mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Registry Purpose</h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              This registry documents the credential partners authorized to deliver Related
              Technical Instruction (RTI) for each Elevate program. When a workforce agency,
              ETPL reviewer, or partner asks &ldquo;Who delivers RTI?&rdquo; — this single
              document provides the answer. Specific provider names are maintained in internal
              compliance files and disclosed to authorized reviewers upon request.
            </p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-brand-blue-600">{CREDENTIAL_PARTNERS.length}</p>
              <p className="text-xs text-gray-600 mt-1">Programs Covered</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-brand-blue-600">100%</p>
              <p className="text-xs text-gray-600 mt-1">MOU Required</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-brand-blue-600">100%</p>
              <p className="text-xs text-gray-600 mt-1">State/Federal Approved</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-brand-blue-600">8</p>
              <p className="text-xs text-gray-600 mt-1">Credential Types</p>
            </div>
          </div>
        </div>
      </section>

      {/* Registry Cards */}
      <section className="py-10 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Per-Program Credential Partners</h2>

          <div className="space-y-6">
            {CREDENTIAL_PARTNERS.map((partner, i) => (
              <div key={i} className="bg-white rounded-xl border overflow-hidden">
                <div className="bg-brand-blue-600 px-6 py-3 flex items-center justify-between">
                  <h3 className="font-bold text-white">{partner.program}</h3>
                  <span className="text-xs text-brand-blue-100 bg-brand-blue-700 px-2 py-0.5 rounded">
                    {partner.licenseStatus}
                  </span>
                </div>

                <div className="p-6">
                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Partner Type</p>
                      <p className="text-sm text-gray-900 font-medium">{partner.partnerType}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Licensing Body</p>
                      <p className="text-sm text-gray-700">{partner.licensingBody}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Program Assignment</p>
                      <p className="text-sm text-gray-700">{partner.programAssignment}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">MOU Status</p>
                      <p className="text-sm text-brand-green-700 font-medium flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> {partner.mouStatus}
                      </p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Credential Issued</p>
                      <p className="text-sm text-gray-900 font-medium">{partner.credentialIssued}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Issued by: {partner.credentialIssuer}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Instructor Requirements</p>
                      <p className="text-sm text-gray-700">{partner.instructorReq}</p>
                    </div>
                  </div>

                  {partner.notes && (
                    <div className="bg-slate-50 rounded-lg p-3 mt-3">
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Note:</span> {partner.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclosure */}
      <section className="py-10 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Disclosure & Verification</h3>
                <p className="text-sm text-gray-700 mb-2">
                  This public registry documents the structural framework and provider type
                  requirements for each program. Specific provider names, MOU documents, and
                  instructor credential files are maintained in internal compliance records.
                </p>
                <p className="text-sm text-gray-700">
                  Authorized reviewers (ETPL, DWD, DOL, workforce boards, grant evaluators)
                  may request full provider documentation by contacting Elevate for Humanity
                  directly. Verification requests are processed within 5 business days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="py-10 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-wrap gap-3">
            <Link href="/compliance/apprenticeship-structure" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700 transition">
              Apprenticeship & RTI Structure
            </Link>
            <Link href="/instructional-framework" className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
              Instructional Framework
            </Link>
            <Link href="/instructor-credentials" className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
              Instructor Credentials
            </Link>
            <Link href="/compliance/workforce-partnership-packet" className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
              Workforce Partnership Packet
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
