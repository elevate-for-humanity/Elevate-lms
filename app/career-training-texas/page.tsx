export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Shield, MapPin, Award } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/career-training-texas' },
  title: `Career Training Texas | ${PLATFORM_DEFAULTS.orgName} - Workforce Development Programs`,
  description:
    'Workforce development and career training programs in Texas. Digital learning platforms supporting statewide access and program consistency at scale.',
};

export default function CareerTrainingTexasPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-green-900 via-green-800 to-green-700 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-2 text-brand-green-200 mb-4">
            <MapPin className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">
              Serving All of Texas
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-6">
            Career Training &amp; Workforce Programs in Texas
          </h1>
          <p className="text-xl text-brand-green-100 mb-8 max-w-3xl">
            Texas workforce programs operate at scale and often require structured systems to manage
            participation and oversight. Digital learning platforms support statewide access and
            program consistency.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/programs"
              className="inline-flex items-center justify-center px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-lg font-bold transition-colors"
            >
              Explore Programs <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-white/20 text-slate-900 border-2 border-white/30 rounded-lg text-lg font-bold transition-colors"
            >
              How It Works
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">Workforce Training</h2>
          <p className="text-slate-600 mb-8">Programs emphasize:</p>
          <div className="grid md:grid-cols-3 gap-6">
            {['Structured learning', 'Progress accountability', 'Clear completion standards'].map(
              (item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{item}</span>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-100">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">Platform Support</h2>
          <p className="text-slate-600 mb-8">
            The platform enables centralized management and visibility across programs.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              'Centralized management',
              'Program visibility',
              'Learner tracking',
              'Administrative oversight',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 bg-white p-4 rounded-lg">
                <CheckCircle className="w-5 h-5 text-brand-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">Governance</h2>
          <p className="text-slate-600 mb-8">
            Programs align with documented governance and operational controls.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <Link
              href="/legal/governance"
              className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100"
            >
              <Shield className="w-6 h-6 text-blue-600" />
              <span className="font-semibold text-slate-900">Governance</span>
            </Link>
            <Link
              href="/legal/governance"
              className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100"
            >
              <Award aria-label="award" className="w-6 h-6 text-brand-green-600" />
              <span className="font-semibold text-slate-900">Operational Controls</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-100">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">Platform Resources</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link
              href="/lms"
              className="p-4 bg-white rounded-lg hover:bg-slate-50 border border-slate-200"
            >
              <span className="font-semibold text-slate-900">Learning Platform</span>
              <p className="text-sm text-slate-600 mt-1">Access the learning management system</p>
            </Link>
            <Link
              href="/resources"
              className="p-4 bg-white rounded-lg hover:bg-slate-50 border border-slate-200"
            >
              <span className="font-semibold text-slate-900">Student Resources</span>
              <p className="text-sm text-slate-600 mt-1">Support materials and guides</p>
            </Link>
            <Link
              href="/programs"
              className="p-4 bg-white rounded-lg hover:bg-slate-50 border border-slate-200"
            >
              <span className="font-semibold text-slate-900">All Programs</span>
              <p className="text-sm text-slate-600 mt-1">Browse available training programs</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black text-white mb-4">Explore Programs</h2>
          <p className="text-xl text-white/90 mb-8">
            Texas-based partners and participants can explore how structured programs operate
            statewide.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/programs"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-orange-600 rounded-lg text-lg font-bold hover:bg-slate-100 transition-colors"
            >
              Browse Programs
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-white text-slate-900 rounded-lg text-lg font-bold hover:bg-white hover:text-orange-600 transition-colors"
            >
              How It Works
            </Link>
          </div>
        </div>
      </section>

      <p className="text-center text-slate-500 text-sm py-8">
        Last reviewed: January 2026 | Service scope: Statewide digital support
      </p>
    </div>
  );
}
