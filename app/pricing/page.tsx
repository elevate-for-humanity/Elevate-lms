import { Metadata } from 'next';
import Link from 'next/link';
import { Check, X, ArrowRight, DollarSign, Building2, Users, GraduationCap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pricing | Elevate for Humanity',
  description: 'Workforce development pricing for individuals, businesses, and government agencies. Training programs, LMS platform, and apprenticeship management.',
  keywords: ['workforce training pricing', 'LMS pricing', 'apprenticeship platform cost', 'WIOA training', 'enterprise workforce'],
};

const PROGRAMS = [
  { name: 'Medical Assistant', price: 3995, duration: '16-20 weeks' },
  { name: 'Phlebotomy Technician', price: 1495, duration: '8-12 weeks' },
  { name: 'HVAC Technician', price: 4995, duration: '20-24 weeks' },
  { name: 'Barber Apprenticeship', price: 2995, duration: '12 months' },
  { name: 'Cosmetology', price: 3495, duration: '12 months' },
  { name: 'CDL Truck Driving', price: 5995, duration: '8-12 weeks' },
];

const PLATFORM_PLANS = [
  {
    name: 'Single User',
    price: 29,
    description: 'For individual learners',
    features: [
      'Single course access',
      'Basic progress tracking',
      'Email support',
      'Mobile app access',
      'Certificate upon completion',
    ],
    missing: ['Team management', 'Admin dashboard', 'API access', 'Custom branding', 'White-label'],
  },
  {
    name: 'Small Business',
    price: 149,
    description: 'For small training organizations',
    features: [
      'Up to 25 students',
      'Admin dashboard',
      'Progress reporting',
      'Email & chat support',
      'Custom branding',
      'Basic integrations',
    ],
    missing: ['Unlimited students', 'API access', 'White-label', 'Dedicated support'],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For government agencies & large organizations',
    features: [
      'Unlimited students',
      'Full admin dashboard',
      'Advanced reporting',
      'Dedicated support',
      'API access',
      'White-label options',
      'Custom integrations',
      'SLA guarantee',
      'Onboarding support',
    ],
    missing: [],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-green-700 to-green-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Training That Pays for Itself</h1>
          <p className="text-xl text-green-100 max-w-2xl mx-auto mb-8">
            Most programs qualify for WIOA funding. Businesses get tax credits. 
            Calculate your total cost and discover funding options.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/check-eligibility" className="bg-white text-green-700 font-bold py-3 px-6 rounded-lg hover:bg-green-50 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Check Eligibility
            </Link>
            <Link href="/roi" className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-500 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              See ROI Calculator
            </Link>
          </div>
        </div>
      </section>

      {/* Program Tuition */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Program Tuition</h2>
            <p className="text-lg text-slate-600">Prices shown before funding. Most students pay $0 out of pocket.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {PROGRAMS.map((program) => (
              <div key={program.name} className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900">{program.name}</h3>
                    <p className="text-sm text-slate-500">{program.duration}</p>
                  </div>
                  <GraduationCap className="w-6 h-6 text-green-600" />
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-slate-900">${program.price.toLocaleString()}</span>
                  <span className="text-slate-500 ml-2">full tuition</span>
                </div>
                <div className="text-sm text-slate-600 mb-4">
                  <p className="font-medium mb-2">Payment options:</p>
                  <ul className="space-y-1">
                    <li>• WIOA funding may cover 100%</li>
                    <li>• Payment plan from $50/week</li>
                    <li>• Employer sponsorship</li>
                  </ul>
                </div>
                <Link href={`/programs/${program.name.toLowerCase().replace(/\s+/g, '-')}`} className="text-green-600 font-semibold text-sm flex items-center gap-1 hover:underline">
                  View program <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>

          <div className="bg-green-50 rounded-xl p-6 text-center">
            <p className="text-green-800 font-medium">
              💡 <strong>Workforce Agency Partners:</strong> Contact us for group pricing and workforce development contracts.
            </p>
            <Link href="/for-agencies" className="text-green-700 font-semibold hover:underline ml-2">
              Agency pricing →
            </Link>
          </div>
        </div>
      </section>

      {/* Platform Plans */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Platform Plans</h2>
            <p className="text-lg text-slate-600">Build your own training platform or use ours</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {PLATFORM_PLANS.map((plan) => (
              <div key={plan.name} className={`rounded-xl p-6 border-2 ${plan.name === 'Enterprise' ? 'border-green-600 bg-green-50' : 'border-slate-200 bg-white'}`}>
                {plan.name === 'Enterprise' && (
                  <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 inline-block">MOST POPULAR</span>
                )}
                <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <p className="text-slate-600 text-sm mb-4">{plan.description}</p>
                <div className="mb-6">
                  {typeof plan.price === 'number' ? (
                    <>
                      <span className="text-4xl font-bold text-slate-900">${plan.price}</span>
                      <span className="text-slate-500">/month</span>
                    </>
                  ) : (
                    <span className="text-3xl font-bold text-green-600">{plan.price}</span>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-slate-700">{feature}</span>
                    </div>
                  ))}
                  {plan.missing.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm opacity-50">
                      <X className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-500">{feature}</span>
                    </div>
                  ))}
                </div>

                <Link 
                  href={plan.name === 'Enterprise' ? '/contact' : `/store/plans${plan.name === 'Single User' ? '?vertical=solo' : plan.name === 'Small Business' ? '?vertical=beauty' : ''}`}
                  className={`block text-center py-3 px-4 rounded-lg font-semibold ${plan.name === 'Enterprise' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}
                >
                  {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funding Section */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold mb-4">For Individuals</h2>
              <div className="space-y-4">
                <div className="bg-slate-800 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">🎯 WIOA Funding</h3>
                  <p className="text-slate-300 text-sm">Most programs qualify for 100% coverage through Workforce Innovation and Opportunity Act. Check eligibility in 2 minutes.</p>
                  <Link href="/check-eligibility" className="text-green-400 font-semibold text-sm hover:underline mt-2 inline-block">Check eligibility →</Link>
                </div>
                <div className="bg-slate-800 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">🏢 Employer Sponsorship</h3>
                  <p className="text-slate-300 text-sm">Many employers offer tuition reimbursement or sponsor employee training. Ask your HR department.</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">💳 Payment Plans</h3>
                  <p className="text-slate-300 text-sm">Weekly payments from $50/week. No credit check. Start training while you pay.</p>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4">For Organizations</h2>
              <div className="space-y-4">
                <div className="bg-slate-800 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">🏛️ Government Contracts</h3>
                  <p className="text-slate-300 text-sm">Workforce boards, Voc Rehab, and government agencies. Volume pricing and custom implementations available.</p>
                  <Link href="/for-agencies" className="text-green-400 font-semibold text-sm hover:underline mt-2 inline-block">Agency pricing →</Link>
                </div>
                <div className="bg-slate-800 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">🏭 Employer Partnerships</h3>
                  <p className="text-slate-300 text-sm">Custom apprenticeship programs. Build talent pipelines. Tax credits for hiring apprentices.</p>
                  <Link href="/contact" className="text-green-400 font-semibold text-sm hover:underline mt-2 inline-block">Partner with us →</Link>
                </div>
                <div className="bg-slate-800 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">🎓 Education Institutions</h3>
                  <p className="text-slate-300 text-sm">Schools and colleges can license our platform or use our curriculum. Launch programs in weeks.</p>
                  <Link href="/store/plans" className="text-green-400 font-semibold text-sm hover:underline mt-2 inline-block">View platform plans →</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <details className="bg-white rounded-lg p-6 border border-slate-200">
              <summary className="font-semibold cursor-pointer">How do I know if I qualify for WIOA funding?</summary>
              <p className="text-slate-600 mt-3">WIOA funding is available to individuals who are unemployed, underemployed, or need skills training for better employment. Complete our 2-minute eligibility check to find out if you qualify.</p>
            </details>
            <details className="bg-white rounded-lg p-6 border border-slate-200">
              <summary className="font-semibold cursor-pointer">What payment methods do you accept?</summary>
              <p className="text-slate-600 mt-3">We accept all major credit cards, ACH transfers, and payment plans. For enterprise customers, we offer invoicing and purchase orders.</p>
            </details>
            <details className="bg-white rounded-lg p-6 border border-slate-200">
              <summary className="font-semibold cursor-pointer">Is there a refund policy?</summary>
              <p className="text-slate-600 mt-3">Yes. If you withdraw within the first week of your program, you may be eligible for a full refund. Payment plans can be cancelled at any time with no penalty.</p>
            </details>
            <details className="bg-white rounded-lg p-6 border border-slate-200">
              <summary className="font-semibold cursor-pointer">Can my employer pay for my training?</summary>
              <p className="text-slate-600 mt-3">Absolutely. Many employers offer tuition reimbursement or will sponsor employee training. We can invoice your employer directly.</p>
            </details>
          </div>
          <div className="text-center mt-8">
            <Link href="/faq" className="text-green-600 font-semibold hover:underline">View all FAQs →</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-green-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start?</h2>
          <p className="text-xl text-green-100 mb-8">Check your funding eligibility in 2 minutes or schedule a demo for your organization.</p>
          <div className="flex gap-4 justify-center">
            <Link href="/check-eligibility" className="bg-white text-green-700 font-bold py-3 px-6 rounded-lg hover:bg-green-50">
              Check My Eligibility
            </Link>
            <Link href="/demos" className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-500">
              Schedule Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
