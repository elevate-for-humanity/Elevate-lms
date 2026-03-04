'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Users, 
  ArrowRight, 
  Zap, 
  Trophy, 
  Play,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import ProgramHeroBanner from '@/components/ProgramHeroBanner';

import { createBrowserClient } from '@supabase/ssr';
const addOns = [
  {
    id: 'community-hub',
    title: 'Community Hub',
    description: 'Add a complete community platform to your LMS. Discussions, groups, leaderboards, events, and gamification. One-time purchase, lifetime access.',
    href: '/store/add-ons/community-hub',
    icon: Users,
    price: '$1,997',
    image: '/images/pages/comp-cta-training.jpg',
    features: [
      'Discussion Forums with Categories',
      'Member Groups & Cohorts',
      'Leaderboards & Rankings',
      'Points & Badge System',
      'Events Calendar with RSVP',
      'Direct Messaging',
    ],
    benefits: [
      'Increase student engagement by 40%',
      'Build peer support networks',
      'Track participation metrics',
      'Reduce dropout rates',
    ],
  },
];

const moreAddOns = [
  {
    id: 'analytics-pro',
    title: 'Analytics Pro',
    description: 'Advanced reporting and predictive analytics for student outcomes. Real-time dashboards, custom reports, and cohort analysis.',
    href: '/store/add-ons/analytics-pro',
    price: '$1,497',
    image: '/images/pages/comp-cta-training.jpg',
  },
  {
    id: 'compliance-automation',
    title: 'Compliance Automation',
    description: 'Automated compliance tracking and reporting for WIOA, grants, FERPA, and accreditation requirements.',
    href: '/store/add-ons/compliance-automation',
    price: '$1,297',
    image: '/images/pages/comp-cta-career.jpg',
  },
];

export default function AddOnsPage() {
  const [dbRows, setDbRows] = useState<any[]>([]);
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.from('products').select('*').limit(50)
      .then(({ data }) => { if (data) setDbRows(data); });
  }, []);

  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Store', href: '/store' }, { label: 'Add-Ons' }]} />
        </div>
      </div>

      {/* Hero Section */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <Image src="/images/pages/store-addons-hero.jpg" alt="Platform Add-Ons" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Platform Add-Ons</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">Extend your workforce operating system with powerful features. One-time purchase, lifetime access, no recurring fees.</p>
          </div>
        </div>
      </section>



      {/* Add-Ons Grid */}
      <section id="add-ons" className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Available Add-Ons</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Each add-on integrates seamlessly with your existing platform. Install in minutes, not days.
            </p>
          </div>

          {addOns.map((addon) => (
            <div key={addon.id} className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-12">
              <div className="grid lg:grid-cols-2">
                {/* Image/Video Side */}
                <div className="relative h-64 lg:h-auto min-h-[300px]">
                  <Image
                    src={addon.image}
                    alt={addon.title}
                    fill
                    className="object-cover"
                  />
                  <button 
                    onClick={() => setActiveVideo(addon.id)}
                    className="absolute inset-0 flex items-center justify-center group"
                  >
                    <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <Play className="w-8 h-8 text-brand-blue-600 ml-1" />
                    </div>
                  </button>
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="inline-block bg-brand-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                      Most Popular
                    </span>
                  </div>
                </div>

                {/* Content Side */}
                <div className="p-8 lg:p-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-brand-blue-100 rounded-xl flex items-center justify-center">
                      <addon.icon className="w-7 h-7 text-brand-blue-600" />
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black text-brand-blue-600">{addon.price}</div>
                      <div className="text-sm text-slate-600">One-time payment</div>
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-slate-900 mb-3">{addon.title}</h3>
                  <p className="text-slate-600 mb-6">{addon.description}</p>

                  <div className="grid sm:grid-cols-2 gap-6 mb-8">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-brand-blue-500" />
                        Features Included
                      </h4>
                      <ul className="space-y-2">
                        {addon.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                            <span className="text-slate-400 flex-shrink-0">•</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-brand-blue-500" />
                        Benefits
                      </h4>
                      <ul className="space-y-2">
                        {addon.benefits.map((benefit) => (
                          <li key={benefit} className="flex items-start gap-2 text-sm text-slate-600">
                            <span className="text-slate-400 flex-shrink-0">•</span>
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <Link
                      href={`${addon.href}/checkout`}
                      className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition-colors"
                    >
                      Purchase Now
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                    <Link
                      href={addon.href}
                      className="inline-flex items-center gap-2 border-2 border-brand-blue-600 text-brand-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-50 transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* More Add-Ons */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">More Add-Ons</h2>
            <p className="text-lg text-slate-600">Expand your platform with additional capabilities</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {moreAddOns.map((item) => (
              <div 
                key={item.id} 
                className="group bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-all"
              >
                <div className="relative h-44">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-4">
                    <h3 className="text-xl font-bold text-white">{item.title}</h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-slate-600 mb-4">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-black text-slate-900">{item.price}</div>
                    <div className="flex gap-2">
                      <Link
                        href={`${item.href}/checkout`}
                        className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-brand-blue-700 transition"
                      >
                        Purchase Now <ArrowRight className="w-4 h-4" />
                      </Link>
                      <Link
                        href={item.href}
                        className="inline-flex items-center gap-2 border border-slate-300 text-slate-700 px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-50 transition"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand-blue-700">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Need a Custom Add-On?</h2>
          <p className="text-xl text-brand-blue-100 mb-8">
            We build custom features for enterprise clients. Tell us what you need.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Contact Sales
            </Link>
            <Link
              href="/store"
              className="inline-flex items-center gap-2 border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Back to Store
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
