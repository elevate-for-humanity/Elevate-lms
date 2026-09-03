'use client';

import { useState } from 'react';
import { Check, Star, Zap, Crown, Building2 } from 'lucide-react';

interface PricingTier {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
  icon: React.ReactNode;
}

const pricingTiers: PricingTier[] = [
  {
    id: 'basic',
    name: 'Host Shop',
    price: 'Free',
    period: 'forever',
    description: 'For salons and barbershops ready to host apprentices. No cost to join.',
    features: [
      'Post apprentice job listings',
      'Receive apprentice applications',
      'Basic onboarding support',
      'Compliance tracking dashboard',
      'WOTC tax credit assistance',
      'DOL reporting tools',
    ],
    cta: 'Join Free',
    icon: <Building2 className="w-6 h-6" />,
  },
  {
    id: 'premium',
    name: 'Premium Partner',
    price: '$99',
    period: '/month',
    description: 'For established shops wanting priority placement and marketing exposure.',
    features: [
      'Everything in Host Shop',
      'Featured in employer directory',
      'Priority apprentice matching',
      'Logo on our website',
      'Social media spotlight',
      'Dedicated account manager',
      'Recurring apprentice access',
    ],
    highlighted: true,
    cta: 'Go Premium',
    icon: <Star className="w-6 h-6" />,
  },
  {
    id: 'platinum',
    name: 'Platinum Partner',
    price: '$249',
    period: '/month',
    description: 'For multi-location businesses and training-intensive salon groups.',
    features: [
      'Everything in Premium',
      'Multi-location management',
      'Training agent certification',
      'Custom onboarding portal',
      'API access for HR systems',
      'Co-branding opportunities',
      'White-label partnerships',
    ],
    cta: 'Go Platinum',
    icon: <Crown className="w-6 h-6" />,
  },
];

const valueItems = [
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'Free Training for Employers',
    desc: 'No cost to host apprentices. WOTC tax credits offset your investment.',
  },
  {
    icon: <Building2 className="w-5 h-5" />,
    title: 'Pre-Vetted Apprentices',
    desc: 'Apprentices are screened, funded, and ready to work from day one.',
  },
  {
    icon: <Star className="w-5 h-5" />,
    title: 'Build Your Team',
    desc: 'Train apprentices to match your shop\'s culture and standards.',
  },
];

export default function EmployerPricing() {
  const [billingAnnual, setBillingAnnual] = useState(true);

  return (
    <section className="py-16 md:py-24 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-amber-400 text-sm font-semibold uppercase tracking-wider">
            For Employers & Host Shops
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-4">
            Partner Tiers That Grow With You
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Whether you&apos;re hosting your first apprentice or building a training program, 
            we have a tier that fits. All tiers include WOTC tax credit support.
          </p>
        </div>

        {/* Value Props */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {valueItems.map((item, i) => (
            <div key={i} className="flex items-start gap-4 p-6 bg-white/5 rounded-2xl border border-white/10">
              <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400">
                {item.icon}
              </div>
              <div>
                <h4 className="text-white font-semibold mb-1">{item.title}</h4>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingTiers.map((tier) => (
            <div
              key={tier.id}
              className={`relative rounded-3xl p-8 ${
                tier.highlighted
                  ? 'bg-gradient-to-b from-amber-500 to-amber-600 scale-105 shadow-2xl shadow-amber-500/20'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-white text-amber-600 text-sm font-bold rounded-full">
                  Most Popular
                </div>
              )}

              {/* Header */}
              <div className="text-center mb-6">
                <div className={`inline-flex p-3 rounded-2xl mb-4 ${
                  tier.highlighted ? 'bg-white/20' : 'bg-amber-500/20'
                }`}>
                  <span className={tier.highlighted ? 'text-white' : 'text-amber-400'}>
                    {tier.icon}
                  </span>
                </div>
                <h3 className={`text-xl font-bold mb-2 ${tier.highlighted ? 'text-white' : 'text-white'}`}>
                  {tier.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className={`text-4xl font-extrabold ${tier.highlighted ? 'text-white' : 'text-white'}`}>
                    {tier.price}
                  </span>
                  {tier.price !== 'Free' && (
                    <span className={tier.highlighted ? 'text-white/70' : 'text-gray-400'}>
                      {tier.period}
                    </span>
                  )}
                </div>
                <p className={`text-sm mt-2 ${tier.highlighted ? 'text-white/80' : 'text-gray-400'}`}>
                  {tier.price === 'Free' ? 'No credit card required' : tier.period === '/month' && billingAnnual ? 'billed annually' : ''}
                </p>
              </div>

              {/* Description */}
              <p className={`text-center mb-6 ${tier.highlighted ? 'text-white/90' : 'text-gray-300'}`}>
                {tier.description}
              </p>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      tier.highlighted ? 'text-white' : 'text-green-400'
                    }`} />
                    <span className={tier.highlighted ? 'text-white/90' : 'text-gray-300'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href={`/employers/${tier.id === 'basic' ? 'become-host-shop' : `become-host-shop? tier=${tier.id}`}`}
                className={`block w-full text-center py-4 rounded-xl font-bold transition-all ${
                  tier.highlighted
                    ? 'bg-white text-amber-600 hover:bg-gray-100'
                    : 'bg-amber-500 text-black hover:bg-amber-400'
                }`}
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>

        {/* ROI Calculator */}
        <div className="mt-16 bg-white/5 rounded-3xl p-8 md:p-12 border border-white/10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">
                The Real Cost of NOT Hosting
              </h3>
              <p className="text-gray-400 mb-6">
                Hiring and training a new barber or cosmetologist costs $3,000-$8,000 
                in advertising, interviews, and lost productivity. With our program, 
                you get pre-trained apprentices at no cost to you.
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-gray-400">Traditional hiring cost</span>
                  <span className="text-white font-bold">$5,000+</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-gray-400">Elevate host shop cost</span>
                  <span className="text-green-400 font-bold">$0</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-400">Your savings</span>
                  <span className="text-amber-400 font-bold text-xl">$5,000+</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-2xl p-8">
              <h4 className="text-lg font-bold text-white mb-4">Plus WOTC Tax Credits</h4>
              <div className="space-y-3 text-gray-300">
                <p>
                  <strong className="text-amber-400">Work Opportunity Tax Credit:</strong> 
                  Up to $2,400 per apprentice for hiring from target groups.
                </p>
                <p>
                  <strong className="text-amber-400">Disabled Veterans Credit:</strong> 
                  Up to $9,600 for hiring qualified veterans.
                </p>
                <p className="text-sm text-gray-500 mt-4">
                  * Consult your tax professional for specific eligibility.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 mb-6">
            Questions about employer partnerships? We&apos;re here to help.
          </p>
          <a
            href="/contact?type=employer"
            className="inline-flex items-center px-8 py-4 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-100 transition-all"
          >
            Talk to Employer Relations
          </a>
        </div>
      </div>
    </section>
  );
}
