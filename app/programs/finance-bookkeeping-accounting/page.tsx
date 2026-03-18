export const dynamic = 'force-static';
export const revalidate = 86400;
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { InView } from '@/components/ui/InView';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Finance, Bookkeeping & Accounting Credential Pathway | Elevate for Humanity',
  description: 'Tiered credential pathway in tax preparation, bookkeeping, payroll, and accounting. IRS PTIN, QuickBooks Certified User, WorkKeys NCRC, and Enrolled Agent preparation. Funded for eligible participants.',
  alternates: { canonical: `${SITE_URL}/programs/finance-bookkeeping-accounting` },
  openGraph: {
    title: 'Finance, Bookkeeping & Accounting Credential Pathway',
    description: 'Tiered credential pathway: tax preparation, bookkeeping, payroll, and accounting. Nationally recognized credentials. Funded for eligible participants.',
    url: `${SITE_URL}/programs/finance-bookkeeping-accounting`,
    siteName: 'Elevate for Humanity',
    images: [{ url: '/images/pages/bookkeeping-ledger.jpg', width: 1200, height: 630, alt: 'Finance credential pathway' }],
    type: 'website',
  },
};

const credentials = [
  { name: 'IRS PTIN', issuer: 'Internal Revenue Service', desc: 'Required by law to prepare federal tax returns for compensation.' },
  { name: 'AFSP (Annual Filing Season Program)', issuer: 'Internal Revenue Service', desc: 'Voluntary IRS program demonstrating continuing education compliance.' },
  { name: 'IRS VITA Tax Law Certification', issuer: 'IRS VITA Program', desc: 'Tax law competency validation under the Volunteer Income Tax Assistance Program.' },
  { name: 'QuickBooks Certified User', issuer: 'Certiport / Pearson VUE', desc: 'Proctored on-site. Validates proficiency in QuickBooks Online accounting software.' },
  { name: 'ACT WorkKeys / NCRC', issuer: 'ACT, Inc.', desc: 'Workforce readiness validation — applied math, workplace documents, business writing.' },
  { name: 'Enrolled Agent (EA) Prep Track', issuer: 'IRS (SEE Exam)', desc: 'Advanced tier. Prepares for the Special Enrollment Examination to represent taxpayers before the IRS.' },
];

const tiers = [
  {
    level: 'Tier 1',
    title: 'Tax Preparer / Bookkeeping Assistant',
    label: 'Entry Level',
    duration: '6–10 weeks',
    credentials: ['IRS PTIN', 'IRS VITA Tax Law Certification', 'AFSP Eligibility', 'WorkKeys NCRC'],
    outcomes: ['Seasonal tax preparation positions (W-2)', 'Bookkeeping assistant roles', 'Administrative accounting support'],
    tracks: ['Employment Placement (W-2) at local tax offices and accounting firms', 'Seasonal & Contract placement at tax preparation firms'],
    href: '/programs/tax-preparation',
  },
  {
    level: 'Tier 2',
    title: 'Bookkeeper / Payroll Specialist',
    label: 'Intermediate',
    duration: '5–10 weeks (after Tier 1 or standalone)',
    credentials: ['QuickBooks Certified User (Certiport)', 'Applied Bookkeeping & Accounting Foundations', 'WorkKeys NCRC'],
    outcomes: ['Full-charge bookkeeper positions', 'Payroll specialist roles', 'Accounts payable/receivable clerk'],
    tracks: ['Employment Placement (W-2) at accounting firms and business offices', 'Structured internship with supervised work-based learning'],
    href: '/programs/bookkeeping',
  },
  {
    level: 'Tier 3',
    title: 'Enrolled Agent Preparation',
    label: 'Advanced',
    duration: 'Self-paced (after Tier 1 + Tier 2)',
    credentials: ['SEE Exam Preparation (3-part IRS exam)', 'Enrolled Agent designation (upon passing)'],
    outcomes: ['Independent tax practice', 'Senior tax preparer at accounting firms', 'IRS representation services'],
    tracks: ['Independent Revenue Services under structured mentorship', 'Employment at CPA firms and tax advisory practices'],
    href: '/programs/tax-preparation',
  },
];

const phases = [
  { phase: '1', title: 'Training', desc: 'Classroom instruction, IRS certification, and applied bookkeeping foundations. Credential exams proctored on-site.' },
  { phase: '2', title: 'Paid Internship / Work Experience', desc: 'Supervised placement within partner tax service environments, coordinated through WorkOne. Time-bound, documented, with defined learning objectives and evaluation per local board policy.' },
  { phase: '3', title: 'Employment Transition', desc: 'Transition to W-2 employment at partner firms, seasonal tax positions, or structured self-employment with income documentation.' },
];

export default function FinancePathwayPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-3">
          <Breadcrumbs items={[
            { label: 'Programs', href: '/programs' },
            { label: 'Finance, Bookkeeping & Accounting' },
          ]} />
        </div>
      </div>

      {/* Hero — clean video, no text overlay */}
      <section className="relative h-[45vh] min-h-[280px] max-h-[560px] w-full overflow-hidden">
        <video autoPlay loop muted playsInline preload="metadata" className="absolute inset-0 w-full h-full object-cover">
          <source src="/videos/business-finance.mp4" type="video/mp4" />
        </video>
      </section>

      {/* Page identity — below hero */}
      <section className="bg-white border-b border-slate-100 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-3">
            Credential Pathway · Business
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
            Finance, Bookkeeping &amp; Accounting
          </h1>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl leading-relaxed mb-6">
            A tiered credential pathway preparing participants for entry-level and growth-track roles
            in tax preparation, bookkeeping, payroll support, and small business financial services.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/apply?program=finance-bookkeeping-accounting"
              className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-7 py-3 rounded-xl transition-colors text-sm"
            >
              Apply Now
            </Link>
            <Link
              href="/contact?program=finance-bookkeeping-accounting"
              className="border-2 border-slate-300 hover:border-brand-blue-400 text-slate-700 font-bold px-7 py-3 rounded-xl transition-colors text-sm"
            >
              Request Information
            </Link>
          </div>
        </div>
      </section>

      {/* ===== HEADER ===== */}
      <InView animation="fade-up">
        <section className="bg-white py-10 sm:py-14">
          <div className="max-w-5xl mx-auto px-6">
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-wider mb-2">Credential Pathway</p>
            <div className="flex flex-wrap gap-x-8 gap-y-3 mt-6 text-sm">
              <div><span className="text-slate-500">Structure</span><span className="ml-1.5 font-semibold text-slate-900">3 Tiers (Entry → Intermediate → Advanced)</span></div>
              <div><span className="text-slate-500">Duration</span><span className="ml-1.5 font-semibold text-slate-900">6–20 weeks depending on tier</span></div>
              <div><span className="text-slate-500">Funding</span><span className="ml-1.5 font-semibold text-slate-900">WIOA / WRG eligible (ETPL #10004627)</span></div>
              <div><span className="text-slate-500">Testing</span><span className="ml-1.5 font-semibold text-slate-900">Certiport + WorkKeys on-site</span></div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-8">
              <Link href="/apply?program=finance-bookkeeping-accounting" className="inline-flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-lg transition-all shadow-lg shadow-brand-red-600/30 text-base">
                Apply Now <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/wioa-eligibility" className="text-center text-sm text-slate-500 hover:text-brand-red-600 transition-colors py-3.5 px-4">
                Check funding eligibility →
              </Link>
            </div>
          </div>
        </section>
      </InView>

      {/* ===== PATHWAY MODEL ===== */}
      <InView animation="fade-up">
        <section className="py-10 sm:py-14 bg-white border-t border-slate-100">
          <div className="max-w-5xl mx-auto px-6">
            <p className="text-brand-red-600 font-semibold text-sm uppercase tracking-wider mb-2">Pathway Structure</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">Training → Credential → Internship → Employment</h2>
            <p className="text-slate-600 leading-relaxed mb-8 max-w-3xl">
              Participants complete structured classroom instruction, earn nationally recognized credentials, and may transition into supervised internship placements within partner tax service environments. Paid work-based learning opportunities are available through workforce-aligned models and employer partnerships.
            </p>
            <div className="grid sm:grid-cols-3 gap-6">
              {phases.map((p) => (
                <div key={p.phase} className="bg-white rounded-xl p-6 border border-slate-200">
                  <div className="w-10 h-10 bg-brand-red-600 text-white rounded-full flex items-center justify-center text-lg font-bold mb-4">{p.phase}</div>
                  <h3 className="font-bold text-slate-900 mb-2">{p.title}</h3>
                  <p className="text-sm text-slate-600">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </InView>

      {/* ===== TIERED STRUCTURE ===== */}
      <InView animation="fade-up">
        <section className="py-10 sm:py-14 bg-white border-t border-slate-100">
          <div className="max-w-5xl mx-auto px-6">
            <p className="text-brand-red-600 font-semibold text-sm uppercase tracking-wider mb-2">Tiered Positioning</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-8">Three Tiers. One Pathway.</h2>
            <div className="space-y-6">
              {tiers.map((tier) => (
                <div key={tier.level} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="p-6 sm:p-8">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className="text-xs font-bold text-white px-3 py-1 rounded-full bg-slate-800">{tier.level}</span>
                      <span className="text-xs font-bold text-brand-red-600 uppercase tracking-wider">{tier.label}</span>
                      <span className="text-xs text-slate-500 ml-auto">{tier.duration}</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">{tier.title}</h3>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Credentials</p>
                        <ul className="space-y-1.5">
                          {tier.credentials.map((c) => (
                            <li key={c} className="flex items-start gap-2 text-sm text-slate-700">
                              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-brand-green-600 mt-1.5" />
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Employment Outcomes</p>
                        <ul className="space-y-1.5">
                          {tier.outcomes.map((o) => (
                            <li key={o} className="flex items-start gap-2 text-sm text-slate-700">
                              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-brand-blue-600 mt-1.5" />
                              {o}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Employment Tracks</p>
                        <ul className="space-y-1.5">
                          {tier.tracks.map((t) => (
                            <li key={t} className="flex items-start gap-2 text-sm text-slate-700">
                              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-brand-red-600 mt-1.5" />
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Link href={tier.href} className="text-brand-red-600 font-semibold text-sm hover:underline">
                        View {tier.title} details →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </InView>

      {/* ===== CREDENTIAL STACK ===== */}
      <InView animation="fade-up">
        <section className="py-10 sm:py-14 bg-white border-t border-slate-100">
          <div className="max-w-5xl mx-auto px-6">
            <p className="text-brand-red-600 font-semibold text-sm uppercase tracking-wider mb-2">National Credentials</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">Credential &amp; Validation Stack</h2>
            <p className="text-slate-600 mb-8 max-w-3xl">All credentials are issued by their respective certifying bodies — not by Elevate. Exams are proctored on-site at our authorized testing center where applicable.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {credentials.map((cred) => (
                <div key={cred.name} className="bg-white rounded-lg p-5 border border-slate-200">
                  <h3 className="font-bold text-slate-900 text-sm mb-0.5">{cred.name}</h3>
                  <p className="text-[11px] text-brand-red-600 font-medium mb-2">{cred.issuer}</p>
                  <p className="text-xs text-slate-600">{cred.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </InView>

      {/* ===== INTERNSHIP MODEL ===== */}
      <InView animation="fade-up">
        <section className="py-10 sm:py-14 bg-white border-t border-slate-100">
          <div className="max-w-5xl mx-auto px-6">
            <p className="text-brand-red-600 font-semibold text-sm uppercase tracking-wider mb-2">Work-Based Learning</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">Structured Internship &amp; Employment Transition</h2>
            <p className="text-slate-600 leading-relaxed mb-4 max-w-3xl">
              Participants who complete credential requirements may transition into supervised, paid internship placements within partner tax service environments aligned to employment pathways. All internships are time-bound, documented, and evaluated.
            </p>
            <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4 mb-8 text-sm text-brand-blue-800">
              <p className="font-semibold mb-1">WorkOne Coordination</p>
              <p>Work-based learning placements for WIOA-funded participants are coordinated through WorkOne Indianapolis (Region 5). The assigned career advisor or case manager approves the placement, sets the reimbursement rate per local board policy, and receives weekly progress reports. Credential attainment and employment outcomes are reported to the local workforce development board for WIOA performance measures.</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg p-5 border border-slate-200">
                <h3 className="font-bold text-slate-900 text-sm mb-2">Workforce-Funded Work Experience</h3>
                <p className="text-xs text-slate-600">WorkOne authorizes paid work experience. Workforce board pays stipend or wage per local policy. Elevate supervises. Hours and learning objectives documented per WIOA guidelines.</p>
              </div>
              <div className="bg-white rounded-lg p-5 border border-slate-200">
                <h3 className="font-bold text-slate-900 text-sm mb-2">OJT Reimbursement Model</h3>
                <p className="text-xs text-slate-600">Participant hired as W-2 employee. WorkOne reimburses employer 50–75% of wages during defined training period per local board policy. Formal OJT contract and training plan required.</p>
              </div>
              <div className="bg-white rounded-lg p-5 border border-slate-200">
                <h3 className="font-bold text-slate-900 text-sm mb-2">Employer-Funded Placement</h3>
                <p className="text-xs text-slate-600">Partner employer pays wages directly. Training plan and evaluation documented. No workforce reimbursement. Still reported to WorkOne for outcome tracking if participant is WIOA-enrolled.</p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
              <p className="text-amber-800 text-sm font-medium mb-2">Compliance Requirements</p>
              <ul className="space-y-1 text-xs text-amber-700">
                <li>• Written internship agreement with defined learning objectives</li>
                <li>• Supervisor evaluation at midpoint and completion</li>
                <li>• Hours tracking with documented skill progression</li>
                <li>• Minimum wage compliance for all paid placements</li>
                <li>• Separation of training activities from productive labor expectations</li>
              </ul>
              <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-amber-200">
                <Link href="/compliance/internship-agreement" className="text-xs font-semibold text-amber-800 hover:underline">Internship Agreement Template →</Link>
                <Link href="/compliance/ojt-training-plan" className="text-xs font-semibold text-amber-800 hover:underline">OJT Training Plan →</Link>
                <Link href="/compliance/internship-evaluation" className="text-xs font-semibold text-amber-800 hover:underline">Evaluation Form →</Link>
              </div>
            </div>
          </div>
        </section>
      </InView>

      {/* ===== OUTCOME LADDER ===== */}
      <InView animation="fade-up">
        <section className="py-10 sm:py-14 bg-white border-t border-slate-100">
          <div className="max-w-5xl mx-auto px-6">
            <p className="text-brand-red-600 font-semibold text-sm uppercase tracking-wider mb-2">Outcome Metrics</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">Defined Outcome Ladder</h2>
            <p className="text-slate-600 mb-8 max-w-3xl">For WIOA/WRG performance reporting through the local workforce development board, this pathway tracks measurable outcomes at each stage. All metrics are reported to the assigned WorkOne career advisor.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { metric: 'Credential Attainment', desc: 'QuickBooks Certified User (Certiport) + IRS PTIN + WorkKeys NCRC. Measurable, third-party validated.', primary: true },
                { metric: 'Seasonal Employment', desc: 'Tax season placement verification. W-2 or 1099 documentation of earned income.', primary: false },
                { metric: 'Full-Time Placement', desc: 'W-2 employment at accounting firms, payroll departments, or tax offices. Wage documentation.', primary: false },
                { metric: 'Self-Employment', desc: 'Documented income generation under structured mentorship. Viability and income verified per WIOA allowances.', primary: false },
              ].map((item) => (
                <div key={item.metric} className={`rounded-lg p-5 border ${item.primary ? 'bg-brand-green-50 border-brand-green-200' : 'bg-white border-slate-200'}`}>
                  <h3 className={`font-bold text-sm mb-2 ${item.primary ? 'text-brand-green-800' : 'text-slate-900'}`}>{item.metric}</h3>
                  <p className="text-xs text-slate-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </InView>

      {/* ===== SUB-PROGRAMS ===== */}
      <InView animation="fade-up">
        <section className="py-10 sm:py-14 bg-white border-t border-slate-100">
          <div className="max-w-5xl mx-auto px-6">
            <p className="text-brand-red-600 font-semibold text-sm uppercase tracking-wider mb-2">Programs in This Pathway</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-8">Individual Program Details</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Tax Preparation', duration: '6 weeks', cost: '$1,800 (self-pay)', credential: 'IRS PTIN + AFSP', href: '/programs/tax-preparation', image: '/images/pages/comp-program-template.jpg' },
                { title: 'Bookkeeping & QuickBooks', duration: '5 weeks', cost: '$1,500 (self-pay)', credential: 'QuickBooks Certified User', href: '/programs/bookkeeping', image: '/images/pages/comp-program-template.jpg' },
                { title: 'Business Administration', duration: '5 weeks', cost: '$4,550 (self-pay)', credential: 'IT Specialist — Business Apps', href: '/programs/business', image: '/images/pages/comp-program-template.jpg' },
              ].map((prog) => (
                <Link key={prog.title} href={prog.href} className="group rounded-xl overflow-hidden border border-slate-200 hover:shadow-md transition-shadow">
                  <Image src={prog.image} alt={prog.title} width={600} height={400} sizes="(max-width: 640px) 100vw, 33vw" className="w-full aspect-[3/2] object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="p-5">
                    <h3 className="font-bold text-slate-900 mb-1">{prog.title}</h3>
                    <p className="text-xs text-slate-500 mb-2">{prog.duration} · {prog.cost}</p>
                    <p className="text-sm text-slate-600 mb-3">Credential: {prog.credential}</p>
                    <span className="text-brand-red-600 font-semibold text-sm group-hover:underline">View details →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </InView>

      {/* ===== CTA ===== */}
      <InView animation="fade-up">
        <section className="py-14 sm:py-20 bg-slate-900">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Start This Credential Pathway</h2>
            <p className="text-slate-300 text-base leading-relaxed mb-8 max-w-xl mx-auto">
              Apply in minutes. Training may be fully funded for eligible Indiana residents through
              WIOA and state workforce programs.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/apply?program=finance-bookkeeping-accounting"
                className="bg-brand-red-600 hover:bg-brand-red-700 text-white px-10 py-4 rounded-xl font-bold text-base transition-colors"
              >
                Apply Now
              </Link>
              <a
                href="https://www.indianacareerconnect.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-10 py-4 rounded-xl font-bold text-base transition-colors"
              >
                Go to Indiana Career Connect
              </a>
            </div>
          </div>
        </section>
      </InView>

      {/* ===== TRUST BAR ===== */}
      <section className="py-8 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Recognized By</p>
          <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 mb-4">
            {[
              { src: '/images/partners/usdol.webp', alt: 'U.S. Department of Labor' },
              { src: '/images/partners/dwd.webp', alt: 'Indiana DWD' },
              { src: '/images/partners/workone.webp', alt: 'WorkOne Indiana' },
              { src: '/images/partners/nextleveljobs.webp', alt: 'Next Level Jobs' },
            ].map((logo) => (
              <Image key={logo.alt} src={logo.src} alt={logo.alt} width={100} height={40} className="object-contain h-8 w-auto opacity-70 hover:opacity-100 transition-opacity" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
