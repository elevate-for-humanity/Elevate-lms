import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Platform Licensing & Store | Elevate for Humanity',
  description: 'License the Elevate LMS platform for your school, workforce program, or organization. White-label, compliance-ready, and built for workforce training.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/store' },
};

const PRODUCTS = [
  { title: 'Starter License', price: '$299/mo', desc: 'Up to 50 learners. Full LMS, credential tracking, and employer portal. Ideal for small training providers.', img: '/images/pages/store-licensing-hero.jpg', href: '/store/licenses', cta: 'Get Started' },
  { title: 'Professional License', price: '$699/mo', desc: 'Up to 250 learners. Adds custom branding, WIOA compliance module, and priority support.', img: '/images/pages/store-licensing-managed-hero.jpg', href: '/store/licenses', cta: 'Get Started' },
  { title: 'Enterprise License', price: 'Custom', desc: 'Unlimited learners. White-label, API access, dedicated onboarding, and SLA support.', img: '/images/pages/store-licensing-enterprise-hero.jpg', href: '/store/licenses', cta: 'Contact Us' },
];

const FEATURES = [
  { title: 'WIOA Compliance Module', desc: 'Built-in PIRL reporting, eligibility tracking, and documentation for workforce-funded programs.', img: '/images/pages/store-compliance-wioa-hero.jpg' },
  { title: 'Credential Tracking', desc: 'Track every learner from enrollment through credential issuance. Integrates with external testing bodies.', img: '/images/pages/store-courses-hero.jpg' },
  { title: 'Employer Portal', desc: 'Employers post jobs, review candidates, and manage OJT agreements directly in the platform.', img: '/images/pages/store-digital-hero.jpg' },
  { title: 'Mobile-Ready', desc: 'Learners access courses, assignments, and credentials from any device. No app download required.', img: '/images/pages/mobile-app-page-1.jpg' },
  { title: 'Analytics Dashboard', desc: 'Real-time enrollment, completion, and outcome data for administrators and funders.', img: '/images/pages/store-addons-analytics-hero.jpg' },
  { title: 'White-Label Ready', desc: 'Your brand, your domain, your colors. Fully customizable for enterprise and partner deployments.', img: '/images/pages/store-addons-hero.jpg' },
];

const WHO = [
  { label: 'Training Providers', desc: 'Run your programs on a purpose-built workforce LMS.', img: '/images/pages/training-providers-page-1.jpg' },
  { label: 'Workforce Boards', desc: 'Manage WIOA participants, track outcomes, and report to funders.', img: '/images/pages/workforce-board-page-3.jpg' },
  { label: 'Employers', desc: 'Upskill your workforce and manage apprenticeship compliance.', img: '/images/pages/employers-page-2.jpg' },
  { label: 'Schools & CTE', desc: 'Deliver credential pathways with built-in testing center integration.', img: '/images/pages/courses-page-4.jpg' },
];

export default function StorePage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Video hero */}
      <section className="relative h-[320px] sm:h-[460px] overflow-hidden bg-slate-900">
        <video autoPlay muted loop playsInline poster="/images/pages/store-hero.jpg"
          className="absolute inset-0 w-full h-full object-cover opacity-60">
          <source src="/videos/dashboard-student-narrated.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
      </section>

      {/* Header */}
      <div className="bg-white border-b border-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">Platform Licensing</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-3">License the Platform</h1>
          <p className="text-slate-500 text-base sm:text-lg max-w-2xl leading-relaxed mb-6">
            The same LMS that powers Elevate for Humanity — available for your school, workforce program, or organization. WIOA-compliant, credential-ready, and built for workforce training.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/store/licenses" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors">
              View Pricing <ChevronRight className="w-4 h-4" />
            </Link>
            <Link href="/demo" className="inline-flex items-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold px-5 py-3 rounded-lg transition-colors text-sm">
              Request a Demo
            </Link>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <section className="py-14 bg-slate-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">Pricing</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-8">License Plans</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {PRODUCTS.map(({ title, price, desc, img, href, cta }) => (
              <div key={title} className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
                <div className="relative h-44 flex-shrink-0">
                  <Image src={img} alt={title} fill sizes="400px" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <p className="text-brand-red-300 font-extrabold text-lg">{price}</p>
                    <h3 className="font-bold text-white text-sm leading-tight">{title}</h3>
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <p className="text-slate-500 text-sm leading-relaxed flex-1">{desc}</p>
                  <Link href={href} className="mt-4 inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-5 py-2.5 rounded-lg transition-colors text-sm self-start">
                    {cta} <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-14 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">What's Included</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-8">Platform Features</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ title, desc, img }) => (
              <div key={title} className="border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
                <div className="relative h-36 flex-shrink-0">
                  <Image src={img} alt={title} fill sizes="400px" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
                  <h3 className="absolute bottom-3 left-4 right-4 font-bold text-white text-sm leading-tight">{title}</h3>
                </div>
                <div className="p-4 flex-1 bg-white">
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-14 bg-slate-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">Who It's For</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-8">Built for Workforce Organizations</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {WHO.map(({ label, desc, img }) => (
              <div key={label} className="rounded-xl overflow-hidden border border-slate-200 flex flex-col">
                <div className="relative h-36">
                  <Image src={img} alt={label} fill sizes="300px" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
                  <p className="absolute bottom-2 left-3 right-3 font-bold text-white text-xs leading-tight">{label}</p>
                </div>
                <div className="p-3 bg-white flex-1">
                  <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">See It in Action</h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                Request a live demo and we'll walk you through the platform with your use case in mind — whether you're a training provider, workforce board, or employer.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/demo" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm">
                  Request a Demo <ChevronRight className="w-4 h-4" />
                </Link>
                <Link href="/store/licenses" className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm">
                  View Pricing
                </Link>
              </div>
            </div>
            <div className="relative h-64 rounded-2xl overflow-hidden">
              <Image src="/images/pages/store-demo-video-hero.jpg" alt="Platform demo" fill sizes="600px" className="object-cover" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
