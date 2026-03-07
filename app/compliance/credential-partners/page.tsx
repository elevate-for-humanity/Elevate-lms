import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
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

const CREDENTIAL_PARTNERS = [
  {
    program: 'Phlebotomy Technician',
    partnerType: 'National Certifying Body',
    licensingBody: 'National Healthcareer Association (NHA)',
    programAssignment: 'Certified Phlebotomy Technician (CPT) exam',
    mouStatus: 'MOU Required — in process',
    credentialIssued: 'CPT — Certified Phlebotomy Technician',
    credentialIssuer: 'NHA (National Healthcareer Association)',
    licenseStatus: 'Self-Pay · Not ETPL Listed',
    instructorReq: 'Phlebotomist with 2+ years clinical experience; CPT or equivalent credential',
    notes: 'Program is not currently on the WorkOne/ETPL funded list. Self-pay with BNPL options. NHA exam fee ~$135. Students register directly with NHA for exam.',
  },
  {
    program: 'Medical Assistant',
    partnerType: 'National Certifying Body',
    licensingBody: 'National Healthcareer Association (NHA)',
    programAssignment: 'Certified Clinical Medical Assistant (CCMA) exam',
    mouStatus: 'Active',
    credentialIssued: 'CCMA — Certified Clinical Medical Assistant',
    credentialIssuer: 'NHA (National Healthcareer Association)',
    licenseStatus: 'WIOA / WRG Eligible',
    instructorReq: 'Credentialed Medical Assistant or RN with clinical teaching experience',
    notes: 'NHA exam fee ~$155. Students register through Elevate enrollment process.',
  },
  {
    program: 'CNA — Certified Nursing Assistant',
    partnerType: 'State Licensing Board',
    licensingBody: 'Indiana State Department of Health (ISDH)',
    programAssignment: 'Indiana CNA Competency Exam (written + skills)',
    mouStatus: 'Active',
    credentialIssued: 'Indiana CNA Certification',
    credentialIssuer: 'Indiana State Department of Health',
    licenseStatus: 'WIOA / WRG Eligible',
    instructorReq: 'RN with 2+ years nursing experience; state-approved CNA instructor',
    notes: 'Exam administered by Pearson VUE. Fee ~$115. Clinical hours completed at approved healthcare facility.',
  },
  {
    program: 'Barber Apprenticeship',
    partnerType: 'State Licensing Board',
    licensingBody: 'Indiana Professional Licensing Agency (IPLA)',
    programAssignment: 'Indiana Barber License — PSI exam',
    mouStatus: 'Active',
    credentialIssued: 'Indiana Barber License',
    credentialIssuer: 'Indiana IPLA',
    licenseStatus: 'DOL Registered Apprenticeship',
    instructorReq: 'Licensed Indiana Barber with 5+ years experience; registered apprenticeship sponsor',
    notes: 'DOL Registered Apprenticeship. PSI exam fee ~$75. Apprentices earn wages during training.',
  },
  {
    program: 'HVAC / Building Technician',
    partnerType: 'Federal Certifying Body',
    licensingBody: 'U.S. Environmental Protection Agency (EPA)',
    programAssignment: 'EPA 608 Universal Certification',
    mouStatus: 'Active',
    credentialIssued: 'EPA 608 Universal Certificate',
    credentialIssuer: 'EPA-approved testing organization',
    licenseStatus: 'WIOA / WRG Eligible',
    instructorReq: 'EPA 608 Universal certified technician with 3+ years field experience',
    notes: 'EPA 608 exam fee ~$150. NCCER credentials also available for advanced students.',
  },
  {
    program: 'CDL — Commercial Driver License',
    partnerType: 'State Licensing Agency',
    licensingBody: 'Indiana Bureau of Motor Vehicles (BMV)',
    programAssignment: 'Indiana CDL Class A Skills and Knowledge Test',
    mouStatus: 'Active',
    credentialIssued: 'Indiana CDL Class A License',
    credentialIssuer: 'Indiana BMV',
    licenseStatus: 'WIOA / WRG Eligible',
    instructorReq: 'CDL-A holder with 3+ years commercial driving; state-approved CDL instructor',
    notes: 'BMV skills test fee ~$50. DOT physical and drug screen required prior to enrollment.',
  },
];

export default function CredentialPartnersPage() {

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
      <section className="relative h-[240px] sm:h-[300px] overflow-hidden">
        <Image
          src="/images/pages/credential-partners-hero.jpg"
          alt="Credential partners and training providers"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
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
              <p className="text-2xl font-bold text-brand-blue-600">6</p>
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
              <p className="text-2xl font-bold text-brand-blue-600">6</p>
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
