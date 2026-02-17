import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, DollarSign, MapPin, Award } from 'lucide-react';

// COPY THIS TEMPLATE FOR ALL PROGRAM PAGES
// Replace the metadata and content sections below

export const metadata: Metadata = {
  title: 'Program Name | Elevate for Humanity',
  description: 'Program description for SEO',
};

export default function ProgramTemplate() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section - Clean, White Background */}
      <section className="bg-white py-16 border-b">
        <div className="max-w-7xl mx-auto px-6">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="px-4 py-2 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
              Funded with Funding
            </span>
            <span className="px-4 py-2 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
              DOL Registered
            </span>
            <span className="px-4 py-2 bg-orange-100 text-orange-800 text-sm font-semibold rounded-full">
              Job Placement Assistance
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
            Program Name Here
          </h1>

          {/* Description */}
          <p className="text-xl text-black mb-8 max-w-3xl">
            Brief program description that explains what students will learn and
            achieve.
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="flex items-start gap-3">
              <Clock className="w-6 h-6 text-brand-orange-600 flex-shrink-0 mt-1" />
              <div>
                <div className="font-bold text-black">Duration</div>
                <div className="text-sm text-black">12 weeks</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <DollarSign className="w-6 h-6 text-brand-orange-600 flex-shrink-0 mt-1" />
              <div>
                <div className="font-bold text-black">Cost</div>
                <div className="text-sm text-black">$0 with funding</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-6 h-6 text-brand-orange-600 flex-shrink-0 mt-1" />
              <div>
                <div className="font-bold text-black">Location</div>
                <div className="text-sm text-black">Indianapolis, IN</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Award className="w-6 h-6 text-brand-orange-600 flex-shrink-0 mt-1" />
              <div>
                <div className="font-bold text-black">Credential</div>
                <div className="text-sm text-black">State License</div>
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/apply"
              className="px-8 py-4 bg-brand-orange-600 hover:bg-brand-orange-700 text-white font-bold rounded-lg transition text-center"
            >
              Apply Now
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 bg-white hover:bg-slate-50 text-black font-bold rounded-lg border-2 border-slate-300 transition text-center"
            >
              Talk to an Advisor
            </Link>
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-black mb-8">
            What You'll Learn
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-black mb-2">Skill 1</h3>
              <p className="text-black">
                Description of what students will learn
              </p>
            </div>
            <div>
              <h3 className="font-bold text-black mb-2">Skill 2</h3>
              <p className="text-black">
                Description of what students will learn
              </p>
            </div>
            <div>
              <h3 className="font-bold text-black mb-2">Skill 3</h3>
              <p className="text-black">
                Description of what students will learn
              </p>
            </div>
            <div>
              <h3 className="font-bold text-black mb-2">Skill 4</h3>
              <p className="text-black">
                Description of what students will learn
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-black mb-8">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="w-12 h-12 bg-brand-orange-600 text-white rounded-full flex items-center justify-center font-bold text-xl mb-4">
                1
              </div>
              <h3 className="text-xl font-bold text-black mb-2">Apply</h3>
              <p className="text-black">
                Submit your application and we'll help you find funding options.
              </p>
            </div>
            <div>
              <div className="w-12 h-12 bg-brand-orange-600 text-white rounded-full flex items-center justify-center font-bold text-xl mb-4">
                2
              </div>
              <h3 className="text-xl font-bold text-black mb-2">Train</h3>
              <p className="text-black">
                Complete hands-on training with experienced instructors.
              </p>
            </div>
            <div>
              <div className="w-12 h-12 bg-brand-orange-600 text-white rounded-full flex items-center justify-center font-bold text-xl mb-4">
                3
              </div>
              <h3 className="text-xl font-bold text-black mb-2">
                Launch Your Career
              </h3>
              <p className="text-black">
                Get certified and start working in your new career.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Funding Options */}
      <section className="py-16 bg-blue-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-black mb-4">
            Funded with Funding
          </h2>
          <p className="text-xl text-black mb-8 max-w-3xl">
            Most students qualify for free training through WIOA, WRG, JRI, or
            DOL-registered apprenticeships.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6">
              <h3 className="font-bold text-black mb-2">WIOA Funding</h3>
              <p className="text-black text-sm">
                Workforce Innovation and Opportunity Act funding for eligible
                individuals.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6">
              <h3 className="font-bold text-black mb-2">WRG Funding</h3>
              <p className="text-black text-sm">
                Workforce Ready Grant for Indiana residents pursuing in-demand
                careers.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6">
              <h3 className="font-bold text-black mb-2">JRI Funding</h3>
              <p className="text-black text-sm">
                Justice Reinvestment Initiative for individuals with criminal
                justice involvement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-brand-orange-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Apply today and take the first step toward your new career.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="px-8 py-4 bg-white text-brand-orange-600 font-bold rounded-lg hover:bg-slate-50 transition text-center"
            >
              Apply Now
            </Link>
            <Link
              href="/programs"
              className="px-8 py-4 bg-brand-orange-700 text-white font-bold rounded-lg hover:bg-brand-orange-800 transition text-center"
            >
              View All Programs
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
