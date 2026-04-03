import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Phone } from 'lucide-react';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Licensing & Partnerships | Elevate for Humanity',
  description:
    'Partner with Elevate for Humanity as a training provider, employer partner, or community organization. License the workforce platform or join our network.',
  alternates: {
    canonical: `${SITE_URL}/licensing-partnerships`,
  },
  openGraph: {
    title: 'Licensing & Partnerships | Elevate for Humanity',
    description:
      'Partner with Elevate for Humanity as a training provider, employer partner, or community organization. License the workforce platform or join our network.',
    url: `${SITE_URL}/licensing-partnerships`,
    siteName: 'Elevate for Humanity',
    images: [
      {
        url: `${SITE_URL}/images/pages/workforce-partnership-hero.jpg`,
        width: 1200,
        height: 630,
        alt: 'Licensing and Partnerships — Elevate for Humanity',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Licensing & Partnerships | Elevate for Humanity',
    description:
      'Partner with Elevate for Humanity as a training provider, employer partner, or community organization.',
    images: [`${SITE_URL}/images/pages/workforce-partnership-hero.jpg`],
  },
};

const PARTNERSHIP_TYPES = [
  {
    image: '/images/pages/licensing-partnerships-page-1.jpg',
    alt: 'Training provider delivering workforce programs through the Elevate platform',
    title: 'Training Provider',
    description:
      'Deliver workforce programs through our platform. We handle enrollment, compliance, credential tracking, and funder reporting. You focus on instruction.',
    benefits: [
      'Access to WIOA and state workforce funding streams',
      'Automated enrollment and eligibility verification',
      'Built-in WIOA, DOL, and FERPA compliance tools',
      'Credential issuance and employer matching',
    ],
    href: '/apply/program-holder',
    cta: 'Apply as Training Provider',
  },
  {
    image: '/images/pages/employer-handshake.jpg',
    alt: 'Employer partner hiring credentialed graduates from Elevate workforce programs',
    title: 'Employer Partner',
    description:
      'Hire pre-screened, credentialed graduates at no cost. Access WOTC tax credits, OJT wage reimbursement, and DOL Registered Apprenticeship pathways.',
    benefits: [
      'WOTC tax credits: $2,400–$9,600 per qualifying hire',
      'OJT wage reimbursement: 50–75% during training',
      'Registered Apprenticeship pathways — DOL compliance handled',
      'Custom cohorts trained to your specifications',
    ],
    href: '/employer',
    cta: 'Become an Employer Partner',
  },
  {
    image: '/images/pages/workforce-partnership-hero.jpg',
    alt: 'Community organization partnering with Elevate for workforce development',
    title: 'Community Organization',
    description:
      'Refer clients, co-locate services, or apply for joint grants. We work with reentry programs, housing agencies, social services, and faith-based organizations.',
    benefits: [
      'Referral partnerships with outcome tracking',
      'Co-location and shared resource opportunities',
      'Joint grant applications and funding navigation',
      'Wraparound service coordination for shared clients',
    ],
    href: '/contact',
    cta: 'Start a Conversation',
  },
];

const PLATFORM_FEATURES = [
  {
    image: '/images/pages/admin-compliance-hero.jpg',
    alt: 'WIOA compliance dashboard with automated reporting',
    title: 'WIOA & Grant Compliance',
    desc: 'Automated PIRL reporting, ITA tracking, eligibility documentation, and quarterly performance metrics — generated from enrollment data, not manual entry.',
  },
  {
    image: '/images/pages/admin-employers-hero.jpg',
    alt: 'Employer portal showing candidate search and apprenticeship tracking',
    title: 'Employer Portal',
    desc: 'Partners browse pre-screened candidates, track apprenticeship hours, manage OJT reimbursements, and sign MOUs — all in one place.',
  },
  {
    image: '/images/pages/admin-analytics-hero.jpg',
    alt: 'Analytics dashboard showing enrollment, completion, and placement outcomes',
    title: 'Outcome Reporting',
    desc: 'Real-time dashboards for enrollment, completion, placement, and wage outcomes. One-click funder reports in required formats.',
  },
  {
    image: '/images/pages/admin-grants-hero.jpg',
    alt: 'Grant tracking and expenditure reporting interface',
    title: 'Grant Tracking',
    desc: 'Expenditure tracking by grant source, outcome metric collection, and automated report generation for federal and state funders.',
  },
];

const PROCESS_STEPS = [
  {
    num: '01',
    title: 'Submit an Application',
    desc: 'Complete the partnership application with information about your organization, programs, and goals. Takes about 15 minutes.',
  },
  {
    num: '02',
    title: 'Consultation Call',
    desc: 'Our team reviews your application and schedules a Zoom call to discuss partnership structure, funding alignment, and next steps.',
  },
  {
    num: '03',
    title: 'Agreement & Onboarding',
    desc: 'Sign the partnership agreement and complete platform onboarding. We configure your instance, import your data, and train your staff.',
  },
  {
    num: '04',
    title: 'Launch',
    desc: 'Go live with your branded platform. We provide ongoing support, compliance guidance, and quarterly partnership reviews.',
  },
];

export default function LicensingPartnershipsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Licensing & Partnerships' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-64 md:h-96 overflow-hidden">
          <Image
            src="/images/pages/workforce-partnership-hero.jpg"
            alt="Workforce development partnerships — Elevate for Humanity"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>
        <div className="bg-white py-10 border-t">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-3">
              Licensing &amp; Partnerships
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-tight mb-4 max-w-3xl mx-auto">
              Build workforce programs on proven infrastructure.
            </h1>
            <p className="text-black text-lg max-w-2xl mx-auto">
              License the platform, join the network, or partner as a training provider, employer, or community organization.
            </p>
          </div>
        </div>
      </section>

      {/* Partnership Types */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-3">
            Partnership Opportunities
          </h2>
          <p className="text-black text-center mb-12 max-w-2xl mx-auto">
            Three models. Each is designed for a different type of organization with different goals.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {PARTNERSHIP_TYPES.map((type) => (
              <div
                key={type.title}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
              >
                <div className="relative w-full aspect-[4/3]" style={{ aspectRatio: '16/10' }}>
                  <Image
                    src={type.image}
                    alt={type.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="p-7 flex flex-col flex-1">
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{type.title}</h3>
                  <p className="text-black text-sm leading-relaxed mb-5">{type.description}</p>
                  <ul className="space-y-2 mb-7 flex-1">
                    {type.benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-red-600 mt-1.5 flex-shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={type.href}
                    className="block w-full text-center bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-colors text-sm"
                  >
                    {type.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform licensing section */}
      <section className="py-16 sm:py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-14">
            <div>
              <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-3">
                Platform Licensing
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
                License the Elevate Workforce OS
              </h2>
              <p className="text-black leading-relaxed mb-4">
                The same platform that runs Elevate&apos;s own programs is available for licensing.
                Workforce boards, training providers, and nonprofits get a fully branded instance
                with all portals, compliance tools, and reporting — without building anything.
              </p>
              <p className="text-black leading-relaxed mb-6">
                You get your own domain, your own branding, and your own data. We handle
                hosting, security, updates, and compliance patches.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/store"
                  className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm"
                >
                  View Licensing Plans <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/demo/admin"
                  className="inline-flex items-center gap-2 border border-slate-300 text-slate-700 font-bold px-6 py-3 rounded-lg hover:bg-white transition-colors text-sm"
                >
                  Try Full Demo
                </Link>
              </div>
            </div>
            <div className="relative rounded-xl overflow-hidden shadow-xl aspect-video" style={{ aspectRatio: '4/3' }}>
              <Image
                src="/images/pages/admin-licensing-hero.jpg"
                alt="Elevate platform admin dashboard — licensable workforce operating system"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>

          {/* Platform feature cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLATFORM_FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="relative w-full aspect-[4/3]" style={{ aspectRatio: '16/10' }}>
                  <Image
                    src={f.image}
                    alt={f.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-slate-900 text-sm mb-1.5">{f.title}</h3>
                  <p className="text-black text-xs leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to become a partner */}
      <section className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-3">
            How to Become a Partner
          </h2>
          <p className="text-black text-center mb-12 max-w-xl mx-auto">
            From first contact to launch, the process takes 2–4 weeks depending on partnership type.
          </p>

          <div className="space-y-10">
            {PROCESS_STEPS.map((step, i) => (
              <div
                key={step.num}
                className={`flex flex-col sm:flex-row gap-8 items-start ${i % 2 !== 0 ? 'sm:flex-row-reverse' : ''}`}
              >
                <div className="sm:w-1/2">
                  <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
                    <Image
                      src={
                        i === 0 ? '/images/pages/about-career-training.jpg' :
                        i === 1 ? '/images/pages/workforce-board-page-1.jpg' :
                        i === 2 ? '/images/pages/partner-page-1.jpg' :
                        '/images/pages/graduation-ceremony.jpg'
                      }
                      alt={step.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                  </div>
                </div>
                <div className="sm:w-1/2 flex flex-col justify-center">
                  <p className="text-brand-red-600 font-extrabold text-xs uppercase tracking-widest mb-2">
                    Step {step.num}
                  </p>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                  <p className="text-black leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proof strip */}
      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '14+', label: 'Program Types Available' },
              { value: '516+', label: 'Platform Database Tables' },
              { value: '3', label: 'Portal Views (Admin / Employer / Learner)' },
              { value: '$0', label: 'Recruiting Fee for Employers' },
            ].map((m) => (
              <div key={m.label}>
                <div className="text-3xl font-black text-brand-red-600 mb-1">{m.value}</div>
                <div className="text-sm text-black">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
            Ready to Partner With Us?
          </h2>
          <p className="text-black mb-8 max-w-xl mx-auto">
            Book a Zoom call, apply online, or call us directly. All meetings are held via Zoom —
            a link is sent to your email automatically after booking.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
            <a
              href="https://calendly.com/elevate4humanityedu"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white px-8 py-4 rounded-lg font-bold transition-colors"
            >
              Book a Zoom Meeting <ArrowRight className="w-5 h-5" />
            </a>
            <Link
              href="/apply/program-holder"
              className="inline-flex items-center justify-center gap-2 border border-slate-300 text-slate-700 px-8 py-4 rounded-lg font-bold hover:bg-white transition-colors"
            >
              Apply to Partner
            </Link>
            <a
              href="tel:317-314-3757"
              className="inline-flex items-center justify-center gap-2 border border-slate-300 text-slate-700 px-8 py-4 rounded-lg font-bold hover:bg-white transition-colors"
            >
              <Phone className="w-4 h-4" /> (317) 314-3757
            </a>
          </div>
          <p className="text-black text-sm mt-6">
            Zoom link sent automatically after booking. No app download required.
          </p>
        </div>
      </section>
    </div>
  );
}
