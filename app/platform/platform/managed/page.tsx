export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import {
  Shield,
  Headphones,
  Clock,
  BarChart3,
  Server,
  RefreshCw,
  Lock,
CheckCircle, } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { createClient } from '@/lib/supabase/server';
export const metadata: Metadata = {
  title: 'Managed Platform | Elevate Workforce OS',
  description:
    'Fully managed workforce operating system. We operate it, you use it. Zero engineering burden, guaranteed uptime, compliance reporting included.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/platform/managed',
  },
};

const managedServices = [
  { icon: Shield, title: '99.9% Uptime SLA', desc: 'Guaranteed availability with proactive monitoring and failover.' },
  { icon: Headphones, title: 'Dedicated Support', desc: 'Priority support with a named account manager for your organization.' },
  { icon: Clock, title: 'Same-Day Updates', desc: 'Security patches and feature updates deployed automatically.' },
  { icon: BarChart3, title: 'Compliance Reporting', desc: 'Automated DOL/DWD reports generated on your schedule.' },
  { icon: Server, title: 'Managed Infrastructure', desc: 'Hosting, backups, SSL, CDN — all handled for you.' },
  { icon: RefreshCw, title: 'Continuous Improvement', desc: 'New features and improvements rolled out without disruption.' },
];

const includedFeatures = [
  'Full platform access (all 7 portals)',
  'Automated enrollment orchestration',
  'WIOA/WRG/JRI compliance reporting',
  'Credential issuance and verification',
  'Employer pipeline integration',
  'Progress tracking and nudges',
  'Audit logs and activity tracking',
  'Data exports and API access',
];

const pricingTiers = [
  {
    name: 'Starter',
    price: '$1,500',
    period: '/mo',
    desc: 'For small training providers getting started',
    features: ['Up to 100 active learners', 'Core LMS features', 'Basic compliance reports', 'Email support', '99.5% uptime SLA'],
    popular: false,
  },
  {
    name: 'Professional',
    price: '$2,500',
    period: '/mo',
    desc: 'For established providers with multiple programs',
    features: ['Up to 500 active learners', 'All platform features', 'Advanced compliance automation', 'Priority support', '99.9% uptime SLA', 'Custom branding'],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For large organizations and workforce boards',
    features: ['Unlimited learners', 'Multi-org management', 'Dedicated infrastructure', 'Custom integrations', 'Named account manager', 'Quarterly business reviews'],
    popular: false,
  },
];

export default async function ManagedPlatformPage() {
  const supabase = await createClient();
  const { data: dbRows } = await supabase.from('system_settings').select('*').limit(50);

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs items={[{ label: 'Platform', href: '/platform' }, { label: 'Managed Platform' }]} />
      <div className="max-w-7xl mx-auto px-4 pb-2">
        <p className="text-sm text-slate-600 font-medium">Part of the <a href="/platform" className="text-brand-red-600 hover:underline">Elevate Workforce Operating System</a></p>
      </div>

      {/* Hero */}
      <section className="bg-slate-900 text-white py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-brand-red-400 font-bold text-sm uppercase tracking-widest mb-4">Managed Platform</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">We Operate It. You Use It.</h1>
          <p className="mt-6 text-lg sm:text-xl text-white/90 max-w-3xl mx-auto">
            Zero engineering burden. Guaranteed uptime. Compliance reporting included. Focus on training — we handle the infrastructure.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/store/licenses/managed-platform" className="px-8 py-4 bg-brand-red-600 text-white font-bold rounded-lg hover:bg-brand-red-700 transition-colors">
              Get Started
            </Link>
            <Link href="/store/demo" className="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-colors">
              See Platform Tour
            </Link>
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-slate-900 text-center mb-12">What&apos;s Included</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {includedFeatures.map((f) => (
              <div key={f} className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span className="text-slate-900 font-medium">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Managed services */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-slate-900 text-center mb-12">Managed Services</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {managedServices.map((s) => (
              <div key={s.title} className="bg-white rounded-xl p-6 shadow-sm">
                <s.icon className="w-10 h-10 text-brand-red-600 mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-slate-800">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-slate-900 text-center mb-4">Pricing</h2>
          <p className="text-lg text-slate-800 text-center max-w-2xl mx-auto mb-12">
            Transparent pricing. No hidden fees. Scale as you grow.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-xl p-8 ${
                  tier.popular
                    ? 'bg-slate-900 text-white ring-2 ring-brand-red-600'
                    : 'bg-white border border-slate-200'
                }`}
              >
                {tier.popular && (
                  <span className="inline-block bg-brand-red-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
                    Most Popular
                  </span>
                )}
                <h3 className={`text-2xl font-bold ${tier.popular ? 'text-white' : 'text-slate-900'}`}>{tier.name}</h3>
                <div className="mt-2">
                  <span className={`text-4xl font-black ${tier.popular ? 'text-white' : 'text-slate-900'}`}>{tier.price}</span>
                  <span className={tier.popular ? 'text-white/70' : 'text-slate-700'}>{tier.period}</span>
                </div>
                <p className={`mt-2 text-sm ${tier.popular ? 'text-white/80' : 'text-slate-800'}`}>{tier.desc}</p>
                <ul className="mt-6 space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      <span className={tier.popular ? 'text-white/90' : 'text-slate-800'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/contact"
                  className={`mt-8 block text-center px-6 py-3 rounded-lg font-bold transition-colors ${
                    tier.popular ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {tier.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
