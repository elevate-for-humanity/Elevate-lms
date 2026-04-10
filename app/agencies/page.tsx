
import { Metadata } from 'next';
import Image from 'next/image';
import HeroVideo from '@/components/marketing/HeroVideo';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Phone, Building2, Users, DollarSign, TrendingUp, ArrowRight } from 'lucide-react';

export const dynamic = 'force-static';
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'For Workforce Agencies | Elevate Workforce OS',
  description: 'DOL Registered Apprenticeship Sponsor. Indiana ETPL Certified. WIOA compliant. WorkOne referrals accepted. RAPIDS-tracked outcomes. Built for workforce boards, DWD, and case managers.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/agencies' },
};

const complianceFeatures = [
  { image: '/images/pages/government-1.jpg', alt: 'DOL Registered apprenticeship compliance', title: 'DOL Registered', description: 'Registered apprenticeship sponsor with the Department of Labor', href: '/programs/apprenticeships', cta: 'View Apprenticeships' },
  { image: '/images/pages/government-2.jpg', alt: 'ETPL approved training provider listing', title: 'ETPL Approved', description: "Listed on Indiana's Eligible Training Provider List", href: '/funding/how-it-works', cta: 'How Funding Works' },
  { image: '/images/pages/government-3.jpg', alt: 'WIOA compliance documentation and reporting', title: 'WIOA Compliant', description: 'Full compliance with Workforce Innovation and Opportunity Act', href: '/funding/how-it-works#wioa', cta: 'WIOA Details' },
  { image: '/images/pages/government-4.jpg', alt: 'Real-time outcome tracking and placement reporting', title: 'Outcome Tracking', description: 'Real-time reporting on placement, retention, and wages', href: '/contact', cta: 'Request a Report' },
];

const platformFeatures = [
  'Multi-tenant architecture for regional deployment',
  'Integrated case management and tracking',
  'Automated WIOA reporting and compliance',
  'Employer engagement portal',
  'Career pathway mapping',
  'Skills-based matching',
];

const governanceFeatures = [
  'Role-based access control with server-side enforcement',
  'Auditable system activity and event logging',
  'Published service level targets',
  'Documented incident response procedures',
  'Tested disaster recovery processes',
  'Secure document handling with defined data retention standards',
];

export default function AgenciesPage() {
  return (
    <div className="bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'Partner Agencies' }]} />
        </div>
      </div>

      <HeroVideo
        videoSrcDesktop="/videos/training-providers-hero.mp4"
        posterImage="/images/pages/agencies-page-1.jpg"
        microLabel="For Workforce Agencies"
        analyticsName="agencies"
      >
        <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-3">Workforce Agencies &amp; Boards</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
          A WIOA-compliant pipeline you can refer into today.
        </h1>
        <p className="text-slate-700 text-base leading-relaxed max-w-2xl mb-6">
          Elevate for Humanity is Indiana ETPL certified, DOL Registered, and RAPIDS-tracked. WorkOne case managers can refer participants directly — funding is authorized before training begins, outcomes are documented, and credentials are issued on-site.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/workone-partner-packet" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg text-sm transition-colors">
            WorkOne Partner Packet
          </Link>
          <Link href="/contact" className="border-2 border-slate-300 text-slate-800 font-bold px-6 py-3 rounded-lg text-sm hover:bg-slate-50 transition-colors">
            Request Documentation
          </Link>
        </div>
      </HeroVideo>

      {/* WIOA referral workflow */}
      <section className="bg-blue-50 border-y border-blue-100 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">How WorkOne Referrals Work</p>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-8">Four steps from referral to credential.</h2>
          <div className="grid sm:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Eligibility Determination', desc: 'Case manager determines WIOA eligibility and selects an ETPL-listed Elevate program.' },
              { step: '2', title: 'Funding Authorization', desc: 'ITA or grant authorization issued. Training cost is covered before the participant begins.' },
              { step: '3', title: 'Training & Tracking', desc: 'Participant completes checkpoint-gated training. Attendance, RTI hours, and progress are logged in real time.' },
              { step: '4', title: 'Credential & Placement', desc: 'Exam funding authorized on completion. Credential issued on-site. Placement outcome reported to DWD.' },
            ].map((s, i) => (
              <div key={s.step} className="relative">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black text-base flex items-center justify-center mb-3">{s.step}</div>
                {i < 3 && <div className="hidden sm:block absolute top-5 left-10 right-[-1rem] h-px bg-blue-200" />}
                <p className="font-bold text-slate-900 text-sm mb-1">{s.title}</p>
                <p className="text-slate-600 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/funding/wioa" className="text-sm font-semibold text-blue-700 hover:underline">WIOA eligibility details →</Link>
            <Link href="/credentials" className="text-sm font-semibold text-blue-700 hover:underline">Compliance documentation →</Link>
            <Link href="/workone-partner-packet" className="text-sm font-semibold text-blue-700 hover:underline">Download partner packet →</Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Built for Government Compliance</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {complianceFeatures.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
                <div className="relative w-full aspect-[4/3]" style={{ aspectRatio: '16/10' }}>
                  <Image src={feature.image} alt={feature.alt} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-slate-900 text-lg mb-2">{feature.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed flex-1">{feature.description}</p>
                  <div className="mt-4">
                    <Link href={feature.href} className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-colors">
                      {feature.cta}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Enterprise-Ready Platform</h2>
              <p className="text-slate-600 mb-8">
                Designed for workforce boards, state agencies, and regional partnerships. Deploy across multiple jurisdictions with centralized oversight and reporting.
              </p>
              <ul className="space-y-3">
                {platformFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-red-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 text-center border border-slate-200">
                <Building2 className="w-10 h-10 text-brand-blue-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-slate-900">50+</div>
                <div className="text-slate-600 text-sm">Partner Organizations</div>
              </div>
              <div className="bg-white rounded-xl p-6 text-center border border-slate-200">
                <Users className="w-10 h-10 text-brand-blue-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-slate-900">WIOA</div>
                <div className="text-slate-600 text-sm">Compliant</div>
              </div>
              <div className="bg-white rounded-xl p-6 text-center border border-slate-200">
                <DollarSign className="w-10 h-10 text-brand-blue-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-slate-900">ETPL</div>
                <div className="text-slate-600 text-sm">Listed</div>
              </div>
              <div className="bg-white rounded-xl p-6 text-center border border-slate-200">
                <TrendingUp className="w-10 h-10 text-brand-blue-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-slate-900">Full</div>
                <div className="text-slate-600 text-sm">Reporting</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">Platform Governance &amp; Operational Readiness</h2>
          <p className="text-center text-slate-600 mb-12 max-w-3xl mx-auto">
            Partner and agency access is role-based, auditable, and governed by published operational policies.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {governanceFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 bg-slate-50 rounded-lg p-5 border border-slate-100">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-red-500 flex-shrink-0 mt-2" />
                <span className="text-slate-700">{feature}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/policies" className="text-brand-blue-600 hover:text-brand-blue-800 font-medium">
              View All Policies →
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Modernize Your Workforce System?</h2>
          <p className="text-slate-300 mb-8">Schedule a demo to see how our platform can support your agency&apos;s goals.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/store/demos" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white px-8 py-4 rounded-lg font-bold transition">
              Schedule Demo <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-2 border border-white/30 text-white px-8 py-4 rounded-lg font-bold hover:bg-white/10 transition">
              Contact Us <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="tel:+13173143757" className="inline-flex items-center justify-center gap-2 border border-white/30 text-white px-8 py-4 rounded-lg font-bold hover:bg-white/10 transition">
              <Phone className="w-5 h-5" /> (317) 314-3757
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
