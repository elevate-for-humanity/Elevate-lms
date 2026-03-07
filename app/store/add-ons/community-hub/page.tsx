
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';

import Image from 'next/image';
import { ArrowRight, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Community Hub Add-On | Build Engagement | Elevate Store',
  description:
    'Add a complete community platform to your LMS. Discussions, groups, leaderboards, events, and gamification. One-time purchase, lifetime access.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/store/add-ons/community-hub',
  },
};

const features = [
  {
    title: 'Discussion Forums',
    description: 'Categorized forums for Q&A, announcements, and peer discussions. Students help each other, instructors post updates, and cohorts stay connected between sessions.',
    image: '/images/pages/comp-cta-training.jpg',
  },
  {
    title: 'Member Groups',
    description: 'Create cohorts, study groups, and networking circles. Organize members by program, graduation year, or interest area with private group spaces.',
    image: '/images/pages/comp-cta-career.jpg',
  },
  {
    title: 'Leaderboards',
    description: 'Gamified rankings to drive engagement and healthy competition. Track participation, course completion, and community contributions with visible rankings.',
    image: '/images/pages/comp-cta-career.jpg',
  },
  {
    title: 'Points & Badges',
    description: 'Reward participation with points, badges, and achievements. Configurable point values for posts, replies, course completions, and event attendance.',
    image: '/images/pages/comp-cta-training.jpg',
  },
  {
    title: 'Events Calendar',
    description: 'Schedule events, webinars, and meetups with RSVP tracking. Integrated with Zoom for virtual events and Google Calendar for reminders.',
    image: '/images/pages/comp-cta-career.jpg',
  },
  {
    title: 'Analytics Dashboard',
    description: 'Real-time activity feed and engagement metrics. Track active members, post frequency, response times, and identify at-risk students before they disengage.',
    image: '/images/pages/comp-cta-training.jpg',
  },
];

const useCases = [
  {
    title: 'Training Providers',
    description: 'Keep students engaged between classes with peer support and discussions',
  },
  {
    title: 'Membership Communities',
    description: 'Build a thriving community around your content and expertise',
  },
  {
    title: 'Alumni Networks',
    description: 'Keep graduates connected for networking and job opportunities',
  },
  {
    title: 'Professional Associations',
    description: 'Facilitate member networking and continuing education',
  },
];

export default function CommunityHubPage() {

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Store", href: "/store" }, { label: "Community Hub" }]} />
      </div>
{/* Hero */}
      <section className="relative py-20 bg-slate-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-slate-900">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                Platform Add-On
              </div>
              <h1 className="text-4xl md:text-5xl font-black mb-6">
                Community Hub
              </h1>
              <p className="text-xl text-slate-600 mb-8">
                Transform your LMS into a thriving community. Discussions, groups, leaderboards, 
                events, and gamification — everything you need to build engagement.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/store/add-ons/community-hub"
                  className="px-8 py-4 bg-brand-blue-600 text-white font-bold rounded-lg hover:bg-brand-blue-700 transition"
                >
                  Get Community Hub — $1,997
                </Link>
                <Link
                  href="#pricing"
                  className="px-8 py-4 border-2 border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition"
                >
                  See Payment Options
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-slate-900">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span>One-time purchase</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-900">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span>Lifetime access</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-900">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span>Unlimited members</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-900">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span>Full source code access</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-900">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span>Integrates with your LMS</span>
                  </div>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-200">
                  <div className="text-center">
                    <span className="text-slate-500 text-sm">One-time payment</span>
                    <div className="text-4xl font-black text-slate-900">$1,997</div>
                    <p className="text-sm text-slate-500 mt-1">or 4 payments of $549/mo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A complete community platform that integrates seamlessly with your existing LMS
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="group bg-white rounded-xl overflow-hidden border hover:shadow-lg transition">
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute bottom-3 left-4">
                    <h3 className="text-lg font-bold text-white">{feature.title}</h3>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Perfect For</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase) => (
              <div key={useCase.title} className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="font-bold text-lg mb-2">{useCase.title}</h3>
                <p className="text-gray-600 text-sm">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Options */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Pricing Options</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choose the payment option that works for your organization. Both include lifetime access and all features.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* One-time */}
            <div className="bg-white rounded-2xl border-2 border-brand-blue-600 p-8 relative">
              <div className="absolute -top-3 left-6 bg-brand-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">BEST VALUE</div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">One-Time Payment</h3>
              <div className="text-4xl font-black text-brand-blue-600 mb-1">$1,997</div>
              <p className="text-sm text-slate-500 mb-6">Pay once, own it forever</p>
              <ul className="space-y-3 mb-8">
                {['Lifetime access — no recurring fees', 'All features included', 'Unlimited members', 'Full source code access', 'Free updates for 12 months', 'Priority email support'].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-brand-blue-500 font-bold mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/store/add-ons/community-hub/checkout"
                className="block w-full text-center bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-blue-700 transition"
              >
                Purchase Now — $1,997
              </Link>
            </div>
            {/* Monthly */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-2">4 Monthly Payments</h3>
              <div className="text-4xl font-black text-slate-900 mb-1">$549<span className="text-lg font-medium text-slate-500">/mo</span></div>
              <p className="text-sm text-slate-500 mb-6">4 payments of $549 ($2,196 total)</p>
              <ul className="space-y-3 mb-8">
                {['Same lifetime access', 'All features included', 'Unlimited members', 'Full source code access', 'Free updates for 12 months', 'Standard email support'].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-slate-400 font-bold mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/store/add-ons/community-hub/checkout?plan=monthly"
                className="block w-full text-center border-2 border-slate-300 text-slate-700 px-6 py-3 rounded-lg font-bold hover:bg-slate-50 transition"
              >
                Start Monthly Plan — $549/mo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What's Included</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-indigo-600">Community Features</h3>
              <ul className="space-y-3">
                {[
                  'Discussion forums with categories',
                  'Member groups and networking',
                  'Leaderboards and rankings',
                  'Points, badges, achievements',
                  'Events calendar with RSVPs',
                  'Member directory and profiles',
                  'Real-time activity feed',
                  'Direct messaging',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-indigo-600">Admin & Integration</h3>
              <ul className="space-y-3">
                {[
                  'Moderation tools',
                  'Content approval workflows',
                  'Member management',
                  'Analytics dashboard',
                  'LMS integration',
                  'Mobile-responsive design',
                  'Email notifications',
                  'API access',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Stats + Write a Review */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Community Hub by the Numbers</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {[
              { value: '40%', label: 'Increase in Student Engagement' },
              { value: '500+', label: 'Organizations Using Community Hub' },
              { value: '25%', label: 'Reduction in Dropout Rates' },
              { value: '4.8/5', label: 'Average Customer Rating' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl p-6 text-center border">
                <div className="text-3xl font-black text-brand-blue-600">{stat.value}</div>
                <div className="text-sm text-slate-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-slate-600 mb-4">Already using Community Hub? Share your experience.</p>
            <Link
              href="/store/add-ons/community-hub/review"
              className="inline-flex items-center gap-2 border-2 border-brand-blue-600 text-brand-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-50 transition"
            >
              Write a Review
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-brand-blue-700">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Build Your Community?</h2>
          <p className="text-brand-blue-100 mb-8">
            One-time purchase. Lifetime access. Unlimited members. Or pay in 4 monthly installments.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/store/add-ons/community-hub"
              className="px-8 py-4 bg-white text-brand-blue-700 font-bold rounded-lg hover:bg-gray-100 transition"
            >
              Get Community Hub — $1,997
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition"
            >
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
