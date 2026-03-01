import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Award, Shield, FileCheck, Briefcase } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Credentials & Certifications | Elevate for Humanity',
  description: 'Credentials earned through Elevate for Humanity programs: internal certificates of completion, industry certifications via partner testing bodies, and registered apprenticeship credentials.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/credentials' },
};

/* ------------------------------------------------------------------ */
/*  Layer 1 — Certificates of Completion (Elevate-issued)              */
/* ------------------------------------------------------------------ */
const completionCerts = [
  { name: 'Entrepreneurship', desc: 'Business plan development, entity formation, marketing, and financial management.' },
  { name: 'Bookkeeping & QuickBooks', desc: 'Double-entry bookkeeping, financial statements, and QuickBooks Online proficiency.' },
  { name: 'Business Administration', desc: 'Microsoft Office, business communication, project management, and professional development.' },
  { name: 'Tax Preparation', desc: 'Individual tax return preparation, IRS compliance, and tax software proficiency.' },
  { name: 'Sanitation & Infection Control', desc: 'Disinfection procedures, bloodborne pathogen safety, and regulatory compliance.' },
  { name: 'Micro Programs', desc: 'Short-term stackable credentials in safety, digital literacy, and professional development.' },
];

/* ------------------------------------------------------------------ */
/*  Layer 2 — Industry Certifications (external testing bodies)        */
/* ------------------------------------------------------------------ */
const industryCerts = [
  { name: 'OSHA 10 / OSHA 30', issuer: 'U.S. Department of Labor', field: 'Construction & Trades', desc: 'Workplace safety certification. DOL-issued card upon completion.' },
  { name: 'CPR/AED/First Aid', issuer: 'AHA / Health & Safety Institute', field: 'Healthcare & General', desc: 'Same-day certification. Valid 2 years. Required for healthcare, childcare, and many trades.' },
  { name: 'CNA (Certified Nursing Assistant)', issuer: 'Indiana State Dept. of Health', field: 'Healthcare', desc: 'State-certified credential for patient care. Requires state competency exam.' },
  { name: 'CDL Class A License', issuer: 'Indiana BMV', field: 'Transportation', desc: 'Commercial driver license. Requires pre-trip, skills, and road test administered by the state.' },
  { name: 'EPA Section 608', issuer: 'EPA (via ESCO Institute or Mainstream Engineering)', field: 'HVAC', desc: 'Required by federal law to handle refrigerants. Proctored on-site by our EPA 608 Certified Proctor through EPA-approved certifying organizations (ESCO Institute and Mainstream Engineering). Certification is issued by the certifying organization. Retest policies vary by provider. Does not expire.' },
  { name: 'QuickBooks Certified User', issuer: 'Certiport / Intuit', field: 'Business', desc: 'Vendor certification exam administered through Certiport testing centers.' },
  { name: 'IT Specialist', issuer: 'Certiport', field: 'Business / Technology', desc: 'Vendor certification in business applications, administered through Certiport.' },
  { name: 'CompTIA A+', issuer: 'CompTIA', field: 'Technology', desc: 'Industry-standard IT support certification. Proctored exam through CompTIA testing network.' },
  { name: 'CompTIA Security+', issuer: 'CompTIA', field: 'Cybersecurity', desc: 'Baseline cybersecurity certification. Proctored exam through CompTIA testing network.' },
  { name: 'ServSafe Food Handler', issuer: 'National Restaurant Association', field: 'Culinary / Food Service', desc: 'Food safety certification. Valid 5 years. NRA-administered exam.' },
  { name: 'NCCER Core', issuer: 'NCCER', field: 'Construction', desc: 'Foundational construction skills credential. NCCER-administered assessment.' },
  { name: 'Phlebotomy Technician (CPT)', issuer: 'NHA', field: 'Healthcare', desc: 'National certification for blood draw and specimen collection. NHA-proctored exam.' },
  { name: 'Medical Assistant (CCMA)', issuer: 'NHA', field: 'Healthcare', desc: 'Clinical and administrative medical assisting. NHA-proctored exam.' },
  { name: 'Indiana CPRS', issuer: 'Indiana DMHA', field: 'Behavioral Health', desc: 'State credential for peer recovery specialists. Requires supervised practicum hours and state application.' },
  { name: 'IRS PTIN', issuer: 'IRS', field: 'Tax Preparation', desc: 'Preparer Tax Identification Number. Self-registered with the IRS — required to prepare federal returns for compensation.' },
];

/* ------------------------------------------------------------------ */
/*  Layer 3 — Registered Apprenticeship Credentials                    */
/* ------------------------------------------------------------------ */
const apprenticeshipCreds = [
  { name: 'Barber License', issuer: 'Indiana Professional Licensing Agency', field: 'Cosmetology', desc: 'State barber license earned through DOL Registered Apprenticeship. Requires 1,500 OJT hours under employer supervision, competency verification, and state board exam. RAPIDS: 2025-IN-132301.' },
];

export default function CredentialsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Credentials' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[300px] sm:h-[380px] overflow-hidden">
        <Image src="/images/hero/hero-certifications.jpg" alt="Industry certifications and training credentials" fill className="object-cover" priority sizes="100vw" />
      </section>

      {/* Intro — 3-layer explanation */}
      <section className="py-14 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Credentials at Elevate</h1>
          <p className="text-slate-600 text-lg leading-relaxed max-w-3xl mx-auto">
            Elevate for Humanity issues internal certificates of completion for programs we deliver directly.
            Industry certifications are administered by external testing bodies — we prepare you for the exam, but the credential is issued by the certifying organization.
            Registered Apprenticeship credentials require documented OJT hours with employer partners and are the highest-authority credentials we support.
          </p>
        </div>
      </section>

      {/* Layer 1 — Completion Certificates */}
      <section className="py-14 sm:py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <FileCheck className="w-6 h-6 text-brand-blue-600" />
            <p className="text-brand-blue-600 font-semibold text-sm uppercase tracking-wider">Layer 1</p>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Certificates of Completion</h2>
          <p className="text-slate-500 mb-8 max-w-2xl">Issued by Elevate for Humanity (2Exclusive LLC-S d/b/a Elevate for Humanity Career &amp; Technical Institute). We design the curriculum, deliver training, assess learners, and issue the certificate.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {completionCerts.map((cred) => (
              <div key={cred.name} className="bg-white rounded-xl p-5 border border-slate-200">
                <h3 className="font-bold text-slate-900">{cred.name}</h3>
                <p className="text-slate-500 text-sm mt-1">{cred.desc}</p>
                <span className="inline-block mt-3 text-xs font-semibold text-brand-blue-600 bg-brand-blue-50 px-2.5 py-1 rounded-full">Elevate-issued</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Layer 2 — Industry Certifications */}
      <section className="py-14 sm:py-20 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-6 h-6 text-brand-green-600" />
            <p className="text-brand-green-600 font-semibold text-sm uppercase tracking-wider">Layer 2</p>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Industry Certifications</h2>
          <p className="text-slate-500 mb-8 max-w-2xl">Issued by external certifying bodies. Elevate prepares you for the exam — the credential is awarded by the organization listed below. Exam fees may be covered by WIOA or other funding for eligible participants.</p>
          <div className="grid sm:grid-cols-2 gap-5">
            {industryCerts.map((cred) => (
              <div key={cred.name} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition">
                <div className="flex items-start gap-4">
                  <Award className="w-7 h-7 text-brand-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{cred.name}</h3>
                    <p className="text-sm text-brand-green-700 font-medium">Issued by {cred.issuer}</p>
                    <p className="text-xs text-slate-400 mb-2">{cred.field}</p>
                    <p className="text-slate-600 text-sm">{cred.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Layer 3 — Registered Apprenticeship */}
      <section className="py-14 sm:py-20 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <Briefcase className="w-6 h-6 text-amber-400" />
            <p className="text-amber-400 font-semibold text-sm uppercase tracking-wider">Layer 3</p>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Registered Apprenticeship Credentials</h2>
          <p className="text-slate-400 mb-8 max-w-2xl">The highest-authority credentials. These require documented OJT hours with employer training sites, competency verification by supervising employers, and sponsor oversight. Elevate for Humanity is a DOL Registered Apprenticeship Sponsor (RAPIDS: 2025-IN-132301).</p>
          <div className="grid gap-5">
            {apprenticeshipCreds.map((cred) => (
              <div key={cred.name} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <div className="flex items-start gap-4">
                  <Briefcase className="w-7 h-7 text-amber-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-white text-lg">{cred.name}</h3>
                    <p className="text-sm text-amber-400 font-medium">Issued by {cred.issuer}</p>
                    <p className="text-xs text-slate-500 mb-2">{cred.field}</p>
                    <p className="text-slate-300 text-sm">{cred.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-slate-500 text-sm mt-6">Additional apprenticeship programs (culinary, diesel) are in development pending employer partner agreements.</p>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-10 bg-amber-50 border-t border-amber-200">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-amber-800 text-sm leading-relaxed">
            <strong>Credential Disclosure:</strong> Elevate for Humanity is not an accredited college or university. Certificates of completion are issued by 2Exclusive LLC-S d/b/a Elevate for Humanity Career &amp; Technical Institute. Industry certifications listed above are issued by their respective certifying bodies — Elevate provides exam preparation training. Registered Apprenticeship credentials require employer-validated OJT hours and are governed by DOL standards. Funding eligibility (WIOA, WRG, JRI) is determined by your local WorkOne office and is not guaranteed.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-brand-red-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Shield className="w-10 h-10 text-white/80 mx-auto mb-4" />
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Start Earning Credentials</h2>
          <p className="text-xl text-white/90 mb-10">Training may be funded for eligible Indiana residents.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/apply/student" className="bg-white text-brand-red-600 px-10 py-5 rounded-full font-bold text-xl hover:bg-slate-50 transition hover:scale-105 shadow-lg">Apply Now</Link>
            <Link href="/programs" className="border-2 border-white text-white px-10 py-5 rounded-full font-bold text-xl hover:bg-white/10 transition">View Programs</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
