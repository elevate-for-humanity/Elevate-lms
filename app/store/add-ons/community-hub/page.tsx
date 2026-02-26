
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import ProductReviews from '@/components/store/ProductReviews';
import ProductRecommendations from '@/components/store/ProductRecommendations';
import {
  Users,
  MessageSquare,
  Trophy,
  Calendar,
  Star,
  ArrowRight,
  Zap,
  Shield,
  BarChart3,
CheckCircle, } from 'lucide-react';

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
    icon: MessageSquare,
    title: 'Discussion Forums',
    description: 'Categorized forums for Q&A, announcements, and peer discussions',
  },
  {
    icon: Users,
    title: 'Member Groups',
    description: 'Create cohorts, study groups, and networking circles',
  },
  {
    icon: Trophy,
    title: 'Leaderboards',
    description: 'Gamified rankings to drive engagement and healthy competition',
  },
  {
    icon: Star,
    title: 'Points & Badges',
    description: 'Reward participation with points, badges, and achievements',
  },
  {
    icon: Calendar,
    title: 'Events Calendar',
    description: 'Schedule events, webinars, and meetups with RSVP tracking',
  },
  {
    icon: BarChart3,
    title: 'Activity Feed',
    description: 'Real-time feed showing community activity and updates',
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
              <p className="text-xl text-indigo-100 mb-8">
                Transform your LMS into a thriving community. Discussions, groups, leaderboards, 
                events, and gamification - everything you need to build engagement.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/store/add-ons/community-hub"
                  className="px-8 py-4 bg-white text-indigo-700 font-bold rounded-lg hover:bg-indigo-50 transition"
                >
                  Get Community Hub - $2,499
                </Link>
                <Link
                  href="#features"
                  className="px-8 py-4 border-2 border-white text-slate-900 font-bold rounded-lg hover:bg-white/10 transition"
                >
                  See Features
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
                <div className="mt-8 pt-6 border-t border-white/20">
                  <div className="text-center">
                    <span className="text-indigo-200 text-sm">One-time payment</span>
                    <div className="text-4xl font-black text-slate-900">$2,499</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A complete community platform that integrates seamlessly with your existing LMS
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="p-6 rounded-xl border hover:shadow-lg transition">
                <feature.icon className="w-10 h-10 text-indigo-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
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

      {/* Reviews */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <ProductReviews productId="community-hub" />
        </div>
      </section>

      {/* Recommendations */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <ProductRecommendations productId="community-hub" />
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-indigo-600">
        <div className="max-w-4xl mx-auto px-4 text-center text-slate-900">
          <h2 className="text-3xl font-bold mb-4">Ready to Build Your Community?</h2>
          <p className="text-indigo-100 mb-8">
            One-time purchase. Lifetime access. Unlimited members.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/store/add-ons/community-hub"
              className="px-8 py-4 bg-white text-indigo-700 font-bold rounded-lg hover:bg-indigo-50 transition"
            >
              Get Community Hub - $2,499
            </Link>
            <Link
              href="/community"
              className="px-8 py-4 border-2 border-white text-slate-900 font-bold rounded-lg hover:bg-white/10 transition"
            >
              See Live Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
