import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, BarChart3, Calendar, Database, Users, Clock, CheckCircle } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Outcomes Methodology | Elevate for Humanity',
  description: 'How Elevate for Humanity measures and reports student outcomes, including cohort definitions, data sources, and calculation methods.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/outcomes',
  },
};

export default function OutcomesMethodologyPage() {
  return (
    <div className="min-h-screen bg-white">      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Governance', href: '/governance' }, { label: 'Outcomes Methodology' }]} />
        </div>
      </div>

      {/* Hero Image */}
      <section className="relative h-[200px] sm:h-[280px] md:h-[340px] overflow-hidden">
        <Image src="/images/pages/outcomes-page-1.jpg" alt="Student outcomes and placement rates" fill sizes="100vw" className="object-cover" priority />
      </section>

      <div className="bg-slate-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Link
            href="/admin/governance"
            className="inline-flex items-center text-slate-400 hover:text-white mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Governance
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-brand-blue-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Outcomes Methodology</h1>
              <p className="text-slate-300 text-sm mt-1">How we measure and report student outcomes</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">
            <span>Last Updated: February 2026</span>
            <span>•</span>
            <span>Reporting Period: July 2024 &ndash; January 2026</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Overview */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">
            Overview
          </h2>
          <p className="text-slate-700 leading-relaxed">
            Elevate for Humanity publishes outcome metrics to provide transparency to students, 
            funding agencies, employer partners, and the public. This document explains how each 
            metric is defined, measured, and reported. All outcome data is subject to verification 
            and is updated on a rolling basis.
          </p>
        </section>

        {/* Definitions */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">
            Metric Definitions
          </h2>
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Users className="w-5 h-5 text-brand-blue-600" />
                <h3 className="font-bold text-slate-900">&ldquo;Students Accepted&rdquo;</h3>
              </div>
              <p className="text-slate-700 text-sm mb-2">
                Count of individuals who completed the enrollment process and were admitted into 
                a training program. Includes students funded through WIOA, WRG, JRI, self-pay, 
                and employer-sponsored pathways.
              </p>
              <p className="text-slate-600 text-xs">
                <strong>Excludes:</strong> Applicants who inquired but did not complete enrollment. 
                Applicants who were referred but did not attend orientation.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900">&ldquo;Job Placement Rate&rdquo;</h3>
              </div>
              <p className="text-slate-700 text-sm mb-2">
                Percentage of program completers who obtained employment in a training-related 
                field within 90 days of program completion.
              </p>
              <p className="text-slate-600 text-xs">
                <strong>Definition of &ldquo;employed&rdquo;:</strong> Verified employment of at least 
                20 hours per week in a position related to the training program completed. Includes 
                full-time, part-time, and apprenticeship positions.
              </p>
              <p className="text-slate-600 text-xs mt-1">
                <strong>Excludes:</strong> Students who withdrew before completion. Students who 
                chose to pursue further education instead of immediate employment.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900">&ldquo;Days to Paycheck&rdquo;</h3>
              </div>
              <p className="text-slate-700 text-sm mb-2">
                Median number of calendar days between program completion date and first verified 
                paycheck in a training-related position.
              </p>
              <p className="text-slate-600 text-xs">
                <strong>Measurement:</strong> Calculated from the program completion date (final 
                credential issued) to the start date of verified employment. Self-reported start 
                dates are cross-referenced with employer verification where available.
              </p>
            </div>
          </div>
        </section>

        {/* Data Sources */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">
            Data Sources
          </h2>
          <div className="bg-white rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <Database className="w-5 h-5 text-brand-blue-600" />
              <h3 className="font-bold text-slate-900">How We Collect Outcome Data</h3>
            </div>
            <ul className="space-y-3 text-slate-700 text-sm">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-slate-900 min-w-[140px]">Enrollment records</span>
                <span>Internal LMS and CRM enrollment database</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-slate-900 min-w-[140px]">Completion records</span>
                <span>Credential issuance dates from certification tracking system</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-slate-900 min-w-[140px]">Employment data</span>
                <span>Student self-report surveys (30, 60, 90 days post-completion), employer partner verification, and WorkOne/DWD follow-up data where available</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-slate-900 min-w-[140px]">Wage data</span>
                <span>Self-reported starting wages, cross-referenced with BLS occupational wage data for reasonableness</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Cohort */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">
            Cohort Definition
          </h2>
          <div className="bg-white rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-5 h-5 text-brand-blue-600" />
              <h3 className="font-bold text-slate-900">Current Reporting Cohort</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Cohort Period</p>
                <p className="font-semibold text-slate-900">July 2024 &ndash; January 2026</p>
              </div>
              <div>
                <p className="text-slate-500">Measurement Window</p>
                <p className="font-semibold text-slate-900">90 days post-completion</p>
              </div>
              <div>
                <p className="text-slate-500">Programs Included</p>
                <p className="font-semibold text-slate-900">All active certification and apprenticeship programs</p>
              </div>
              <div>
                <p className="text-slate-500">Next Update</p>
                <p className="font-semibold text-slate-900">Quarterly (next: April 2026)</p>
              </div>
            </div>
          </div>
        </section>

        {/* Limitations */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">
            Limitations &amp; Notes
          </h2>
          <ul className="list-disc pl-6 space-y-2 text-slate-700 text-sm">
            <li>Employment verification relies partially on student self-reporting. Not all graduates respond to follow-up surveys.</li>
            <li>Placement rates reflect only students who completed their program. Students who withdrew are excluded from the denominator.</li>
            <li>Wage data is self-reported and may not reflect total compensation (benefits, overtime, tips).</li>
            <li>Outcomes may vary by program, location, and labor market conditions.</li>
            <li>Historical data prior to July 2024 used different collection methods and is not directly comparable.</li>
          </ul>
        </section>

        {/* Contact */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">
            Questions About Our Data
          </h2>
          <p className="text-slate-700 text-sm">
            For questions about outcomes methodology, data requests, or to report a discrepancy, 
            contact us at{' '}
            <a href="/contact" className="text-brand-blue-600 hover:underline">
              our contact form
            </a>{' '}
            or call (317) 314-3757.
          </p>
        </section>

        <div className="border-t pt-8 mt-8">
          <h3 className="font-bold text-slate-900 mb-4">Related Documents</h3>
          <div className="flex flex-wrap gap-4">
            <Link href="/admin/governance/legal" className="text-brand-blue-600 hover:underline">Legal &amp; Entity Information</Link>
            <Link href="/privacy-policy" className="text-brand-blue-600 hover:underline">Privacy Policy</Link>
            <Link href="/admin/governance" className="text-brand-blue-600 hover:underline">Governance Overview</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
