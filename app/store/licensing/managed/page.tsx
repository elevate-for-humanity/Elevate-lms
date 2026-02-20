export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Check, Shield, Users, BarChart3, Lock, Headphones, ArrowRight, AlertTriangle } from 'lucide-react';
import { LicenseDemo } from '@/components/store/LicenseDemo';

import { createClient } from '@/lib/supabase/server';
export const metadata: Metadata = {
  title: 'Managed Enterprise LMS Platform | Elevate for Humanity',
  description: 'Run your organization on an enterprise LMS operated by Elevate for Humanity. Your branding, your domain, our infrastructure.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/store/licensing/managed',
  },
};

const plans = [
  {
    id: 'growth',
    name: 'Growth',
    description: 'For training providers scaling operations',
    monthlyPrice: 1500,
    setupFee: 7500,
    features: [
      'Up to 500 active learners',
      'Your custom domain',
      'Your branding & logo',
      'Full LMS features',
      'Course & enrollment management',
      'Progress tracking & certificates',
      'Analytics dashboard',
      'Email support',
    ],
    cta: 'Start Growth Plan',
    href: '/store/licensing/checkout/efh-core-platform',
    popular: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For established organizations',
    monthlyPrice: 2500,
    setupFee: 10000,
    features: [
      'Up to 2,000 active learners',
      'Your custom domain',
      'Your branding & logo',
      'Full LMS + workforce tools',
      'Partner & employer dashboards',
      'Compliance reporting',
      'API access',
      'Priority support',
      'Dedicated onboarding',
    ],
    cta: 'Start Professional Plan',
    href: '/store/licensing/checkout/school-license',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations & agencies',
    monthlyPrice: 3500,
    setupFee: 15000,
    features: [
      'Unlimited learners',
      'Your custom domain',
      'Your branding & logo',
      'Full platform access',
      'Dedicated success manager',
      'Custom integrations',
      'SLA guarantee',
      'Advanced compliance reporting',
      'Credential add-ons available',
      'Multi-location support',
    ],
    cta: 'Talk to Licensing',
    href: '/contact?subject=Managed%20Platform%20-%20Enterprise',
    popular: false,
  },
];

export default async function ManagedPlatformPage() {
  const supabase = await createClient();
  const { data: dbRows } = await supabase.from('products').select('*').limit(50);

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Store", href: "/store" }, { label: "Managed Platform" }]} />
      </div>
{/* Hero */}
      <section className="relative py-20 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-brand-red-600/10 border border-brand-red-600/20 rounded-full px-4 py-2 mb-6">
              <Shield className="w-4 h-4 text-brand-red-400" />
              <span className="text-brand-red-600 text-sm font-medium">Managed Enterprise LMS</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">
              Your Platform.<br />
              <span className="text-brand-red-400">Our Infrastructure.</span>
            </h1>
            
            <p className="text-xl text-slate-700 mb-4">
              Elevate for Humanity operates the LMS. You operate your organization within it.
            </p>
            <p className="text-slate-600 mb-8">
              Your branding, your domain, your programs — backed by our technology and operations team.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="#plans"
                className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-lg transition"
              >
                View Plans & Pricing
              </Link>
              <Link
                href="/store/demos"
                className="border border-slate-300 hover:bg-slate-50 text-slate-900 font-bold px-8 py-4 rounded-lg transition border border-white/20"
              >
                See Platform Demo
              </Link>
            </div>

            {/* Platform screenshot */}
            <div className="mt-12 max-w-4xl mx-auto">
              <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden shadow-2xl border border-slate-200">
                <Image
                  src="/images/demos/admin-dashboard-thumb.jpg"
                  alt="Elevate managed platform dashboard"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 80vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-12">What You Get</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: Users, title: 'Your Branding', desc: 'Your logo, colors, and domain. Students and employers see your organization — the platform is invisible.', img: '/images/demos/lms-overview-thumb.jpg' },
              { icon: BarChart3, title: 'Your Data', desc: 'Your learners, your programs, your reports. Full data export anytime. You own everything.', img: '/images/demos/admin-dashboard-thumb.jpg' },
              { icon: Lock, title: 'We Operate', desc: 'We handle hosting, security, updates, backups, and maintenance. 99.9% uptime SLA.', img: '/images/heroes-hq/how-it-works-hero.jpg' },
              { icon: Headphones, title: 'Our Support', desc: 'Dedicated support team. We keep it running so you can focus on training people.', img: '/images/heroes-hq/career-services-hero.jpg' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="relative h-36">
                  <Image src={item.img} alt={item.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <item.icon className="w-5 h-5 text-brand-red-600" />
                    <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                  </div>
                  <p className="text-slate-600 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      <LicenseDemo
        tourId="institution_admin"
        licenseName="Managed Platform"
        workflows={[
          'Set up your organization profile and branding',
          'Import or create your first training program',
          'Enroll learners and assign courses',
          'Run a WIOA compliance report',
          'Invite employer partners to the portal',
        ]}
        ctaHref="/store/trial"
        ctaLabel="Start 14-Day Trial"
      />

      {/* License Terms - Clear */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-6">This is a Managed Platform License</h3>
            
            <div className="grid md:grid-cols-2 gap-8 mb-6">
              <div>
                <h4 className="text-brand-green-400 font-semibold mb-3 flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  What You Get
                </h4>
                <ul className="space-y-2 text-slate-700 text-sm">
                  <li>• Enterprise LMS with your branding</li>
                  <li>• Custom domain (yourorg.com)</li>
                  <li>• Course creation & management</li>
                  <li>• Student enrollment & tracking</li>
                  <li>• Certificates & credentials</li>
                  <li>• Analytics & reporting</li>
                  <li>• Hosting, security, backups included</li>
                  <li>• Ongoing updates & maintenance</li>
                </ul>
              </div>
              <div>
                <h4 className="text-brand-red-400 font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  What This is NOT
                </h4>
                <ul className="space-y-2 text-slate-700 text-sm">
                  <li>• Software ownership</li>
                  <li>• Source code access</li>
                  <li>• Self-hosted deployment</li>
                  <li>• Lifetime or perpetual access</li>
                  <li>• White-label rights</li>
                  <li>• Resale or sublicensing rights</li>
                  <li>• Automatic credential authority</li>
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <p className="text-slate-700 text-sm">
                <strong className="text-slate-900">Continued access requires an active subscription.</strong>{' '}
                Non-payment results in total platform lockout. Your data is retained but access is revoked until billing is resolved.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section id="plans" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">Pricing</h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            All plans include your custom domain, branding, and full platform features. 
            Annual billing preferred. Setup fee covers onboarding and configuration.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl p-8 border ${
                  plan.popular ? 'border-brand-red-600' : 'border-slate-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-red-600 text-white text-sm font-bold px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}

                <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <p className="text-slate-600 text-sm mb-6">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-black text-slate-900">${plan.monthlyPrice.toLocaleString()}</span>
                  <span className="text-slate-600">/month</span>
                  <p className="text-sm text-slate-600 mt-1">
                    ${(plan.monthlyPrice * 12).toLocaleString()}/year + ${plan.setupFee.toLocaleString()} one-time setup
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Stripe, Affirm & Sezzle BNPL accepted</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-slate-700 text-sm">
                      <Check className="w-5 h-5 text-brand-green-500 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/store/trial"
                  className={`block text-center py-3 px-6 rounded-lg font-bold transition ${
                    plan.popular
                      ? 'bg-brand-red-600 hover:bg-brand-red-700 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                  }`}
                >
                  Start 14-Day Free Trial
                </Link>
                <Link
                  href={plan.href}
                  className="block text-center text-sm text-slate-500 font-medium mt-2 hover:underline"
                >
                  Or purchase directly →
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-slate-600 text-sm mt-8">
            Annual contracts preferred. Custom pricing available for multi-year agreements.
          </p>
        </div>
      </section>

      {/* Onboarding Timeline */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-4">From signup to live in 2 weeks</h2>
          <p className="text-slate-600 text-center mb-10 max-w-2xl mx-auto">
            Every step is self-service. No calls, no waiting for approvals.
          </p>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { day: 'Day 1', title: 'Trial starts', desc: 'Your branded instance is provisioned instantly. Log in, explore the admin dashboard.' },
              { day: 'Days 2-5', title: 'Configure', desc: 'Add your programs, set up user roles, import student data. All self-service.' },
              { day: 'Days 6-10', title: 'Test', desc: 'Enroll test learners, run compliance reports, invite employer partners.' },
              { day: 'Day 14', title: 'Go live', desc: 'Choose a plan at checkout. Your trial data carries over. Launch to your organization.' },
            ].map((step, i) => (
              <div key={step.day} className="relative">
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 h-full">
                  <span className="text-brand-red-600 text-xs font-bold uppercase">{step.day}</span>
                  <h3 className="font-bold text-slate-900 mt-1 mb-1">{step.title}</h3>
                  <p className="text-slate-600 text-sm">{step.desc}</p>
                </div>
                {i < 3 && <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-0.5 bg-slate-300" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credential Add-ons */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-4">Credential Add-ons</h2>
          <p className="text-slate-600 text-center mb-8 max-w-2xl mx-auto">
            Need ETPL listing, WIOA compliance, or state board recognition? 
            These are available as separate paid add-ons with approval required.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'ETPL Listing Support', desc: 'Assistance with Eligible Training Provider List applications', price: 'From $2,500' },
              { name: 'WIOA Compliance Package', desc: 'Reporting templates and compliance documentation', price: 'From $1,500/year' },
              { name: 'State Board Recognition', desc: 'Support for state workforce board approval processes', price: 'Custom quote' },
            ].map((addon) => (
              <div key={addon.name} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-2">{addon.name}</h3>
                <p className="text-slate-600 text-sm mb-4">{addon.desc}</p>
                <p className="text-brand-red-600 font-semibold">{addon.price}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-slate-600 text-sm mt-8">
            Credential add-ons require active Managed Platform License and approval process.
            Credential delegation is a revocable operational license, not a transfer of authority.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-brand-red-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Start your 14-day free trial now.</h2>
          <p className="text-white/80 mb-8">
            No credit card. Full platform access. Your branded instance is provisioned instantly.
          </p>
          <Link
            href="/store/trial"
            className="inline-flex items-center gap-2 bg-white text-brand-red-600 font-bold px-8 py-4 rounded-lg hover:bg-slate-50 transition"
          >
            Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-4 text-sm text-white/60">
            Already decided? <Link href="#plans" className="text-white/80 hover:text-white underline">Purchase directly</Link>
          </p>
        </div>
      </section>

      {/* Alternative - Source Use */}
      <section className="py-12 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-600 text-sm mb-4">
            Need to deploy on your own infrastructure for compliance reasons?
          </p>
          <Link
            href="/store/licensing/enterprise"
            className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-medium"
          >
            View Enterprise Source-Use License →
          </Link>
        </div>
      </section>

      {/* Legal */}
      <section className="py-8 border-t border-slate-200 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-600 text-xs">
            All products are licensed access to platforms operated by Elevate for Humanity. 
            Ownership of software, infrastructure, and intellectual property is not transferred.
          </p>
        </div>
      </section>
    </div>
  );
}
