import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, ChevronRight, ExternalLink, AlertCircle, MapPin, Shield, Award, Users, Building2, GraduationCap, Briefcase } from 'lucide-react';
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
  { step: 'Training', desc: 'HVAC, IT, Healthcare, Trades, Business — taught at our Indianapolis center or through approved partner programs.', img: '/images/pages/training-page-1.jpg', alt: 'Workforce training programs at Elevate' },
  { step: 'Testing', desc: 'Proctored certification exams administered on-site by Elevate staff. Secure, documented, and compliant with each provider\'s requirements.', img: '/images/pages/certifications-page-1.jpg', alt: 'Proctored certification testing' },
  { step: 'Credential', desc: 'Industry-recognized certificates issued directly by the certifying body — EPA, Certiport, NRF, ACT, OSHA, and others.', img: '/images/pages/credentials-page-1.jpg', alt: 'Workforce credentials issued' },
  { step: 'Employment', desc: 'Credentialed participants connect to employer partners, apprenticeship placements, and WorkOne job referrals.', img: '/images/pages/employer-page-1.jpg', alt: 'Employer hiring pipeline' },
];

const SECTORS = [
  { title: 'Skilled Trades', exams: 'EPA 608 Universal, OSHA 10/30-Hour', img: '/images/pages/comp-highlights-electrical.jpg', alt: 'Electrical trades certification testing' },
  { title: 'Technology', exams: 'Certiport / Pearson VUE, IC3, CompTIA', img: '/images/pages/cybersecurity.jpg', alt: 'Technology certification testing' },
  { title: 'Retail', exams: 'NRF RISE Up — Customer Service & Sales', img: '/images/pages/career-services-page-1.jpg', alt: 'Retail workforce credentials' },
  { title: 'Food Service', exams: 'ServSafe Food Handler & Manager', img: '/images/pages/culinary.jpg', alt: 'Food service certification' },
  { title: 'Career Readiness', exams: 'ACT WorkKeys / NCRC', img: '/images/pages/courses-page-1.jpg', alt: 'Career readiness assessment' },
  { title: 'Beauty & Trades', exams: 'Milady Cosmetology, Barbering', img: '/images/pages/barber-training.jpg', alt: 'Cosmetology and barbering credentials' },
];

const PARTNERS = [
  {
    icon: Building2,
    type: 'WorkOne & Workforce Boards',
    headline: 'Send WIOA participants for credential testing',
    desc: 'WorkOne case managers schedule participants to complete industry certifications at our center. We handle proctoring, documentation, and PIRL-compatible outcome records. You solve a logistics problem — we run the testing infrastructure.',
    img: '/images/pages/workforce-board-page-4.jpg',
    alt: 'WorkOne workforce board partnership',
    bullets: ['WIOA, Next Level Jobs, and JRI participants accepted', 'PIRL-compatible outcome documentation', 'Group sessions for cohorts of 2–8'],
    cta: 'Workforce Board Inquiry',
    href: '/testing/book?type=workforce-board',
  },
  {
    icon: GraduationCap,
    type: 'CTE Programs & High Schools',
    headline: 'Credential testing for your students',
    desc: 'Indiana CTE programs can schedule group testing sessions for students completing IT, business, trades, or culinary pathways. You teach the content — we provide the authorized testing infrastructure. No testing lab required on your end.',
    img: '/images/pages/courses-page-5.jpg',
    alt: 'CTE high school credential testing',
    bullets: ['Microsoft Office Specialist, IC3, OSHA, ServSafe', 'Bus groups in — we handle check-in and proctoring', 'Two testing days per semester model available'],
    cta: 'School Partnership Request',
    href: '/testing/book?type=school',
  },
  {
    icon: Users,
    type: 'Nonprofits & Training Providers',
    headline: 'Proctor exams for your participants',
    desc: 'Reentry programs, nonprofit job training, and small trade schools route participants to Elevate for EPA 608, OSHA, ServSafe, and WorkKeys testing. Become the regional proctor hub your participants need without running your own site.',
    img: '/images/pages/partner-page-1.jpg',
    alt: 'Nonprofit training provider partnership',
    bullets: ['EPA 608, OSHA, ServSafe, WorkKeys', 'Reentry and justice-involved participants welcome', 'Flexible scheduling including evenings'],
    cta: 'Partner Testing Inquiry',
    href: '/testing/book?type=partner',
  },
  {
    icon: Briefcase,
    type: 'Employers',
    headline: 'Certify your workforce on-site',
    desc: 'Certify multiple employees at once in a dedicated session. Group testing reduces per-person cost and eliminates the logistics burden on your HR team. We handle all proctoring, documentation, and credential records.',
    img: '/images/pages/employer-page-2.jpg',
    alt: 'Employer group testing session',
    bullets: ['Sessions for 2–8 participants per block', 'Flexible scheduling including evenings', 'Credential records provided for your files'],
    cta: 'Employer Group Testing',
    href: '/testing/book?type=group-testing',
  },
];

const TESTING_OPTIONS = [
  {
    title: 'In-Person Proctored Testing',
    desc: 'Secure, supervised testing at our Indianapolis center. Required for certifications that mandate on-site proctoring, identity verification, and controlled conditions. This is the default format for all exams we administer.',
    note: null,
    img: '/images/pages/competency-test-hero.jpg',
    alt: 'In-person proctored testing at Elevate',
  },
  {
    title: 'Provider-Managed Remote Testing',
    desc: 'Some certification sponsors offer remote testing through their own approved online platforms. When available, candidates complete the exam under the sponsor\'s rules and technology requirements — not Elevate\'s.',
    note: 'Remote availability is set by the exam provider — not available by default for every exam.',
    img: '/images/pages/lms-page-1.jpg',
    alt: 'Remote testing session',
  },
  {
    title: 'Elevate-Supported Online Proctoring',
    desc: 'For select programs and approved formats, Elevate may offer online proctoring support. This is only available where explicitly permitted by the sponsoring organization\'s policies and security requirements.',
    note: 'Only available where permitted by the sponsoring organization.',
    img: '/images/pages/courses-page-3.jpg',
    alt: 'Online proctored exam',
  },
];

const POLICIES = [
  { icon: Shield, title: 'Valid Photo ID Required', desc: 'Government-issued photo ID required for all test takers. Name must match registration exactly. No ID, no exam.' },
  { icon: MapPin, title: 'Arrive 15 Minutes Early', desc: 'Late arrivals may forfeit their session. Check-in closes 5 minutes before exam start time.' },
  { icon: AlertCircle, title: 'No Prohibited Materials', desc: 'No phones, notes, or unauthorized materials in the testing room. Secure lockers provided at no charge.' },
  { icon: Phone, title: 'Rescheduling Policy', desc: 'Reschedule at least 48 hours in advance. Same-day cancellations may incur a fee depending on the exam sponsor.' },
  { icon: Award, title: 'Exam Security Compliance', desc: 'All sessions are recorded and monitored per certification body requirements. Violations are reported to the issuing authority.' },
  { icon: ChevronRight, title: 'Results & Retakes', desc: 'Results are issued by the certifying body. Retake eligibility and waiting periods are set by the exam sponsor, not Elevate.' },
];

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  active:                    { label: 'Active',             cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  available_through_partner: { label: 'Schedule a session', cls: 'bg-brand-blue-50 text-brand-blue-700 border border-brand-blue-200' },
};

const PROVIDER_IMAGES: Record<string, string> = {
  esco:       '/images/pages/hvac-technician.jpg',
  nrf:        '/images/pages/for-students-hero.jpg',
  certiport:  '/images/pages/technology-sector.jpg',
  workkeys:   '/images/pages/courses-page-2.jpg',
  servsafe:   '/images/pages/courses-page-6.jpg',
  careersafe: '/images/pages/construction-trades.jpg',
  milady:     '/images/pages/cosmetology.jpg',
};

export default function TestingCenterPage() {
  return (
    <main className="min-h-screen bg-white">

      {/* ── Video hero ── */}
      <section className="relative h-[340px] sm:h-[500px] overflow-hidden bg-slate-900">
        <video
          autoPlay muted loop playsInline
          poster="/images/pages/testing-page-1.jpg"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        >
          <source src="/videos/elevate-overview-with-narration.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
      </section>

      {/* ── Page header — below hero ── */}
      <div className="bg-white border-b border-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">Indianapolis · 8888 Keystone Crossing, Suite 1309</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 leading-tight mb-3">
            Indiana&apos;s Workforce<br className="hidden sm:block" /> Credential Hub
          </h1>
          <p className="text-slate-500 text-base sm:text-lg max-w-3xl leading-relaxed mb-6">
            Elevate for Humanity operates a proctored workforce credential testing center in Indianapolis. Training providers, schools, workforce boards, and employers send participants to us for industry certification exams. We run the testing infrastructure — you send the people.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/testing/book" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors">
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
            <a href="tel:+13173143757" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 font-medium text-sm">
              <Phone className="w-4 h-4" /> (317) 314-3757
            </a>
          </div>
        </div>
      </div>

      {/* ── Accreditation bar ── */}
      <div className="bg-slate-900 border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center gap-x-8 gap-y-3">
          {ACCREDITATIONS.map(({ label, sub }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-red-500 flex-shrink-0" />
              <span className="text-white text-sm font-bold">{label}</span>
              <span className="text-slate-400 text-xs">— {sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Pipeline ── */}
      <section className="py-14 bg-slate-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">The Ecosystem</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">Training → Testing → Credential → Employment</h2>
            <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
              This is the pipeline workforce agencies fund. Elevate is the only Indianapolis provider operating all four stages under one roof — which means participants move from class to credential to job without leaving our network.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {PIPELINE.map(({ step, desc, img, alt }, i) => (
              <div key={step} className="flex flex-col">
                <div className="relative h-44 rounded-xl overflow-hidden mb-3">
                  <Image src={img} alt={alt} fill sizes="300px" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <span className="text-white font-extrabold text-base leading-none">{step}</span>
                  </div>
                  {i < 3 && (
                    <div className="absolute top-1/2 -right-3 -translate-y-1/2 z-10 hidden sm:flex w-6 h-6 bg-white rounded-full border border-slate-200 items-center justify-center shadow-sm">
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

      {/* ── Five sectors ── */}
      <section className="py-14 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">Multi-Sector Coverage</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">Five Employment Sectors. One Testing Center.</h2>
            <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
              Most testing centers serve one industry. Elevate covers five — which is how workforce agencies categorize funding and how employers hire. That breadth is what makes this a regional credential hub, not just a testing room.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {SECTORS.map(({ title, exams, img, alt }) => (
              <div key={title} className="group rounded-xl overflow-hidden border border-slate-200 flex flex-col">
                <div className="relative h-32 overflow-hidden">
                  <Image src={img} alt={alt} fill sizes="200px" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-white font-bold text-xs leading-tight">{title}</p>
                  </div>
                </div>
                <div className="p-3 flex-1 bg-white">
                  <p className="text-slate-400 text-[10px] leading-relaxed">{exams}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who sends participants ── */}
      <section className="py-14 bg-slate-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">Who We Serve</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">Organizations Route Testing Through Elevate</h2>
            <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
              You don&apos;t need to run your own testing lab. Send your participants to us — we handle the proctoring, documentation, and credential records.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PARTNERS.map(({ icon: Icon, type, headline, desc, img, alt, bullets, cta, href }) => (
              <div key={type} className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
                <div className="relative h-44">
                  <Image src={img} alt={alt} fill sizes="350px" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/75 to-transparent" />
                  <div className="absolute bottom-3 left-4 flex items-center gap-2">
                    <Icon className="w-4 h-4 text-brand-red-400" />
                    <span className="text-brand-red-300 text-[10px] font-bold uppercase tracking-widest">{type}</span>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-slate-900 mb-2 text-sm">{headline}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed mb-3 flex-1">{desc}</p>
                  <ul className="space-y-1 mb-4">
                    {bullets.map((b) => (
                      <li key={b} className="flex items-start gap-1.5 text-xs text-slate-500">
                        <span className="w-1 h-1 bg-brand-red-400 rounded-full flex-shrink-0 mt-1.5" />{b}
                      </li>
                    ))}
                  </ul>
                  <Link href={href} className="inline-flex items-center gap-1.5 text-brand-red-600 hover:text-brand-red-700 font-bold text-xs">
                    {cta} <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testing options ── */}
      <section className="py-14 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">Testing Options</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">How Testing Works</h2>
            <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
              Testing format depends on the certification provider&apos;s requirements — not on what Elevate prefers. We confirm the correct format for your exam before scheduling.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {TESTING_OPTIONS.map(({ title, desc, note, img, alt }) => (
              <div key={title} className="rounded-2xl overflow-hidden border border-slate-200 flex flex-col">
                <div className="relative h-48">
                  <Image src={img} alt={alt} fill sizes="400px" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="font-bold text-white text-sm">{title}</h3>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col bg-white">
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
              Not every exam is available in every format. Our team will confirm whether your exam must be taken in person or if an approved online option is available based on the certification provider&apos;s requirements.
            </p>
          </div>
        </div>
      </section>

      {/* ── Certification providers with images ── */}
      <section className="py-14 bg-slate-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">Certification Partners</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">Certification Providers</h2>
            <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
              Available testing modes are determined by each provider&apos;s requirements — not by Elevate. The options shown reflect what each sponsor permits.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ALL_PROVIDERS.map((provider) => {
              const labels = getProctoringLabels(provider.key);
              const { label, cls } = STATUS_LABEL[provider.status] ?? STATUS_LABEL.available_through_partner;
              const provImg = PROVIDER_IMAGES[provider.key] ?? '/images/pages/accreditation.jpg';
              return (
                <div key={provider.key} className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
                  <div className="relative h-36">
                    <Image src={provImg} alt={provider.name} fill sizes="400px" className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-slate-900/10" />
                    <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
                      <h3 className="font-extrabold text-white text-sm leading-tight">{provider.name}</h3>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0 ${cls}`}>{label}</span>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <p className="text-slate-500 text-xs leading-relaxed mb-3 flex-1">{provider.description}</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {provider.exams.map((e) => (
                        <span key={e} className="text-[10px] bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{e}</span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {labels.map((lbl) => (
                        <span key={lbl} className="text-[10px] font-semibold bg-brand-blue-50 text-brand-blue-700 border border-brand-blue-100 px-2 py-0.5 rounded-full">{lbl}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <Link href={`/testing/book?provider=${provider.key}`} className="text-xs font-bold text-brand-red-600 hover:text-brand-red-700 flex items-center gap-1">
                        Schedule <ChevronRight className="w-3 h-3" />
                      </Link>
                      {provider.verifyUrl && (
                        <a href={provider.verifyUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" /> Verify
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Testing policies ── */}
      <section className="py-14 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">Policies</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">Testing Policies</h2>
            <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
              Required by certification bodies for all authorized proctor sites. All test takers must review these before their session.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {POLICIES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="border border-slate-200 rounded-xl p-5 flex gap-4">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1 text-sm">{title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Workforce board dark CTA with video ── */}
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
              <video autoPlay muted loop playsInline poster="/images/pages/workforce-board-page-1.jpg" className="absolute inset-0 w-full h-full object-cover">
                <source src="/videos/employer-hero.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-slate-900/30" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Disclosure ── */}
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
