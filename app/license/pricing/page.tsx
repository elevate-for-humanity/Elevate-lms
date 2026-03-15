import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Calendar, HelpCircle } from 'lucide-react';
import { LICENSE_TIERS, DISCLAIMERS, ROUTES, PLATFORM_FEATURES } from '@/lib/pricing';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Platform Licensing Pricing | Elevate LMS',
  description: 'Platform licensing pricing for the Elevate LMS. Core Platform $4,999, School License $15,000, Enterprise $50,000. Monthly option available.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/license/pricing',
  },
};

export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  // Get license tiers from database
  const { data: dbTiers } = await db
    .from('license_tiers')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true });

  // Get FAQs
  const { data: faqs } = await db
    .from('faqs')
    .select('*')
    .eq('category', 'licensing')
    .eq('is_active', true)
    .order('order', { ascending: true });

  const displayTiers = dbTiers && dbTiers.length > 0 ? dbTiers : LICENSE_TIERS.slice(0, 3);

  const defaultFaqs = [
    { question: 'What\'s included in the license?', answer: 'All licenses include the core platform, training, and support. Higher tiers include additional features and customization.' },
    { question: 'Can I upgrade later?', answer: 'Yes, you can upgrade your license at any time. We\'ll prorate the difference.' },
    { question: 'Is there a monthly option?', answer: 'Yes, we offer monthly billing at a slightly higher rate. Contact us for details.' },
  ];

  const displayFaqs = faqs && faqs.length > 0 ? faqs : defaultFaqs;

  return (
    <div>
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'License', href: '/license' }, { label: 'Pricing' }]} />
        </div>
      </div>

      {/* Header */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Platform Licensing</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Self-operating workforce infrastructure. Choose the license that fits your organization's scale.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {displayTiers.map((tier: any, index: number) => (
              <div 
                key={tier.id || index}
                className={`rounded-2xl p-8 ${
                  tier.featured 
                    ? 'bg-brand-orange-600 text-white relative' 
                    : tier.id === 'enterprise' 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-white border-2 border-slate-200'
                }`}
              >
                {tier.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-white px-4 py-2 rounded-full text-xs font-bold">
                    MOST POPULAR
                  </div>
                )}
                
                <h2 className={`text-xl font-bold mb-2 ${tier.featured ? 'mt-2' : ''}`}>
                  {tier.name}
                </h2>
                
                <div className="mb-4">
                  <span className="text-4xl font-bold">
                    ${tier.price?.toLocaleString()}
                  </span>
                  <span className={tier.featured ? 'text-brand-orange-100' : 'text-slate-500'}>
                    /year
                  </span>
                </div>
                
                <p className={`mb-6 ${tier.featured ? 'text-brand-orange-100' : 'text-slate-600'}`}>
                  {tier.description}
                </p>
                
                <ul className="space-y-3 mb-8">
                  {tier.features?.map((feature: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className={`flex-shrink-0 ${tier.featured ? 'text-brand-orange-200' : 'text-slate-400'}`}>•</span>
                      <span className={tier.featured ? 'text-white' : ''}>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link
                  href={ROUTES.schedule}
                  className={`block text-center py-3 rounded-lg font-semibold transition ${
                    tier.featured 
                      ? 'bg-white text-brand-orange-600 hover:bg-brand-orange-50' 
                      : tier.id === 'enterprise'
                        ? 'bg-brand-orange-600 text-white hover:bg-brand-orange-700'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">All Plans Include</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {PLATFORM_FEATURES.slice(0, 6).map((feature: any, index: number) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                <span className="text-slate-500 flex-shrink-0">•</span>
                <h3 className="font-semibold mb-2">{feature.name}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {displayFaqs.map((faq: any, index: number) => (
              <details key={index} className="bg-white rounded-lg shadow-sm border group">
                <summary className="p-6 cursor-pointer flex items-center justify-between font-semibold list-none">
                  {faq.question}
                  <HelpCircle className="w-5 h-5 text-gray-400" />
                </summary>
                <div className="px-6 pb-6 text-gray-600">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-brand-orange-100 mb-8">
            Schedule a demo to see the platform in action.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={ROUTES.schedule}
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-orange-600 px-8 py-4 rounded-lg font-bold hover:bg-brand-orange-50 transition"
            >
              <Calendar className="w-5 h-5" />
              Schedule Demo
            </Link>
            <Link
              href="/contact"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-orange-700 transition"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>{DISCLAIMERS.pricing}</p>
        </div>
      </section>
    </div>
  );
}
