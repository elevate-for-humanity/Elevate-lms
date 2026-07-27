export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import { Check, X, ArrowRight, Users, Building2, Briefcase, Shield, Zap, BookOpen, BarChart3, MessageSquare } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Subscription Plans',
  keywords: ['subscription', 'platform access', 'workforce LMS', 'pricing', 'plans'],
  description: 'Elevate Workforce Platform subscription tiers for individuals, businesses, and government agencies.',
};

const subscriptionPlans = [
  {
    id: 'single-user',
    name: 'Single User',
    price: 99,
    period: 'month',
    description: 'For individual practitioners and sole trainers',
    icon: Users,
    color: 'slate',
    features: {
      included: [
        '1 admin/instructor account',
        'Up to 50 participants',
        '10 GB storage',
        'Basic course builder',
        'Standard certificates',
        'Email support',
        'Basic analytics',
        'Mobile accessible',
      ],
      excluded: [
        'API access',
        'Custom branding',
        'WIOA reporting',
        'Multi-location',
        'White-label portal',
      ],
    },
    cta: 'Start Free Trial',
    ctaLink: '/start',
  },
  {
    id: 'small-business',
    name: 'Small Business',
    price: 399,
    period: 'month',
    description: 'For training companies and small workforce teams',
    icon: Building2,
    color: 'green',
    popular: true,
    features: {
      included: [
        '10 admin/instructor accounts',
        'Up to 500 participants',
        '100 GB storage',
        'Advanced course builder',
        'Custom certificates',
        'Priority support',
        'Advanced analytics & reporting',
        'API access',
        'WIOA/ETPL reporting tools',
        'Employer portal access',
        'Apprenticeship tracking',
        'Email & chat support',
      ],
      excluded: [
        'Custom branding',
        'Multi-location management',
        'White-label portal',
        'Dedicated success manager',
      ],
    },
    cta: 'Start Free Trial',
    ctaLink: '/start',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 999,
    period: 'month',
    description: 'For workforce boards, government agencies, and large organizations',
    icon: Briefcase,
    color: 'blue',
    features: {
      included: [
        'Unlimited admin accounts',
        'Unlimited participants',
        '1 TB storage',
        'Full course builder + AI tools',
        'Custom certificates & credentials',
        'Dedicated success manager',
        'Enterprise analytics & BI',
        'Full API access + webhooks',
        'Complete WIOA/PIRL reporting',
        'Multi-location management',
        'White-label portal',
        'Custom branding',
        'SSO/SAML integration',
        'Audit logging',
        'Priority onboarding',
        'Phone, email & chat support',
      ],
      excluded: [],
    },
    cta: 'Contact Sales',
    ctaLink: '/contact',
  },
];

const comparisonFeatures = [
  { name: 'Admin accounts', single: '1', business: '10', enterprise: 'Unlimited' },
  { name: 'Participant limit', single: '50', business: '500', enterprise: 'Unlimited' },
  { name: 'Storage', single: '10 GB', business: '100 GB', enterprise: '1 TB' },
  { name: 'Course builder', single: 'Basic', business: 'Advanced + AI', enterprise: 'Full + AI' },
  { name: 'Certificates', single: 'Standard', business: 'Custom', enterprise: 'Custom + Blockchain' },
  { name: 'API access', single: false, business: true, enterprise: true },
  { name: 'Webhooks', single: false, business: true, enterprise: true },
  { name: 'WIOA reporting', single: false, business: true, enterprise: true },
  { name: 'PIRL reporting', single: false, business: false, enterprise: true },
  { name: 'Employer portal', single: false, business: true, enterprise: true },
  { name: 'Apprenticeship tracking', single: false, business: true, enterprise: true },
  { name: 'Multi-location', single: false, business: false, enterprise: true },
  { name: 'White-label', single: false, business: false, enterprise: true },
  { name: 'SSO/SAML', single: false, business: false, enterprise: true },
  { name: 'Audit logging', single: false, business: false, enterprise: true },
  { name: 'Dedicated success manager', single: false, business: false, enterprise: true },
  { name: 'Support', single: 'Email', business: 'Priority', enterprise: '24/7 Phone' },
];

function FeatureCell({ value, negative = false }: { value: string | boolean; negative?: boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className={`w-5 h-5 mx-auto ${negative ? 'text-slate-300' : 'text-green-600'}`} />
    ) : (
      <X className={`w-5 h-5 mx-auto ${negative ? 'text-green-600' : 'text-slate-300'}`} />
    );
  }
  return <span className="text-sm text-slate-600 text-center">{value}</span>;
}

export default function SubscriptionPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-green-700 to-green-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Elevate Workforce Platform</h1>
          <p className="text-xl text-green-100 max-w-2xl mx-auto mb-8">
            Choose the subscription that fits your organization. All plans include core workforce development tools.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/platform" className="bg-white text-green-700 font-bold py-3 px-6 rounded-lg hover:bg-green-50">
              View Platform Features
            </Link>
            <Link href="/contact" className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-500">
              Request Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {subscriptionPlans.map((plan) => {
              const Icon = plan.icon;
              const colorClasses = {
                slate: 'bg-slate-600 border-slate-300',
                green: 'bg-green-600 border-green-300 ring-2 ring-green-500 ring-offset-2',
                blue: 'bg-blue-600 border-blue-300',
              }[plan.color];
              
              return (
                <div key={plan.id} className={`bg-white rounded-2xl overflow-hidden shadow-lg border-2 ${plan.popular ? 'border-green-500 -translate-y-2' : 'border-slate-200'}`}>
                  {plan.popular && (
                    <div className="bg-green-600 text-white text-center text-sm font-bold py-1">
                      MOST POPULAR
                    </div>
                  )}
                  <div className={`p-8 ${plan.popular ? 'bg-green-50' : ''}`}>
                    <div className={`w-12 h-12 ${colorClasses} rounded-xl flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                    <p className="text-slate-600 text-sm mb-4">{plan.description}</p>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-slate-900">${plan.price}</span>
                      <span className="text-slate-500">/{plan.period}</span>
                    </div>
                    <Link
                      href={plan.ctaLink}
                      className={`block text-center py-3 px-6 rounded-lg font-bold ${
                        plan.popular
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  </div>
                  <div className="px-8 pb-8">
                    <h4 className="text-sm font-bold text-slate-900 mb-3">Included:</h4>
                    <ul className="space-y-2 mb-6">
                      {plan.features.included.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-slate-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {plan.features.excluded.length > 0 && (
                      <>
                        <h4 className="text-sm font-bold text-slate-900 mb-3">Not included:</h4>
                        <ul className="space-y-2">
                          {plan.features.excluded.map((feature) => (
                            <li key={feature} className="flex items-start gap-2">
                              <X className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-slate-400">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Compare Plans</h2>
            <p className="text-lg text-slate-600">See exactly what's included in each subscription tier</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-4 px-4 font-bold text-slate-900">Feature</th>
                  <th className="text-center py-4 px-4 font-bold text-slate-900">Single User<br/><span className="font-normal text-sm text-slate-500">$99/mo</span></th>
                  <th className="text-center py-4 px-4 font-bold text-green-700 bg-green-50 rounded-t-lg">Small Business<br/><span className="font-normal text-sm text-green-600">$399/mo</span></th>
                  <th className="text-center py-4 px-4 font-bold text-slate-900">Enterprise<br/><span className="font-normal text-sm text-slate-500">$999/mo</span></th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, index) => (
                  <tr key={feature.name} className={index % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                    <td className="py-3 px-4 text-slate-900 font-medium">{feature.name}</td>
                    <td className="py-3 px-4"><FeatureCell value={feature.single} /></td>
                    <td className="py-3 px-4 bg-green-50/50"><FeatureCell value={feature.business} /></td>
                    <td className="py-3 px-4"><FeatureCell value={feature.enterprise} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Government/Enterprise CTA */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-green-400" />
          <h2 className="text-3xl font-bold mb-4">Government & Enterprise Buyers</h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Need WIOA compliance documentation, security packages, custom contracts, or agency pricing? 
            Our team specializes in government procurement.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/government" className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-500">
              Government Procurement
            </Link>
            <Link href="/security" className="bg-slate-700 text-white font-bold py-3 px-6 rounded-lg hover:bg-slate-600">
              Security Documentation
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-2">What payment methods do you accept?</h3>
              <p className="text-slate-600">We accept all major credit cards, ACH transfers, and purchase orders for Enterprise customers.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-2">Can I change plans later?</h3>
              <p className="text-slate-600">Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-2">Is there a free trial?</h3>
              <p className="text-slate-600">Single User and Small Business plans include a 14-day free trial. Enterprise customers receive a personalized demo and pilot program.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-2">What about data ownership?</h3>
              <p className="text-slate-600">You retain full ownership of all data uploaded to the platform. We provide data export tools and follow strict data deletion protocols upon request.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-green-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-green-100 mb-8">Start your free trial or schedule a demo with our team.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/start" className="bg-white text-green-700 font-bold py-3 px-6 rounded-lg hover:bg-green-50">
              Start Free Trial
            </Link>
            <Link href="/contact" className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-500">
              Schedule Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
