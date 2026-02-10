import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Check, Shield, Users, BarChart3, Lock, Headphones, ArrowRight, AlertTriangle } from 'lucide-react';
import { LicenseDemo } from '@/components/store/LicenseDemo';

export const metadata: Metadata = {
  title: 'Managed Enterprise LMS Platform | Elevate for Humanity',
  description: 'Run your organization on an enterprise LMS operated by Elevate for Humanity. Your branding, your domain, our infrastructure.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/store/licenses/managed-platform',
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
    href: '/store/licenses/checkout/efh-core-platform',
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
    href: '/store/licenses/checkout/school-license',
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

export default function ManagedPlatformPage() {
  return (
    <div className="min-h-screen bg-slate-950">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Store", href: "/store" }, { label: "Managed Platform" }]} />
      </div>
{/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 mb-6">
              <Shield className="w-4 h-4 text-orange-500" />
              <span className="text-orange-400 text-sm font-medium">Managed Enterprise LMS</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-white mb-6">
              Your Platform.<br />
              <span className="text-orange-500">Our Infrastructure.</span>
            </h1>
            
            <p className="text-xl text-slate-300 mb-4">
              This is a managed platform license. Elevate for Humanity operates the LMS; 
              the licensee operates their organization within it.
            </p>
            <p className="text-slate-400 mb-8">
              Your branding, your domain, your programs — backed by our technology and operations team.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="#plans"
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-8 py-4 rounded-lg transition"
              >
                View Plans & Get Started
              </Link>
              <Link
                href="/store/demo"
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-8 py-4 rounded-lg transition"
              >
                See Platform Tour
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-16 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white text-center mb-12">What You Get</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, title: 'Your Branding', desc: 'Your logo, colors, and domain. It looks like your platform.' },
              { icon: Lock, title: 'We Operate', desc: 'We handle hosting, security, updates, backups, and maintenance.' },
              { icon: BarChart3, title: 'Your Data', desc: 'Your learners, your programs, your reports. Fully yours to manage.' },
              { icon: Headphones, title: 'Our Support', desc: 'Dedicated support team. We keep it running so you can focus on training.' },
            ].map((item) => (
              <div key={item.title} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <item.icon className="w-10 h-10 text-orange-500 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.desc}</p>
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
      <section className="py-12 bg-slate-800/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
            <h3 className="text-xl font-bold text-white mb-6">This is a Managed Platform License</h3>
            
            <div className="grid md:grid-cols-2 gap-8 mb-6">
              <div>
                <h4 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  What You Get
                </h4>
                <ul className="space-y-2 text-slate-300 text-sm">
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
                <h4 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  What This is NOT
                </h4>
                <ul className="space-y-2 text-slate-300 text-sm">
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

            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-600">
              <p className="text-slate-300 text-sm">
                <strong className="text-white">Continued access requires an active subscription.</strong>{' '}
                Non-payment results in total platform lockout. Your data is retained but access is revoked until billing is resolved.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section id="plans" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-4">Pricing</h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            All plans include your custom domain, branding, and full platform features. 
            Annual billing preferred. Setup fee covers onboarding and configuration.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-slate-800 rounded-2xl p-8 border ${
                  plan.popular ? 'border-orange-500' : 'border-slate-700'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-sm font-bold px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}

                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-slate-400 text-sm mb-6">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-black text-white">${plan.monthlyPrice.toLocaleString()}</span>
                  <span className="text-slate-400">/month</span>
                  <p className="text-sm text-slate-500 mt-1">
                    + ${plan.setupFee.toLocaleString()} one-time setup
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-slate-300 text-sm">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`block text-center py-3 px-6 rounded-lg font-bold transition ${
                    plan.popular
                      ? 'bg-orange-600 hover:bg-orange-700 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-slate-500 text-sm mt-8">
            Annual contracts preferred. Custom pricing available for multi-year agreements.
          </p>
        </div>
      </section>

      {/* Credential Add-ons */}
      <section className="py-16 bg-slate-900/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white text-center mb-4">Credential Add-ons</h2>
          <p className="text-slate-400 text-center mb-8 max-w-2xl mx-auto">
            Need ETPL listing, WIOA compliance, or state board recognition? 
            These are available as separate paid add-ons with approval required.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'ETPL Listing Support', desc: 'Assistance with Eligible Training Provider List applications', price: 'From $2,500' },
              { name: 'WIOA Compliance Package', desc: 'Reporting templates and compliance documentation', price: 'From $1,500/year' },
              { name: 'State Board Recognition', desc: 'Support for state workforce board approval processes', price: 'Custom quote' },
            ].map((addon) => (
              <div key={addon.name} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-bold text-white mb-2">{addon.name}</h3>
                <p className="text-slate-400 text-sm mb-4">{addon.desc}</p>
                <p className="text-orange-400 font-semibold">{addon.price}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-slate-500 text-sm mt-8">
            Credential add-ons require active Managed Platform License and approval process.
            Credential delegation is a revocable operational license, not a transfer of authority.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Launch Your Platform?</h2>
          <p className="text-slate-400 mb-8">
            Choose a plan above and start onboarding immediately.
          </p>
          <Link
            href="#plans"
            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold px-8 py-4 rounded-lg transition"
          >
            Choose a Plan
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-4 text-sm text-slate-500">
            <Link href="/contact?topic=enterprise-review" className="text-slate-400 hover:text-white">Enterprise / Government review</Link>
          </p>
        </div>
      </section>

      {/* Alternative - Source Use */}
      <section className="py-12 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-500 text-sm mb-4">
            Need to deploy on your own infrastructure for compliance reasons?
          </p>
          <Link
            href="/store/licenses/source-use"
            className="text-slate-400 hover:text-white text-sm underline"
          >
            View Restricted Source-Use License (Enterprise Only) →
          </Link>
        </div>
      </section>

      {/* Footer - Master Line */}
      <section className="py-8 border-t border-slate-800 bg-slate-900/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-500 text-xs">
            All products are licensed access to platforms operated by Elevate for Humanity. 
            Ownership of software, infrastructure, and intellectual property is not transferred.
          </p>
        </div>
      </section>
    </div>
  );
}
