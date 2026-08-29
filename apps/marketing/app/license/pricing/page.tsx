import { Metadata } from 'next';
import Link from 'next/link';
import { createPublicClient } from '@/lib/supabase/public';
import { CheckCircle, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pricing,
  description: 'Transparent pricing for workforce development licensing, training programs, and enterprise solutions.',
};

export const revalidate = 3600;

const LICENSE_TIERS = [
  {
    name: 'Starter',
    price: 500,
    period: 'month',
    description: 'Perfect for small training organizations',
    features: ['Up to 50 students', 'Core LMS features', 'Email support', 'Basic reporting'],
  },
  {
    name: 'Professional',
    price: 1500,
    period: 'month',
    description: 'For growing training providers',
    features: ['Up to 250 students', 'Advanced LMS features', 'Priority support', 'Custom branding', 'API access'],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 5000,
    period: 'month',
    description: 'For large organizations',
    features: ['Unlimited students', 'Full platform access', 'Dedicated support', 'White-label options', 'Custom integrations', 'On-site training'],
  },
];

export default async function PricingPage() {
  const supabase = createPublicClient();

  const { data: dbTiers } = await supabase
    .from('license_tiers')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true });

  const { data: faqs } = await supabase
    .from('faqs')
    .select('*')
    .eq('category', 'licensing')
    .eq('is_active', true)
    .order('order', { ascending: true });

  const displayTiers = dbTiers && dbTiers.length > 0 ? dbTiers : LICENSE_TIERS;

  const defaultFaqs = [
    { question: "What's included in the license?", answer: 'All licenses include the core platform, training, and support. Higher tiers include additional features and customization.' },
    { question: 'Can I upgrade later?', answer: "Yes, you can upgrade your license at any time. We'll prorate the difference." },
    { question: 'Is there a monthly option?', answer: 'Yes, we offer monthly billing at a slightly higher rate. Contact us for details.' },
  ];

  const displayFaqs = faqs && faqs.length > 0 ? faqs : defaultFaqs;

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">Choose the license that fits your organization's needs. All plans include core platform features and support.</p>
        </div>
      </section>
      
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {displayTiers.map((tier: any, i: number) => (
              <div key={i} className={`bg-white rounded-2xl p-8 shadow-sm ${tier.popular ? 'ring-2 ring-brand-blue-600' : ''}`}>
                {tier.popular && <span className="bg-brand-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</span>}
                <h3 className="text-xl font-bold text-slate-900 mt-4 mb-2">{tier.name}</h3>
                <p className="text-slate-600 text-sm mb-4">{tier.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-slate-900">${typeof tier.price === 'number' ? tier.price.toLocaleString() : tier.price}</span>
                  <span className="text-slate-500">/{tier.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {(tier.features || []).map((feature: string, j: number) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/contact" className="block w-full text-center bg-brand-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-brand-blue-700 transition-colors">
                  Get Started
                </Link>
              </div>
            ))}
          </div>
          
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Frequently Asked Questions</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {displayFaqs.map((faq: any, i: number) => (
                <div key={i}>
                  <h4 className="font-semibold text-slate-900 mb-2">{faq.question}</h4>
                  <p className="text-slate-600 text-sm">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-brand-blue-700 rounded-2xl p-8 text-white text-center mt-12">
            <h2 className="text-2xl font-bold mb-4">Need a Custom Solution?</h2>
            <p className="text-blue-100 mb-6">Contact us for volume discounts or enterprise pricing.</p>
            <Link href="/contact" className="inline-flex items-center gap-2 bg-white text-brand-blue-700 font-bold py-3 px-8 rounded-lg hover:bg-blue-50 transition-colors">
              Contact Sales <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

