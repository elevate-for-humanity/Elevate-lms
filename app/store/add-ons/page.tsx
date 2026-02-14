'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Users, 
  Puzzle, 
  ArrowRight, 
  Zap, 
  MessageSquare, 
  Trophy, 
  Calendar, 
  Star,
  Shield,
  BarChart3,
  CheckCircle,
  Play
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

const addOns = [
  {
    id: 'community-hub',
    title: 'Community Hub',
    description: 'Add a complete community platform to your LMS. Discussions, groups, leaderboards, events, and gamification. One-time purchase, lifetime access.',
    href: '/store/add-ons/community-hub',
    icon: Users,
    price: '$1,997',
    image: '/images/store/community-hub.jpg',
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

const comingSoon = [
  {
    id: 'analytics-pro',
    title: 'Analytics Pro',
    description: 'Advanced reporting and predictive analytics for student outcomes. Includes custom dashboards and data exports.',
    href: '/store/add-ons/analytics-pro',
    icon: BarChart3,
  },
  {
    id: 'compliance-automation',
    title: 'Compliance Automation',
    description: 'Automated compliance tracking and reporting for WIOA, grants, and accreditation requirements.',
    href: '/store/add-ons/compliance-automation',
    icon: Shield,
  },
];

export default function AddOnsPage() {
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
      <section className="relative h-[50vh] min-h-[400px] flex items-center overflow-hidden">
        <Image
          src="/images/store/platform-hero.jpg"
          alt="Platform Add-Ons"
          fill
          className="object-cover"
          priority
        />
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 w-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Puzzle className="w-6 h-6 text-slate-900" />
            </div>
            <span className="text-blue-200 font-medium">Elevate Store</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-4">
            Platform Add-Ons
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mb-6">
            Extend your workforce operating system with powerful features. 
            One-time purchase, lifetime access, no recurring fees.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link 
              href="#add-ons"
              className="inline-flex items-center gap-2 bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Browse Add-Ons
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/contact"
              className="inline-flex items-center gap-2 border-2 border-white text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Request Custom Feature
            </Link>
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
                      <Play className="w-8 h-8 text-blue-600 ml-1" />
                    </div>
                  </button>
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="inline-block bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                      Most Popular
                    </span>
                  </div>
                </div>

                {/* Content Side */}
                <div className="p-8 lg:p-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                      <addon.icon className="w-7 h-7 text-blue-600" />
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black text-blue-600">{addon.price}</div>
                      <div className="text-sm text-slate-600">One-time payment</div>
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-slate-900 mb-3">{addon.title}</h3>
                  <p className="text-slate-600 mb-6">{addon.description}</p>

                  <div className="grid sm:grid-cols-2 gap-6 mb-8">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-500" />
                        Features Included
                      </h4>
                      <ul className="space-y-2">
                        {addon.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-blue-500" />
                        Benefits
                      </h4>
                      <ul className="space-y-2">
                        {addon.benefits.map((benefit) => (
                          <li key={benefit} className="flex items-start gap-2 text-sm text-slate-600">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <Link
                      href={addon.href}
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      View Details
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                    <Link
                      href={`${addon.href}/checkout`}
                      className="inline-flex items-center gap-2 border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                    >
                      Purchase Now
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
            {comingSoon.map((item) => (
              <Link 
                key={item.id} 
                href={item.href}
                className="group bg-white rounded-xl p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                  <item.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                <p className="text-slate-600 mb-4">{item.description}</p>
                <span className="inline-flex items-center gap-2 text-blue-600 font-semibold">
                  Learn More <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Need a Custom Add-On?</h2>
          <p className="text-xl text-blue-100 mb-8">
            We build custom features for enterprise clients. Tell us what you need.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Contact Sales
            </Link>
            <Link
              href="/store"
              className="inline-flex items-center gap-2 border-2 border-white text-slate-900 px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Back to Store
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
