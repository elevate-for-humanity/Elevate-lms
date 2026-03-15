import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { TrendingUp, Users, Award, Target, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

import PageVideoHero from '@/components/ui/PageVideoHero';

export const metadata: Metadata = {
  title: 'Impact & Outcomes | Elevate for Humanity',
  description:
    'Support sustainable workforce systems with measurable outcomes. See how Elevate for Humanity creates lasting impact for learners, employers, and communities.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/impact',
  },
};

export default async function ImpactPage() {
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
  
  // Fetch impact metrics
  const { data: metrics } = await db
    .from('impact_metrics')
    .select('*')
    .order('category');
  return (
    <div className="bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Impact' }]} />
        </div>
      </div>


      <PageVideoHero
        videoSrc="/videos/graduation-success.mp4"
        posterSrc="/images/pages/impact-video-poster.jpg"
        posterAlt="Elevate graduate outcomes and community impact"
        size="marketing"
      />


      {/* Why Funders Choose Elevate */}
      <section className="w-full py-20 bg-white">
        <div className="mx-auto w-full max-w-6xl px-6">
          <h2 className="text-4xl font-black text-black mb-12 text-center">
            Why Funders Choose Elevate
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8">
              <div className="w-16 h-16 bg-brand-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">
                Aligned with Funding Requirements
              </h3>
              <p className="text-black">
                Programs designed to meet WIOA, WRG, DOL, and state workforce
                board requirements. Built-in compliance and reporting.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8">
              <div className="w-16 h-16 bg-brand-blue-600 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">
                Proven Outcomes
              </h3>
              <p className="text-black">
                High completion rates, strong job placement, and wage gains.
                Real-time tracking and transparent reporting.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8">
              <div className="w-16 h-16 bg-brand-orange-600 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">
                Scalable Infrastructure
              </h3>
              <p className="text-black">
                Technology platform that can be licensed and deployed across
                multiple sites, maximizing your investment.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8">
              <div className="w-16 h-16 bg-brand-green-600 rounded-xl flex items-center justify-center mb-6">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">
                Sustainable Model
              </h3>
              <p className="text-black">
                Designed for long-term sustainability through employer
                partnerships, licensing, and diversified funding.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Funding Opportunities */}
      <section className="w-full py-20 bg-white">
        <div className="mx-auto w-full max-w-6xl px-6">
          <h2 className="text-4xl font-black text-black mb-12 text-center">
            Partnership Opportunities
          </h2>

          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
              <h3 className="text-xl font-bold text-black mb-2">
                Program Sponsorship
              </h3>
              <p className="text-black">
                Fund specific training programs or cohorts. Direct impact with
                clear outcomes.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
              <h3 className="text-xl font-bold text-black mb-2">
                Platform Licensing
              </h3>
              <p className="text-black">
                Support deployment of the platform to additional organizations
                and regions.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
              <h3 className="text-xl font-bold text-black mb-2">
                Barrier Removal Fund
              </h3>
              <p className="text-black">
                Support wraparound services: transportation, childcare,
                emergency assistance.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
              <h3 className="text-xl font-bold text-black mb-2">
                Innovation & Expansion
              </h3>
              <p className="text-black">
                Fund new program development, technology enhancements, or
                geographic expansion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full py-20 bg-white">
        <div className="mx-auto w-full max-w-4xl text-center px-6">
          <h2 className="text-4xl font-black text-black mb-6">
            Ready to Make an Impact?
          </h2>
          <p className="text-xl text-black mb-10">
            Let's discuss how your support can create lasting change in
            workforce development.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-10 py-5 rounded-xl font-bold text-lg transition shadow-lg"
            >
              Contact Us
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-black px-10 py-5 rounded-xl font-bold text-lg transition"
            >
              Learn More About Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
