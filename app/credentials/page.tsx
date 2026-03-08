import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Award, FileCheck, Briefcase, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Credentials & Certifications | Elevate for Humanity',
  description: 'Credentials earned through Elevate for Humanity: completion certificates, industry certifications via external testing bodies, and DOL Registered Apprenticeship credentials.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/credentials' },
};

const completionCerts = [
  { name: 'Entrepreneurship', desc: 'Business plan development, entity formation, marketing, and financial management.', img: '/images/pages/business-sector.jpg' },
  { name: 'Bookkeeping & QuickBooks', desc: 'Double-entry bookkeeping, financial statements, and QuickBooks Online proficiency.', img: '/images/pages/certifications-page-1.jpg' },
  { name: 'Business Administration', desc: 'Microsoft Office, business communication, project management, and professional development.', img: '/images/pages/career-services-page-1.jpg' },
  { name: 'Tax Preparation', desc: 'Individual tax return preparation, IRS compliance, and tax software proficiency.', img: '/images/pages/courses-page-1.jpg' },
  { name: 'Sanitation & Infection Control', desc: 'Disinfection procedures, bloodborne pathogen safety, and regulatory compliance.', img: '/images/pages/cna-nursing.jpg' },
  { name: 'Micro Programs', desc: 'Short-term stackable credentials in safety, digital literacy, and professional development.', img: '/images/pages/certifications.jpg' },
];

const industryCerts = [
  { name: 'OSHA 10 / OSHA 30', issuer: 'U.S. Department of Labor', field: 'Construction & Trades', desc: 'Workplace safety certification. DOL-issued card upon completion.', img: '/images/pages/electrical.jpg' },
  { name: 'CPR / AED / First Aid', issuer: 'AHA / Health & Safety Institute', field: 'Healthcare & General', desc: 'Same-day certification. Valid 2 years. Required for healthcare, childcare, and many trades.', img: '/images/pages/cna-nursing.jpg' },
  { name: 'CNA (Certified Nursing Assistant)', issuer: 'Indiana State Dept. of Health', field: 'Healthcare', desc: 'State-certified credential for patient care. Requires state competency exam.', img: '/images/pages/healthcare-sector.jpg' },
  { name: 'CDL Class A License', issuer: 'Indiana BMV', field: 'Transportation', desc: 'Commercial driver license. Requires pre-trip, skills, and road test administered by the state.', img: '/images/pages/cdl-training.jpg' },
  { name: 'EPA Section 608', issuer: 'ESCO Institute / Mainstream Engineering', field: 'HVAC', desc: 'Required by federal law to handle refrigerants. Proctored on-site at our authorized testing center. Does not expire.', img: '/images/pages/hvac-technician.jpg' },
  { name: 'QuickBooks Certified User', issuer: 'Certiport / Intuit', field: 'Business', desc: 'Vendor certification exam administered through Certiport testing centers.', img: '/images/pages/business-sector.jpg' },
  { name: 'IT Specialist', issuer: 'Certiport', field: 'Technology', desc: 'Vendor certification in business applications, administered through Certiport.', img: '/images/pages/cybersecurity.jpg' },
  { name: 'CompTIA A+', issuer: 'CompTIA', field: 'Technology', desc: 'Industry-standard IT support certification. Proctored exam through CompTIA testing network.', img: '/images/pages/it-help-desk.jpg' },
  { name: 'CompTIA Security+', issuer: 'CompTIA', field: 'Cybersecurity', desc: 'Baseline cybersecurity certification. Proctored exam through CompTIA testing network.', img: '/images/pages/cybersecurity.jpg' },
  { name: 'ServSafe Food Handler', issuer: 'National Restaurant Association', field: 'Culinary / Food Service', desc: 'Food safety certification. Valid 5 years. NRA-administered exam.', img: '/images/pages/culinary.jpg' },
  { name: 'NCCER Core', issuer: 'NCCER', field: 'Construction', desc: 'Foundational construction skills credential. NCCER-administered assessment.', img: '/images/pages/skilled-trades-sector.jpg' },
  { name: 'Phlebotomy Technician (CPT)', issuer: 'NHA', field: 'Healthcare', desc: 'National certification for blood draw and specimen collection. NHA-proctored exam.', img: '/images/pages/phlebotomy.jpg' },
  { name: 'Medical Assistant (CCMA)', issuer: 'NHA', field: 'Healthcare', desc: 'Clinical and administrative medical assisting. NHA-proctored exam.', img: '/images/pages/medical-assistant.jpg' },
  { name: 'Indiana CPRS', issuer: 'Indiana DMHA', field: 'Behavioral Health', desc: 'State credential for peer recovery specialists. Requires supervised practicum hours and state application.', img: '/images/pages/career-services-page-1.jpg' },
  { name: 'IRS PTIN', issuer: 'IRS', field: 'Tax Preparation', desc: 'Preparer Tax Identification Number. Required to prepare federal returns for compensation.', img: '/images/pages/certifications-page-1.jpg' },
];

const apprenticeshipCreds = [
  { name: 'Barber License', issuer: 'Indiana Professional Licensing Agency', field: 'Cosmetology', desc: 'State barber license earned through DOL Registered Apprenticeship. Requires 1,500 OJT hours under employer supervision, competency verification, and state board exam. RAPIDS: 2025-IN-132301.', img: '/images/pages/barber-hero-main.jpg' },
];

export default function CredentialsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Credentials' }]} />
        </div>
      </div>

      {/* Video hero */}
      <section className="relative h-[300px] sm:h-[420px] overflow-hidden bg-slate-900">
        <video autoPlay muted loop playsInline poster="/images/pages/credentials-page-1.jpg"
          className="absolute inset-0 w-full h-full object-cover opacity-60">
          <source src="/videos/programs-overview-video-with-narration.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
      </section>

      {/* Page header */}
      <div className="bg-white border-b border-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">Credential Pathways</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">Credentials at Elevate</h1>
          <p className="text-slate-500 text-base sm:text-lg max-w-3xl leading-relaxed">
            Three layers of credentials — internal certificates we issue, industry certifications awarded by external testing bodies, and DOL Registered Apprenticeship credentials backed by employer-verified OJT hours.
          </p>
        </div>
      </div>

      {/* Layer nav */}
      <div className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap gap-3">
          {[
            { label: 'Layer 1 — Completion Certificates', href: '#layer-1', icon: FileCheck, color: 'text-brand-blue-600' },
            { label: 'Layer 2 — Industry Certifications', href: '#layer-2', icon: Award, color: 'text-emerald-600' },
            { label: 'Layer 3 — Apprenticeship', href: '#layer-3', icon: Briefcase, color: 'text-amber-600' },
          ].map(({ label, href, icon: Icon, color }) => (
            <a key={href} href={href} className={`inline-flex items-center gap-2 text-sm font-semibold ${color} hover:underline`}>
              <Icon className="w-4 h-4" />{label}
            </a>
          ))}
        </div>
      </div>

      {/* Layer 1 — Completion Certificates */}
      <section id="layer-1" className="py-14 bg-slate-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 mb-1">
            <FileCheck className="w-5 h-5 text-brand-blue-600" />
            <p className="text-brand-blue-600 font-bold text-xs uppercase tracking-widest">Layer 1</p>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">Certificates of Completion</h2>
          <p className="text-slate-500 text-sm mb-8 max-w-2xl">
            Issued by Elevate for Humanity (2Exclusive LLC-S d/b/a Elevate for Humanity Career & Technical Institute). We design the curriculum, deliver training, assess learners, and issue the certificate.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {completionCerts.map((cred) => (
              <div key={cred.name} className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
                <div className="relative h-36 overflow-hidden">
                  <Image src={cred.img} alt={cred.name} fill sizes="400px" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="font-bold text-white text-sm leading-tight">{cred.name}</h3>
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <p className="text-slate-500 text-xs leading-relaxed flex-1">{cred.desc}</p>
                  <span className="inline-block mt-3 text-[10px] font-bold text-brand-blue-700 bg-brand-blue-50 border border-brand-blue-100 px-2.5 py-1 rounded-full self-start">Elevate-issued</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Layer 2 — Industry Certifications */}
      <section id="layer-2" className="py-14 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 mb-1">
            <Award className="w-5 h-5 text-emerald-600" />
            <p className="text-emerald-600 font-bold text-xs uppercase tracking-widest">Layer 2</p>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">Industry Certifications</h2>
          <p className="text-slate-500 text-sm mb-8 max-w-2xl">
            Issued by external certifying bodies. Elevate prepares you for the exam — the credential is awarded by the organization listed. Exam fees may be covered by WIOA or other funding for eligible participants.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {industryCerts.map((cred) => (
              <div key={cred.name} className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
                <div className="relative h-36 overflow-hidden">
                  <Image src={cred.img} alt={cred.name} fill sizes="400px" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/75 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <p className="text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-0.5">{cred.field}</p>
                    <h3 className="font-bold text-white text-sm leading-tight">{cred.name}</h3>
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <p className="text-emerald-700 text-xs font-semibold mb-1">Issued by {cred.issuer}</p>
                  <p className="text-slate-500 text-xs leading-relaxed flex-1">{cred.desc}</p>
                  <span className="inline-block mt-3 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full self-start">External credential</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Layer 3 — Registered Apprenticeship */}
      <section id="layer-3" className="py-14 bg-slate-900 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 mb-1">
            <Briefcase className="w-5 h-5 text-amber-400" />
            <p className="text-amber-400 font-bold text-xs uppercase tracking-widest">Layer 3</p>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Registered Apprenticeship Credentials</h2>
          <p className="text-slate-400 text-sm mb-8 max-w-2xl">
            The highest-authority credentials. Require documented OJT hours with employer training sites, competency verification by supervising employers, and DOL sponsor oversight. Elevate for Humanity is a DOL Registered Apprenticeship Sponsor (RAPIDS: 2025-IN-132301).
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {apprenticeshipCreds.map((cred) => (
              <div key={cred.name} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden flex flex-col">
                <div className="relative h-44 overflow-hidden">
                  <Image src={cred.img} alt={cred.name} fill sizes="400px" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <p className="text-amber-300 text-[10px] font-bold uppercase tracking-wider mb-0.5">{cred.field}</p>
                    <h3 className="font-bold text-white text-sm leading-tight">{cred.name}</h3>
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <p className="text-amber-400 text-xs font-semibold mb-1">Issued by {cred.issuer}</p>
                  <p className="text-slate-300 text-xs leading-relaxed flex-1">{cred.desc}</p>
                  <span className="inline-block mt-3 text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full self-start">DOL Registered</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-slate-500 text-xs mt-6">Additional apprenticeship programs (culinary, diesel) are in development pending employer partner agreements.</p>
        </div>
      </section>

      {/* HVAC resources */}
      <section className="py-8 bg-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">HVAC Credential Resources</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/credentials/checksheets" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-brand-blue-300 hover:text-brand-blue-700 transition-colors">
              Performance Checksheets <ChevronRight className="w-3.5 h-3.5" />
            </Link>
            <Link href="/credentials/hvac-standards" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-brand-blue-300 hover:text-brand-blue-700 transition-colors">
              HVAC Competency Standards <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Disclosure */}
      <section className="py-8 bg-amber-50 border-b border-amber-200">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-amber-800 text-sm leading-relaxed">
            <strong>Credential Disclosure:</strong> Elevate for Humanity is not an accredited college or university. Certificates of completion are issued by 2Exclusive LLC-S d/b/a Elevate for Humanity Career & Technical Institute. Industry certifications are issued by their respective certifying bodies — Elevate provides exam preparation training. Registered Apprenticeship credentials require employer-validated OJT hours and are governed by DOL standards. Funding eligibility (WIOA, WRG, JRI) is determined by your local WorkOne office and is not guaranteed.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-brand-red-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">Start Earning Credentials</h2>
          <p className="text-white/80 text-base mb-8">Training may be funded for eligible Indiana residents.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/apply/student" className="bg-white text-brand-red-600 px-8 py-3.5 rounded-lg font-bold text-base hover:bg-slate-50 transition-colors shadow-lg">
              Apply Now
            </Link>
            <Link href="/programs" className="border-2 border-white text-white px-8 py-3.5 rounded-lg font-bold text-base hover:bg-white/10 transition-colors">
              View Programs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
