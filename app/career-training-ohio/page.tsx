export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Shield, MapPin, Users, Award } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/career-training-ohio' },
  title: `Career Training Ohio | ${PLATFORM_DEFAULTS.orgName} - Workforce Development Programs`,
  description:
    'Workforce development and career training programs in Ohio. Structured learning platform supporting statewide access to training initiatives with centralized program oversight.',
};

export default function CareerTrainingOhioPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-green-900 via-green-800 to-green-700 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-2 text-brand-green-200 mb-4">
            <MapPin className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">
              Serving All of Ohio
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-6">
            Career Training &amp; Workforce Programs in Ohio
          </h1>
          <p className="text-xl text-brand-green-100 mb-8 max-w-3xl">
            Ohio's workforce includes a diverse mix of industries, employers, and training needs.
            Career training programs supported by structured learning platforms help ensure
            consistency, accountability, and measurable progress for participants across the state.
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
          <h2 className="text-3xl font-bold text-slate-900 mb-8">Workforce Training in Ohio</h2>
          <p className="text-slate-600 mb-8">
            Workforce and career training programs in Ohio often emphasize:
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              'Skills aligned with employment and industry demand',
              'Defined participation and completion criteria',
              'Transparent progress tracking',
              'Clear administrative and instructional roles',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-brand-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-100">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">
            How the Learning Platform Supports Statewide Programs
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              'Centralized learner and program management',
              'Progress visibility for administrators and instructors',
              'Role-based access controls',
              'Documentation of participation and completion',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 bg-white p-4 rounded-lg">
                <CheckCircle className="w-5 h-5 text-brand-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">{item}</span>
              </div>
            ))}
          </div>
          <p className="text-slate-600 mt-6">
            Programs can operate across Ohio without geographic limitations.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">Who These Programs Are For</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-blue-500 mt-0.5" />
              <span className="text-slate-700">Students and jobseekers</span>
            </div>
            <div className="flex items-start gap-3">
              <Award aria-label="award" className="w-5 h-5 text-purple-500 mt-0.5" />
              <span className="text-slate-700">Employers and workforce partners</span>
            </div>
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-brand-green-500 mt-0.5" />
              <span className="text-slate-700">Training administrators and instructors</span>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-orange-500 mt-0.5" />
              <span className="text-slate-700">Program sponsors and oversight entities</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-100">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">
            Governance and Program Integrity
          </h2>
          <p className="text-slate-600 mb-8">
            Programs operate within defined governance and operational standards.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <Link
              href="/legal/governance"
              className="flex items-center gap-3 p-4 bg-white rounded-lg hover:bg-slate-50"
            >
              <Shield className="w-6 h-6 text-blue-600" />
              <span className="font-semibold text-slate-900">Platform Governance</span>
            </Link>
            <Link
              href="/legal/governance"
              className="flex items-center gap-3 p-4 bg-white rounded-lg hover:bg-slate-50"
            >
              <Award aria-label="award" className="w-6 h-6 text-brand-green-600" />
              <span className="font-semibold text-slate-900">Operational Controls</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">Platform Resources</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link
              href="/lms"
              className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 border border-slate-200"
            >
              <span className="font-semibold text-slate-900">Learning Platform</span>
              <p className="text-sm text-slate-600 mt-1">Access the learning management system</p>
            </Link>
            <Link
              href="/resources"
              className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 border border-slate-200"
            >
              <span className="font-semibold text-slate-900">Student Resources</span>
              <p className="text-sm text-slate-600 mt-1">Support materials and guides</p>
            </Link>
            <Link
              href="/programs"
              className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 border border-slate-200"
            >
              <span className="font-semibold text-slate-900">All Programs</span>
              <p className="text-sm text-slate-600 mt-1">Browse available training programs</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black text-white mb-4">Explore Programs and How It Works</h2>
          <p className="text-xl text-white/90 mb-8">
            Ohio-based participants and partners can explore available programs or learn how the
            platform supports structured training initiatives.
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
        Last reviewed: January 2026 | Service scope: Statewide digital program support
      </p>
    </div>
  );
}
