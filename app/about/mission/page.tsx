import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CheckCircle, ArrowRight, Heart, Users, Award, Briefcase } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Our Mission',
  description:
    `${PLATFORM_DEFAULTS.orgName} creates accessible career pathways, credential-bearing workforce training, and community support for underserved populations across Indiana and the Midwest.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/about/mission' },
  openGraph: {
    title: 'Our Mission',
    description:
      'Credential-bearing workforce training and community support for underserved populations.',
    images: [{ url: '/images/pages/mission-hero.webp', width: 1200, height: 630 }],
  },
};

const PILLARS = [
  {
    icon: Briefcase,
    title: 'Workforce Training',
    desc: 'Credential-bearing programs in healthcare, skilled trades, technology, and beauty — designed to move people from enrollment to employment in weeks, not years.',
  },
  {
    icon: Users,
    title: 'Community Support',
    desc: 'Wraparound services including housing navigation, eviction prevention, and supportive case management so learners can focus on training.',
  },
  {
    icon: Award,
    title: 'Credentialing & Compliance',
    desc: 'ETPL-approved, DOL-registered, WIOA/WRG/JRI-funded. Every program leads to a recognized industry credential or state license.',
  },
  {
    icon: Heart,
    title: 'Justice & Equity',
    desc: 'We specialize in serving justice-involved individuals, dislocated workers, SNAP/TANF recipients, and adults who need a clear, supported pathway into stable employment.',
  },
];

const CREDENTIALS = [
  'ETPL Approved — Indiana DWD',
  'DOL Registered Apprenticeship Sponsor',
  'WIOA / WRG / JRI Approved',
  'FSSA IMPACT Participating Provider',
  'IRS VITA Free Tax Prep Site',
  'SAM.gov Registered — CAGE: 0Q856',
  'Certiport Authorized Testing Center',
  'EPA 608 Certified Proctor',
];

export default function MissionPage() {
  // PUBLIC ROUTE: about/mission — no auth required.
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'About', href: '/about' }, { label: 'Our Mission' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0">
        {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
          <Image
            src="/images/pages/mission-hero.webp"
            alt="{PLATFORM_DEFAULTS.orgName} mission"
            fill
            className="object-cover opacity-40"
            priority
            sizes="100vw" placeholder="empty"
          />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 py-20">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400 mb-3">
            {PLATFORM_DEFAULTS.orgName}
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-5 leading-tight max-w-3xl">
            Accessible Career Pathways for People Who Need Them Most
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl">
            We deliver credential-bearing workforce training, community support, and employment
            services to underserved populations across Indiana and the Midwest.
          </p>
        </div>
      </section>

      {/* Mission statement */}
      <section className="py-16 px-4 bg-white border-b">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Why We Exist</h2>
            <p className="text-slate-600 mb-4 leading-relaxed">
              {PLATFORM_DEFAULTS.orgName} was founded on the belief that a person's zip code, background,
              or past should not determine their future. Too many adults in our communities are
              locked out of stable, well-paying careers — not because they lack ability, but because
              they lack access.
            </p>
            <p className="text-slate-600 mb-4 leading-relaxed">
              We close that gap. Through WIOA, Workforce Ready Grant, FSSA IMPACT, and JRI funding,
              we make career training free or low-cost for the people who need it most. Every
              program ends with a recognized credential or state license — not just a certificate of
              completion.
            </p>
            <p className="text-slate-600 leading-relaxed">
              We also operate Selfish Inc., a 501(c)(3) nonprofit providing VITA free tax
              preparation and community services to low-income households across Indianapolis.
            </p>
          </div>
          <div className="relative rounded-2xl overflow-hidden h-80">
            <Image
              src="/images/pages/mission-page-1.webp"
              alt={`\${PLATFORM_DEFAULTS.orgName} training`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw" placeholder="empty"
            />
          </div>
        </div>
      </section>

      {/* Four pillars */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">What We Do</h2>
          <p className="text-slate-600 mb-10">
            Four interconnected areas of work, all in service of one goal: stable employment and
            economic mobility for every learner we serve.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {PILLARS.map((p) => (
              <div key={p.title} className="bg-white rounded-xl border border-slate-200 p-7">
                <p.icon className="w-8 h-8 text-brand-red-600 mb-4" />
                <h3 className="font-bold text-slate-900 mb-2">{p.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who we serve */}
      <section className="py-16 px-4 bg-white border-b">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="relative rounded-2xl overflow-hidden h-72 order-2 md:order-1">
            <Image
              src="/images/pages/about-career-training.webp"
              alt="Learners in training"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw" placeholder="empty"
            />
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Who We Serve</h2>
            <ul className="space-y-3">
              {[
                'Adults seeking a career change or first career',
                'Dislocated workers and laid-off employees',
                'Justice-involved individuals re-entering the workforce',
                'SNAP and TANF recipients through FSSA IMPACT',
                'Veterans transitioning to civilian careers',
                'Community members who need wraparound support',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-slate-700">
                  <CheckCircle className="w-5 h-5 text-brand-red-600 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Credentials */}
      <section className="py-14 px-4 bg-slate-900">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-6">Approvals &amp; Credentials</h2>
          <div className="flex flex-wrap gap-3">
            {CREDENTIALS.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-sm font-medium text-slate-900"
              >
                <CheckCircle className="w-3.5 h-3.5 text-brand-green-400 shrink-0" /> {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Ready to Start?</h2>
          <p className="text-slate-600 mb-8 max-w-xl mx-auto">
            Explore our programs, check your funding eligibility, or apply today. Most programs
            start within weeks of enrollment.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-red-600 px-7 py-3.5 font-semibold text-white hover:bg-brand-red-700 transition"
            >
              Apply Now <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/programs"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-7 py-3.5 font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Browse Programs
            </Link>
            <Link
              href="/about/team"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-7 py-3.5 font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Meet the Team
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
