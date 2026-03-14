
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Phone, ArrowRight, HelpCircle } from 'lucide-react';

export const metadata = {
  title: 'Pricing | Supersonic Fast Cash',
  description:
    'Clear, upfront pricing for professional tax preparation services. Choose the plan that fits your tax situation.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/supersonic-fast-cash/pricing',
  },
};

const taxPrepPlans = [
  {
    name: 'Basic',
    price: 79,
    description: 'Simple tax situations with W-2 income only',
    features: [
      'Federal tax return preparation',
      'State tax return (one state)',
      'W-2 income',
      'Standard deduction',
      'E-file included',
      'Refund tracking',
    ],
    popular: false,
  },
  {
    name: 'Standard',
    price: 149,
    description: 'Most common filing needs with deductions',
    features: [
      'Everything in Basic, plus:',
      'Itemized deductions',
      'Dependents & child tax credit',
      'Education credits',
      'Retirement contributions',
      'HSA/FSA reporting',
      'Unemployment income',
    ],
    popular: true,
  },
  {
    name: 'Premium',
    price: 249,
    description: 'Complex returns with self-employment or investments',
    features: [
      'Everything in Standard, plus:',
      'Self-employment income (1099)',
      'Business expenses & deductions',
      'Investment income (stocks, crypto)',
      'Rental property income',
      'Multiple state returns',
      'Priority support',
    ],
    popular: false,
  },
];

export default function PricingPage() {

  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Pricing" }]} />
      </div>
{/* Hero */}
      <section className="bg-brand-blue-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-semibold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the plan that matches your tax situation. No hidden fees.
          </p>
        </div>
      </section>

      {/* Tax Preparation Pricing */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-10">
            Tax Preparation Plans
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {taxPrepPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white border rounded-xl p-6 shadow-sm ${
                  plan.popular
                    ? 'border-brand-blue-600 ring-2 ring-brand-blue-600'
                    : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-brand-blue-600 text-white text-sm font-medium px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-gray-900">
                      ${plan.price}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-slate-400 flex-shrink-0">•</span>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/supersonic-fast-cash/start"
                  className={`block w-full text-center py-3 px-4 rounded-lg font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-brand-red-600 text-white hover:bg-brand-red-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-10">
            All Plans Include
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              'Secure e-filing to IRS',
              'Accuracy review before submission',
              'Refund status tracking',
              'Digital copy of your return',
              'Encrypted data protection',
              'Email support',
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span className="text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Optional Refund Advance */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Optional: Tax Refund Cash Advance
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto">
              After completing your tax return, eligible filers may choose a refund-based 
              cash advance through our banking partners.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-10">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="text-center mb-4">
                <span className="inline-block bg-brand-green-100 text-brand-green-800 px-3 py-1 rounded-full text-sm font-medium mb-3">
                  Small Advance
                </span>
                <h3 className="text-xl font-semibold text-gray-900">$250 – $1,000</h3>
                <p className="text-sm text-gray-500 mt-1">Bank fees apply</p>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  Same-day funding available
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  Subject to bank approval
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="text-center mb-4">
                <span className="inline-block bg-brand-blue-100 text-brand-blue-800 px-3 py-1 rounded-full text-sm font-medium mb-3">
                  Larger Advance
                </span>
                <h3 className="text-xl font-semibold text-gray-900">$1,250 – $7,500</h3>
                <p className="text-sm text-gray-500 mt-1">Cost varies by bank</p>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  Terms disclosed before funding
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  Deducted from refund
                </li>
              </ul>
            </div>
          </div>

          {/* Disclosures */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Important Disclosures</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Refund advances are <strong>optional</strong> and not required to file</li>
              <li>• Not all taxpayers qualify for an advance</li>
              <li>• Approval decisions are made by the bank, not the tax preparer</li>
              <li>• Advance costs are separate from tax preparation fees</li>
            </ul>
          </div>

          <div className="text-center mt-8">
            <Link
              href="/supersonic-fast-cash/cash-advance"
              className="inline-flex items-center text-brand-blue-600 font-medium hover:text-brand-blue-700"
            >
              Learn more about refund advances
              <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-10">
            Pricing Questions
          </h2>

          <div className="space-y-6">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">When do I pay?</h3>
                  <p className="text-gray-600 text-sm">
                    You can complete your return for free. Payment is only required 
                    when you're ready to file. You may also choose to pay from your 
                    refund (additional fee applies).
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">What if I'm not sure which plan I need?</h3>
                  <p className="text-gray-600 text-sm">
                    Start with Basic. If your situation requires a higher tier, 
                    we'll let you know before you file and you can upgrade.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Are there any hidden fees?</h3>
                  <p className="text-gray-600 text-sm">
                    No. The price shown is what you pay for tax preparation. 
                    Optional services like additional states or refund advances 
                    are clearly disclosed before you choose them.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Questions About Pricing?
          </h2>
          <p className="text-gray-600 mb-8">
            Contact us for a custom quote based on your specific tax situation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/support"
              className="inline-flex items-center justify-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <Phone className="w-5 h-5" />
              (317) 314-3757
            </a>
            <Link
              href="/supersonic-fast-cash/book-appointment"
              className="inline-flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-900 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Schedule Appointment
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-brand-blue-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-semibold text-white mb-4">
            Ready to file?
          </h2>
          <p className="text-brand-blue-200 mb-8">
            Start your return for free. Pay only when you file.
          </p>
          <Link
            href="/supersonic-fast-cash/start"
            className="inline-flex items-center justify-center px-8 py-4 bg-brand-red-600 text-white font-semibold rounded-lg hover:bg-brand-red-700 transition-colors"
          >
            Start Tax Preparation
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
