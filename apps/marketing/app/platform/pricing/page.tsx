import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, ArrowRight, Shield, Users, BookOpen, Zap, Database, BarChart3, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Platform Pricing | Workforce Software',
  description: 'Workforce management platform pricing for training providers, workforce agencies, and employers. Scalable plans from startup to enterprise.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/platform/pricing' },
};

const PLANS = [
  {
    name: 'Starter',
    description: 'For small training providers and workforce programs',
    price: '$99',
    period: '/month',
    minUsers: 1,
    maxUsers: 25,
    features: [
      'Learner portal',
      'Basic course management',
      'Email support',
      'Standard reporting',
      '5 admin accounts',
    ],
    notIncluded: [
      'Advanced analytics',
      'Custom branding',
      'API access',
      'White-label',
    ],
  },
  {
    name: 'Professional',
    description: 'For growing workforce agencies and training organizations',
    price: '$399',
    period: '/month',
    minUsers: 26,
    maxUsers: 100,
    popular: true,
    features: [
      'Everything in Starter',
      'Advanced analytics dashboard',
      'Custom branding',
      'Email and phone support',
      '15 admin accounts',
      'WIOA compliance reporting',
      'Employer portal access',
    ],
    notIncluded: [
      'White-label solution',
      'Dedicated account manager',
    ],
  },
  {
    name: 'Enterprise',
    description: 'For large workforce systems, government agencies, and employers',
    price: 'Custom',
    period: '',
    minUsers: 101,
    maxUsers: null,
    features: [
      'Everything in Professional',
      'White-label solution',
      'Dedicated account manager',
      'API access',
      'Custom integrations',
      'On-premise deployment option',
      'Unlimited admin accounts',
      'SLA guarantee',
      'Custom training',
    ],
    notIncluded: [],
  },
];

export default function PlatformPricingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Platform Pricing</h1>
          <p className="text-xl text-slate-300 mb-8">
            Workforce management software for training providers, agencies, and employers.
            Scale from startup to enterprise.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/platform" className="bg-white text-slate-900 font-bold py-3 px-6 rounded-lg hover:bg-slate-100">
              View Platform Features
            </Link>
            <Link href="/contact?type=enterprise" className="border border-white text-white font-bold py-3 px-6 rounded-lg hover:bg-white/10">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Choose Your Plan</h2>
            <p className="text-lg text-slate-600">
              All plans include core workforce management features
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 border-2 ${
                  plan.popular
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                {plan.popular && (
                  <span className="inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
                    MOST POPULAR
                  </span>
                )}
                
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <p className="text-sm text-slate-600 mb-4">{plan.description}</p>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                  <span className="text-slate-600">{plan.period}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-600 mb-6">
                  <Users className="w-4 h-4" />
                  <span>
                    {plan.minUsers === 1 && plan.maxUsers === null
                      ? 'Unlimited users'
                      : plan.maxUsers === null
                      ? `${plan.minUsers}+ users`
                      : `${plan.minUsers}–${plan.maxUsers} users`}
                  </span>
                </div>

                <div className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {plan.name === 'Enterprise' ? (
                  <Link
                    href="/contact?type=enterprise"
                    className="block w-full text-center bg-slate-900 text-white font-bold py-3 px-6 rounded-lg hover:bg-slate-800"
                  >
                    Contact Sales
                  </Link>
                ) : (
                  <Link
                    href="/store/plans?license=Starter"
                    className={`block w-full text-center font-bold py-3 px-6 rounded-lg ${
                      plan.popular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    Get Started
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">What's Included</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <BookOpen className="w-10 h-10 text-blue-600 mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Course Management</h3>
              <p className="text-sm text-slate-600">
                Create and manage courses, assignments, assessments, and credentials.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <Users className="w-10 h-10 text-green-600 mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Learner Portal</h3>
              <p className="text-sm text-slate-600">
                Self-service portal for students to track progress, view assignments, and access resources.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <BarChart3 className="w-10 h-10 text-purple-600 mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Analytics</h3>
              <p className="text-sm text-slate-600">
                Track enrollment, completion, outcomes, and generate reports for stakeholders.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <Shield className="w-10 h-10 text-amber-600 mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Compliance</h3>
              <p className="text-sm text-slate-600">
                WIOA documentation, RAPIDS exports, and audit trails for workforce agencies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-6">
            {[
              {
                q: 'Can I switch plans later?',
                a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.',
              },
              {
                q: 'Is there a free trial?',
                a: 'Yes, all plans include a 14-day free trial. No credit card required to start.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards, ACH transfers, and invoicing for annual Enterprise contracts.',
              },
              {
                q: 'Can I get a custom quote for a specific use case?',
                a: 'Yes, contact our sales team for custom pricing for special circumstances, government contracts, or unique requirements.',
              },
            ].map((faq) => (
              <div key={faq.q} className="border-b border-slate-200 pb-6">
                <h3 className="font-bold text-slate-900 mb-2">{faq.q}</h3>
                <p className="text-slate-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-slate-300 mb-8">
            Start your free trial or talk to our team about your needs.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/store" className="bg-white text-slate-900 font-bold py-3 px-6 rounded-lg hover:bg-slate-100">
              Start Free Trial
            </Link>
            <Link href="/contact?type=sales" className="border border-white text-white font-bold py-3 px-6 rounded-lg hover:bg-white/10">
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
