import { createClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  ChevronRight,
  DollarSign,
  Users,
  TrendingUp,
  BookOpen,
  Video,
  FileText,
  ArrowRight,
CheckCircle, } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sell on Marketplace | Elevate',
  description: 'Share your expertise and earn by selling courses and resources.',
};

export const dynamic = 'force-dynamic';

export default async function SellOnMarketplacePage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Database connection failed.</p>
        </div>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();

  const benefits = [
    {
      icon: DollarSign,
      title: 'Earn Revenue',
      description: 'Keep 70% of every sale. Get paid monthly via direct deposit.',
    },
    {
      icon: Users,
      title: 'Reach Learners',
      description: 'Access our community of motivated students and professionals.',
    },
    {
      icon: TrendingUp,
      title: 'Grow Your Brand',
      description: 'Build your reputation as an expert in your field.',
    },
  ];

  const contentTypes = [
    {
      icon: Video,
      title: 'Video Courses',
      description: 'Create comprehensive video-based learning experiences.',
      examples: ['Skill tutorials', 'Certification prep', 'Professional development'],
    },
    {
      icon: FileText,
      title: 'Resources & Guides',
      description: 'Share downloadable PDFs, templates, and reference materials.',
      examples: ['Study guides', 'Checklists', 'Reference sheets'],
    },
    {
      icon: BookOpen,
      title: 'Course Bundles',
      description: 'Package multiple courses together for comprehensive learning.',
      examples: ['Career tracks', 'Skill bundles', 'Certification packages'],
    },
  ];

  const steps = [
    {
      number: 1,
      title: 'Apply to Become a Seller',
      description: 'Submit your application with your expertise and content ideas.',
    },
    {
      number: 2,
      title: 'Create Your Content',
      description: 'Use our tools to build courses, upload resources, and set pricing.',
    },
    {
      number: 3,
      title: 'Get Reviewed',
      description: 'Our team reviews your content for quality and compliance.',
    },
    {
      number: 4,
      title: 'Start Selling',
      description: 'Your content goes live and you start earning from sales.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Marketplace", href: "/marketplace" }, { label: "Sell" }]} />
      </div>
<div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/marketplace" className="hover:text-gray-700">Marketplace</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Sell</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-brand-blue-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Share Your Expertise, Earn Revenue</h1>
          <p className="text-xl text-brand-blue-100 mb-8 max-w-2xl mx-auto">
            Create and sell courses, resources, and learning materials to help others succeed while building your income.
          </p>
          {user ? (
            <Link
              href="/marketplace/sell"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-blue-600 rounded-lg hover:bg-brand-blue-50 font-semibold text-lg"
            >
              Apply to Sell
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <Link
              href="/login?next=/marketplace/sell"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-blue-600 rounded-lg hover:bg-brand-blue-50 font-semibold text-lg"
            >
              Sign In to Apply
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Benefits */}
        <div className="grid sm:grid-cols-3 gap-8 mb-16">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-8 h-8 text-brand-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            );
          })}
        </div>

        {/* What You Can Sell */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">What You Can Sell</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {contentTypes.map((type, index) => {
              const Icon = type.icon;
              return (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-brand-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{type.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{type.description}</p>
                  <ul className="space-y-2">
                    {type.examples.map((example, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="text-slate-500 flex-shrink-0">•</span>
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">How It Works</h2>
          <div className="grid sm:grid-cols-4 gap-6">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {step.number}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Split */}
        <div className="bg-brand-green-50 rounded-2xl p-8 mb-16">
          <div className="max-w-2xl mx-auto text-center">
            <DollarSign className="w-12 h-12 text-brand-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Competitive Revenue Share</h2>
            <div className="flex items-center justify-center gap-8 mb-6">
              <div>
                <p className="text-5xl font-bold text-brand-green-600">70%</p>
                <p className="text-gray-600">You Keep</p>
              </div>
              <div className="text-4xl text-gray-300">/</div>
              <div>
                <p className="text-5xl font-bold text-slate-500">30%</p>
                <p className="text-gray-600">Platform Fee</p>
              </div>
            </div>
            <p className="text-gray-600">
              Payments are processed monthly. Minimum payout threshold is $50.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Start Selling?</h2>
          <p className="text-gray-600 mb-8 max-w-xl mx-auto">
            Join our community of expert instructors and start earning from your knowledge today.
          </p>
          {user ? (
            <Link
              href="/marketplace/sell"
              className="inline-flex items-center gap-2 px-8 py-4 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 font-semibold text-lg"
            >
              Apply to Become a Seller
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <Link
              href="/login?next=/marketplace/sell"
              className="inline-flex items-center gap-2 px-8 py-4 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 font-semibold text-lg"
            >
              Sign In to Apply
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
