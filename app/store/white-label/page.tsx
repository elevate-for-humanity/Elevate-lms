'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Cloud, Shield, Zap, HeadphonesIcon, Globe, Palette } from 'lucide-react';

const FEATURES = [
  {
    icon: Cloud,
    title: 'Zero DevOps',
    description: 'We handle hosting, updates, security patches, and scaling. You focus on training.',
  },
  {
    icon: Palette,
    title: 'Your Branding',
    description: 'Custom logo, colors, domain. Your students see your brand, not ours.',
  },
  {
    icon: Globe,
    title: 'Custom Domain',
    description: 'Use your own domain (training.yourorg.com) or get a hosted portal (app.elevateforhumanity.org/admin?org=yourorg).',
  },
  {
    icon: Shield,
    title: '99.9% Uptime SLA',
    description: 'Enterprise-grade infrastructure with guaranteed availability.',
  },
  {
    icon: Zap,
    title: 'Instant Updates',
    description: 'Get new features automatically. No manual upgrades needed.',
  },
  {
    icon: HeadphonesIcon,
    title: 'Priority Support',
    description: 'Dedicated support team with 4-hour response time.',
  },
];

const PRICING = [
  {
    name: 'Growth',
    price: '$499',
    interval: '/month',
    description: 'For growing training providers',
    features: [
      'Up to 1,000 students',
      'Custom subdomain',
      'Your logo & colors',
      'Email support',
      'Weekly backups',
    ],
    cta: 'Start Free Trial',
    highlighted: false,
  },
  {
    name: 'Scale',
    price: '$999',
    interval: '/month',
    description: 'For established organizations',
    features: [
      'Up to 5,000 students',
      'Custom domain included',
      'Full white-label branding',
      'Priority support (4hr)',
      'Daily backups',
      'API access',
      'SSO integration',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    interval: '',
    description: 'For large organizations',
    features: [
      'Unlimited students',
      'Multiple domains',
      'Dedicated infrastructure',
      'Dedicated success manager',
      'Custom integrations',
      'SLA guarantee',
      'On-premise option',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

export default function WhiteLabelPage() {
  const [subdomain, setSubdomain] = useState('');
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);

  const checkSubdomain = async () => {
    if (!subdomain || subdomain.length < 3) return;
    
    setChecking(true);
    try {
      const res = await fetch(`/api/provisioning/tenant?subdomain=${subdomain}`);
      const data = await res.json();
      setAvailable(data.available);
    } catch {
      setAvailable(null);
    }
    setChecking(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="inline-block px-4 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium mb-6">
            White-Label Solution
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6">
            Your LMS. Your Brand.<br />We Handle the Rest.
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
            Launch a fully-branded learning platform in minutes. No servers to manage, 
            no code to write. Just your training content and your students.
          </p>
          
          {/* Subdomain Checker */}
          <div className="max-w-md mx-auto bg-white/10 backdrop-blur rounded-xl p-6">
            <label className="block text-left text-sm font-medium mb-2">
              Check your organization ID availability
            </label>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center bg-white/10 rounded-lg overflow-hidden">
                <input
                  type="text"
                  value={subdomain}
                  onChange={(e) => {
                    setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                    setAvailable(null);
                  }}
                  placeholder="yourorg"
                  className="flex-1 bg-transparent px-4 py-3 text-white placeholder-slate-400 outline-none"
                />
                <span className="text-slate-400 pr-4 text-xs">app.elevateforhumanity.org/admin?org=</span>
              </div>
              <button
                onClick={checkSubdomain}
                disabled={checking || subdomain.length < 3}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50"
              >
                {checking ? '...' : 'Check'}
              </button>
            </div>
            {available !== null && (
              <p className={`mt-2 text-sm ${available ? 'text-brand-green-400' : 'text-red-400'}`}>
                {available ? '✓ Available!' : '✗ Already taken'}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-black text-center mb-12">
            Everything You Need, Nothing You Don't
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="p-6 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
                <feature.icon className="w-10 h-10 text-blue-600 mb-4" />
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-black text-center mb-4">
            Simple, Predictable Pricing
          </h2>
          <p className="text-center text-slate-600 mb-12">
            All plans include 14-day free trial. No credit card required to start.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 ${
                  plan.highlighted
                    ? 'bg-slate-900 text-white ring-4 ring-blue-500'
                    : 'bg-white border border-slate-200'
                }`}
              >
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className={`text-sm mb-4 ${plan.highlighted ? 'text-slate-300' : 'text-slate-600'}`}>
                  {plan.description}
                </p>
                <div className="mb-6">
                  <span className="text-4xl font-black">{plan.price}</span>
                  <span className={plan.highlighted ? 'text-slate-300' : 'text-slate-500'}>
                    {plan.interval}
                  </span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className={`w-5 h-5 flex-shrink-0 ${plan.highlighted ? 'text-blue-400' : 'text-brand-green-600'}`} />
                      <span className={plan.highlighted ? 'text-slate-200' : 'text-slate-700'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.name === 'Enterprise' ? '/contact?subject=license' : '/store/white-label/signup'}
                  className={`block text-center py-3 rounded-lg font-bold transition-colors ${
                    plan.highlighted
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black mb-4">
            Ready to Launch Your Training Platform?
          </h2>
          <p className="text-slate-600 mb-8">
            Join 50+ organizations already using Elevate LMS to train their workforce.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/store/white-label"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
            >
              Start Free Trial
            </Link>
            <Link
              href="/contact?subject=license"
              className="px-8 py-4 border-2 border-slate-900 hover:bg-slate-900 hover:text-white rounded-lg font-bold transition-colors"
            >
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
