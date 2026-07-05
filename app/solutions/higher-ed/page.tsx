export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  University,
  BookOpen,
  Award,
  ArrowRight,
  CheckCircle,
  Users,
  FileText,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Higher Education Solutions',
  description:
    'Workforce development partnerships for community colleges and universities. Stackable credentials, registered apprenticeships, and employer-connected training.',
};

const PARTNERSHIP_MODELS = [
  {
    title: 'Dual Enrollment',
    desc: 'Students earn college credit while completing Elevate career programs. We handle the industry credential; you award the credit hours.',
    icon: BookOpen,
  },
  {
    title: 'Apprenticeship Articulation',
    desc: 'USDOL Registered Apprenticeship OJT hours articulate to credit hours at partner institutions. Reduces time-to-degree for working students.',
    icon: FileText,
  },
  {
    title: 'Workforce Contract Training',
    desc: 'Employer-sponsored cohorts trained through your institution using Elevate curriculum. Revenue share model available.',
    icon: Users,
  },
  {
    title: 'Stackable Credential Pathways',
    desc: 'Short-term Elevate credentials stack into your associate or bachelor degree programs. Students build credentials incrementally.',
    icon: Award,
  },
];

const BENEFITS = [
  'Accreditation-ready curriculum aligned to NACE competencies',
  'LMS integration with Canvas, Blackboard, and Moodle',
  'Employer network of 200+ Indiana hiring partners',
  'WIOA and Pell Grant eligible programs',
  'Dedicated institutional success manager',
  'Real-time enrollment and completion reporting dashboard',
  'Co-branded certificates and credentials',
  'Priority placement for your graduates with employer partners',
];

export default function HigherEdSolutionsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-violet-900 to-violet-700 text-white py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-violet-800 rounded-full px-4 py-2 text-violet-200 text-sm font-medium mb-6">
            <University className="w-4 h-4" />
            Higher Education Partnerships
          </div>
          <h1 className="text-5xl font-black mb-6 leading-tight">
            Workforce credentials that
            <br />
            complement your degrees.
          </h1>
          <p className="text-xl text-violet-100 mb-10 max-w-2xl mx-auto">
            Elevate partners with community colleges and universities to deliver employer-connected
            career credentials that stack into your existing degree programs — increasing
            enrollment, retention, and graduate employment rates.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/for-providers"
              className="bg-white text-violet-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-violet-50 transition-colors"
            >
              Explore Partnership Models
            </Link>
            <Link
              href="/contact"
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-violet-800 transition-colors"
            >
              Schedule a Meeting
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-violet-50 py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '4', label: 'Partnership Models' },
            { value: '200+', label: 'Employer Partners' },
            { value: 'WIOA', label: 'Funding Eligible' },
            { value: 'LMS', label: 'Integration Ready' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-4xl font-black text-violet-700">{value}</p>
              <p className="text-slate-600 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Partnership Models */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 mb-3">Partnership models</h2>
          <p className="text-slate-600 mb-10">
            Choose the model that fits your institution's goals, or combine multiple approaches.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {PARTNERSHIP_MODELS.map(({ title, desc, icon: Icon }) => (
              <div
                key={title}
                className="border border-slate-200 rounded-xl p-6 hover:border-violet-300 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-violet-600" />
                </div>
                <p className="font-bold text-slate-900 mb-2">{title}</p>
                <p className="text-slate-600 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-slate-50 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 mb-10">What your institution gets</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {BENEFITS.map((b) => (
              <div key={b} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5" />
                <p className="text-slate-700">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-violet-900 text-white py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <University className="w-12 h-12 text-violet-300 mx-auto mb-6" />
          <h2 className="text-3xl font-black mb-4">Let's build a pathway together.</h2>
          <p className="text-violet-200 mb-8">
            We work with your academic affairs and workforce development teams to design a
            partnership that fits your accreditation requirements and student population.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/for-providers"
              className="bg-white text-violet-900 px-10 py-4 rounded-xl font-bold text-lg hover:bg-violet-50 transition-colors"
            >
              Start a Partnership →
            </Link>
            <Link
              href="/contact"
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-violet-800 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
