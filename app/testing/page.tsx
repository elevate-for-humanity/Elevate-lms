import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, ChevronRight, ExternalLink, AlertCircle, MapPin } from 'lucide-react';
import { ALL_PROVIDERS, getProctoringLabels } from '@/lib/testing/proctoring-capabilities';

export const metadata: Metadata = {
  title: 'Workforce Credential Testing Center | Elevate for Humanity — Indianapolis',
  description: 'Central Indianapolis workforce credential testing center. EPA 608, Certiport, WorkKeys, OSHA, NRF, ServSafe. Group testing for employers, schools, and workforce programs.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/testing' },
};

const ACCREDITATIONS = [
  { label: 'ETPL Listed', sub: 'Indiana DWD' },
  { label: 'WIOA Title I', sub: 'Approved Provider' },
  { label: 'DOL Apprenticeship', sub: 'Registered Sponsor' },
  { label: 'WorkOne Partner', sub: 'Central Indiana' },
  { label: 'EPA 608', sub: 'Authorized Proctor Site' },
];

const PIPELINE = [
  { step: 'Training', desc: 'HVAC, IT, Healthcare, Trades, Business', img: '/images/pages/training-page-1.jpg', alt: 'Workforce training programs' },
  { step: 'Testing', desc: 'Proctored certification exams on-site', img: '/images/pages/certifications-page-1.jpg', alt: 'Proctored certification testing' },
  { step: 'Credential', desc: 'Industry-recognized certificates issued', img: '/images/pages/credentials-page-1.jpg', alt: 'Workforce credentials issued' },
  { step: 'Employment', desc: 'Employer placement and hiring pipeline', img: '/images/pages/employer-page-1.jpg', alt: 'Employer hiring pipeline' },
];

const SECTORS = [
  { title: 'Skilled Trades', exams: 'EPA 608, OSHA 10/30', img: '/images/pages/comp-highlights-electrical.jpg', alt: 'Skilled trades certification' },
  { title: 'Technology', exams: 'Certiport, IC3, CompTIA', img: '/images/pages/cybersecurity.jpg', alt: 'Technology certification' },
  { title: 'Retail', exams: 'NRF RISE Up', img: '/images/pages/business-sector.jpg', alt: 'Retail workforce credentials' },
  { title: 'Food Service', exams: 'ServSafe', img: '/images/pages/culinary.jpg', alt: 'Food service certification' },
  { title: 'Career Readiness', exams: 'ACT WorkKeys / NCRC', img: '/images/pages/career-services-page-1.jpg', alt: 'Career readiness assessment' },
  { title: 'Beauty & Trades', exams: 'Milady Cosmetology', img: '/images/pages/barber-training.jpg', alt: 'Cosmetology credentials' },
];

const PARTNERS = [
  {
    type: 'WorkOne / Workforce Boards',
    headline: 'Send WIOA participants for credential testing',
    desc: 'WorkOne case managers can schedule participants to complete industry certifications at our center. We handle proctoring, documentation, and PIRL-compatible outcome records.',
    img: '/images/pages/workforce-board-page-1.jpg',
    alt: 'WorkOne workforce board partnership',
    cta: 'Workforce Board Inquiry',
    href: '/testing/book?type=workforce-board',
  },
  {
    type: 'CTE Programs & High Schools',
    headline: 'Credential testing for your students',
    desc: 'Indiana CTE programs can schedule group testing sessions for students completing IT, business, trades, or culinary pathways. No testing lab required on your end.',
    img: '/images/pages/courses-page-1.jpg',
    alt: 'CTE high school credential testing',
    cta: 'School Partnership Request',
    href: '/testing/book?type=school',
  },
  {
    type: 'Nonprofits & Training Providers',
    headline: 'Proctor exams for your participants',
    desc: 'Reentry programs, nonprofit job training, and small trade schools can route participants to Elevate for EPA 608, OSHA, ServSafe, and WorkKeys testing without running their own proctor site.',
    img: '/images/pages/partner-page-1.jpg',
    alt: 'Nonprofit training provider partnership',
    cta: 'Partner Testing Inquiry',
    href: '/testing/book?type=partner',
  },
];

const TESTING_OPTIONS = [
  {
    title: 'In-Person Proctored Testing',
    desc: 'Secure, supervised testing at our Indianapolis center. Required for certifications that mandate on-site proctoring, identity verification, and controlled conditions.',
    note: null,
    img: '/images/pages/certifications-page-1.jpg',
    alt: 'In-person proctored testing',
  },
  {
    title: 'Provider-Managed Remote Testing',
    desc: "Some sponsors offer remote testing through their own approved platforms. When available, candidates complete the exam under the sponsor's rules and technology requirements.",
    note: 'Remote availability is set by the exam provider — not available by default.',
    img: '/images/pages/lms-page-1.jpg',
    alt: 'Remote testing session',
  },
  {
    title: 'Elevate-Supported Online Proctoring',
    desc: 'For select programs and approved formats, Elevate may offer online proctoring support based on provider rules and exam eligibility.',
    note: 'Only available where permitted by the sponsoring organization.',
    img: '/images/pages/courses-page-3.jpg',
    alt: 'Online proctored exam',
  },
];

const POLICIES = [
  { title: 'Valid Photo ID Required', desc: 'Government-issued photo ID required for all test takers. Name must match registration exactly.' },
  { title: 'Arrive 15 Minutes Early', desc: 'Late arrivals may forfeit their session. Check-in closes 5 minutes before exam start.' },
  { title: 'No Prohibited Materials', desc: 'No phones, notes, or unauthorized materials in the testing room. Lockers provided.' },
  { title: 'Rescheduling Policy', desc: 'Reschedule at least 48 hours in advance. Same-day cancellations may incur a fee depending on the exam sponsor.' },
  { title: 'Exam Security Compliance', desc: 'All sessions are recorded and monitored per certification body requirements. Violations are reported to the issuing authority.' },
  { title: 'Results & Retakes', desc: 'Results are issued by the certifying body. Retake eligibility and waiting periods are set by the exam sponsor, not Elevate.' },
];

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  active:                    { label: 'Active',      cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  available_through_partner: { label: 'Schedule a session', cls: 'bg-brand-blue-50 text-brand-blue-700 border border-brand-blue-200' },
};

export default function TestingCenterPage() {
  return (
    <main className="min-h-screen bg-white">

      {/* Hero */}
      <section className="relative h-[320px] sm:h-[460px] overflow-hidden">
        <Image src="/images/pages/testing-page-1.jpg" alt="Proctored credential testing at Elevate for Humanity" fill sizes="100vw" className="object-cover" priority />
      </section>

      {/* Page header — below hero */}
      <div className="bg-white border-b border-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">Central Indianapolis</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 leading-tight mb-3">
            Indiana&apos;s Workforce<br className="hidden sm:block" /> Credential Hub
          </h1>
          <p className="text-slate-500 text-base sm:text-lg max-w-2xl leading-relaxed">
            Training providers, schools, workforce boards, and employers route certification testing through Elevate. We operate the credential infrastructure — you send the participants.
          </p>
        </div>
      </div>

      {/* Accreditation bar */}
      <div className="bg-slate-900 border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center gap-x-8 gap-y-3">
          {ACCREDITATIONS.map(({ label, sub }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-red-500 flex-shrink-0" />
              <span className="text-white text-sm font-bold">{label}</span>
              <span className="text-slate-400 text-xs">— {sub}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 sm:ml-auto">
            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="text-slate-400 text-xs">3901 N Meridian St, Suite 300, Indianapolis IN 46208</span>
          </div>
        </div>
      </div>

      {/* CTA bar */}
      <div className="bg-white border-b border-slate-100 py-5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap items-center gap-3">
          <Link href="/testing/book" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm">
            Schedule Testing <ChevronRight className="w-4 h-4" />
          </Link>
          <Link href="/testing/book?type=group-testing" className="inline-flex items-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold px-5 py-3 rounded-lg transition-colors text-sm">
            Employer Group Testing
          </Link>
          <Link href="/testing/book?type=school" className="inline-flex items-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold px-5 py-3 rounded-lg transition-colors text-sm">
            School Partnership
          </Link>
          <Link href="/testing/book?type=workforce-board" className="inline-flex items-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold px-5 py-3 rounded-lg transition-colors text-sm">
            Workforce Board
          </Link>
          <a href="tel:+13173143757" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 font-medium text-sm sm:ml-auto">
            <Phone className="w-4 h-4" /> (317) 314-3757
          </a>
        </div>
      </div>

      {/* Pipeline — Training → Testing → Credential → Employment */}
      <section className="py-14 bg-slate-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">The Ecosystem</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Training → Testing → Credential → Employment</h2>
            <p className="text-slate-500 mt-2 max-w-2xl text-sm leading-relaxed">
              This is what workforce agencies fund. Elevate is the only Indianapolis provider operating the full pipeline under one roof.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {PIPELINE.map(({ step, desc, img, alt }, i) => (
              <div key={step} className="flex flex-col">
                <div className="relative h-40 rounded-xl overflow-hidden mb-3">
                  <Image src={img} alt={alt} fill sizes="300px" className="object-cover" />
                  <div className="absolute inset-0 bg-slate-900/40" />
                  <div className="absolute bottom-3 left-3">
                    <span className="text-white font-extrabold text-lg leading-none">{step}</span>
                  </div>
                  {i < 3 && (
                    <div className="absolute top-1/2 -right-3 -translate-y-1/2 z-10 hidden sm:flex w-6 h-6 bg-white rounded-full border border-slate-200 items-center justify-center shadow">
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                    </div>
                  )}
                </div>
                <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Five sectors */}
      <section className="py-14 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">Multi-Sector Coverage</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Five Employment Sectors. One Testing Center.</h2>
            <p className="text-slate-500 mt-2 max-w-2xl text-sm leading-relaxed">
              Most testing centers serve one industry. Elevate covers five — which is how workforce agencies categorize funding and how employers hire.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {SECTORS.map(({ title, exams, img, alt }) => (
              <div key={title} className="group rounded-xl overflow-hidden border border-slate-200 flex flex-col">
                <div className="relative h-28 overflow-hidden">
                  <Image src={img} alt={alt} fill sizes="200px" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-3 flex-1">
                  <p className="font-bold text-slate-900 text-xs mb-1">{title}</p>
                  <p className="text-slate-400 text-[10px] leading-relaxed">{exams}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Three partnership types */}
      <section className="py-14 bg-slate-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">Who We Serve</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Organizations Route Testing Through Elevate</h2>
            <p className="text-slate-500 mt-2 max-w-2xl text-sm leading-relaxed">
              You don&apos;t need to run your own testing lab. Send your participants to us.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {PARTNERS.map(({ type, headline, desc, img, alt, cta, href }) => (
              <div key={type} className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
                <div className="relative h-44">
                  <Image src={img} alt={alt} fill sizes="400px" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
                  <div className="absolute bottom-3 left-4">
                    <span className="text-brand-red-400 text-[10px] font-bold uppercase tracking-widest">{type}</span>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-slate-900 mb-2">{headline}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed flex-1">{desc}</p>
                  <Link href={href} className="mt-4 inline-flex items-center gap-1.5 text-brand-red-600 hover:text-brand-red-700 font-bold text-sm">
                    {cta} <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testing options */}
      <section className="py-14 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">Testing Options</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">How Testing Works</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {TESTING_OPTIONS.map(({ title, desc, note, img, alt }) => (
              <div key={title} className="rounded-2xl overflow-hidden border border-slate-200 flex flex-col">
                <div className="relative h-44">
                  <Image src={img} alt={alt} fill sizes="400px" className="object-cover" />
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed flex-1">{desc}</p>
                  {note && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-4 leading-relaxed">{note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-start gap-4 bg-slate-50 border border-slate-200 rounded-xl p-5">
            <AlertCircle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-600 leading-relaxed">
              <span className="font-bold text-slate-900">Important: </span>
              Not every exam is available in every format. Testing format options vary by certification, sponsor rules, security requirements, and candidate eligibility. Our team will confirm whether your exam must be taken in person or if an approved online option is available.
            </p>
          </div>
        </div>
      </section>

      {/* Certification providers */}
      <section className="py-14 bg-slate-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">Certification Partners</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Certification Providers</h2>
            <p className="text-slate-500 text-sm mt-2 max-w-2xl">
              Available testing modes are determined by each provider&apos;s requirements — not by Elevate.
            </p>
          </div>
          <div className="space-y-4">
            {ALL_PROVIDERS.map((provider) => {
              const labels = getProctoringLabels(provider.key);
              const { label, cls } = STATUS_LABEL[provider.status] ?? STATUS_LABEL.available_through_partner;
              return (
                <div key={provider.key} className="bg-white border border-slate-200 rounded-2xl p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-extrabold text-slate-900">{provider.name}</h3>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
                      </div>
                      <p className="text-sm text-slate-500 leading-relaxed mb-3">{provider.description}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {provider.exams.map((e) => (
                          <span key={e} className="text-xs bg-slate-50 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-full">{e}</span>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {labels.map((lbl) => (
                          <span key={lbl} className="text-xs font-semibold bg-brand-blue-50 text-brand-blue-700 border border-brand-blue-100 px-2.5 py-1 rounded-full">{lbl}</span>
                        ))}
                      </div>
                    </div>
                    {provider.verifyUrl && (
                      <a href={provider.verifyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-800 flex-shrink-0">
                        <ExternalLink className="w-3 h-3" /> Verify
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testing policies */}
      <section className="py-14 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">Policies</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Testing Policies</h2>
            <p className="text-slate-500 text-sm mt-2 max-w-2xl">Required by certification bodies for all authorized proctor sites. Review before your session.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {POLICIES.map(({ title, desc }) => (
              <div key={title} className="border border-slate-200 rounded-xl p-5">
                <h3 className="font-bold text-slate-900 mb-2 text-sm">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Group testing photo split */}
      <section className="py-14 bg-slate-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="relative h-72 rounded-2xl overflow-hidden">
              <Image src="/images/pages/employer-page-2.jpg" alt="Employer group testing session" fill sizes="600px" className="object-cover" />
            </div>
            <div>
              <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">For Employers</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">Group Testing for Employers</h2>
              <p className="text-slate-600 leading-relaxed mb-4 text-sm">
                Certify multiple employees at once. Group sessions reduce per-person cost and eliminate the logistics burden on your HR team.
              </p>
              <ul className="space-y-2 mb-6">
                {['Sessions for 2–20 participants', 'Flexible scheduling including evenings', 'We handle all proctoring and documentation', 'Credential records provided for your files', 'PIRL-compatible outcome data for workforce agencies'].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="w-1.5 h-1.5 bg-brand-red-500 rounded-full flex-shrink-0 mt-1.5" />{item}
                  </li>
                ))}
              </ul>
              <Link href="/testing/book?type=group-testing" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm">
                Inquire About Group Testing <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Workforce board dark CTA */}
      <section className="py-14 bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-2">Workforce Boards & Agencies</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">Become Indiana&apos;s Credential Gateway</h2>
              <p className="text-slate-300 leading-relaxed mb-4 text-sm">
                Elevate is ETPL listed, WIOA Title I approved, and a DOL Registered Apprenticeship Sponsor. We are the only Indianapolis provider operating the full training-to-credential pipeline under one roof.
              </p>
              <p className="text-slate-300 leading-relaxed mb-6 text-sm">
                If your agency needs a place to train, test, and credential participants — and track outcomes for PIRL reporting — contact us to discuss a partnership.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/testing/book?type=workforce-board" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm">
                  Workforce Board Inquiry <ChevronRight className="w-4 h-4" />
                </Link>
                <a href="mailto:elevate4humanityedu@gmail.com" className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm">
                  Email Us
                </a>
              </div>
            </div>
            <div className="relative h-72 rounded-2xl overflow-hidden">
              <Image src="/images/pages/workforce-board-page-1.jpg" alt="Workforce board partnership" fill sizes="600px" className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Disclosure */}
      <section className="py-6 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-400 leading-relaxed">
            Credentials are issued by external certifying bodies — not by Elevate for Humanity. Elevate provides the proctored testing environment and logistics. The certifying authority makes all pass/fail determinations. Testing format options vary by certification, sponsor rules, and candidate eligibility.{' '}
            <Link href="/compliance" className="text-brand-blue-600 hover:underline">View compliance disclosures →</Link>
          </p>
        </div>
      </section>

    </main>
  );
}
