"use client";

/**
 * TrustStrip — static stat display. No DB queries on render.
 * Numbers are updated here when real data warrants a change.
 */

import { Users, GraduationCap, Briefcase, Award, TrendingUp, Building2 } from 'lucide-react';

const STATS = {
  studentsEnrolled: 2500,
  programsOffered: 56,
  jobPlacementRate: 94,
  certificatesIssued: 1800,
  employerPartners: 150,
  fundingSecured: 5000000,
};

interface Props {
  variant?: 'default' | 'compact' | 'detailed';
  showAnimation?: boolean;
  className?: string;
}

function fmt(num: number) {
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return num.toLocaleString('en-US');
  return num.toString();
}

export default function TrustStrip({ variant = 'default', className }: Props) {
  if (variant === 'compact') {
    return (
      <section className={`py-8 bg-gradient-to-r from-brand-red-600 to-brand-red-700 text-white ${className || ''}`}>
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            <div className="text-center">
              <div className="text-3xl font-extrabold">{fmt(STATS.studentsEnrolled)}+</div>
              <div className="text-sm text-brand-red-100 font-medium">Students Trained</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold">{STATS.jobPlacementRate}%</div>
              <div className="text-sm text-brand-red-100 font-medium">Job Placement</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold">$0</div>
              <div className="text-sm text-brand-red-100 font-medium">Cost to Students</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold">100%</div>
              <div className="text-sm text-brand-red-100 font-medium">Funded Programs</div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (variant === 'detailed') {
    return (
      <section className={`py-16 bg-white ${className || ''}`}>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Trusted by Thousands</h2>
          <div className="grid gap-8 md:grid-cols-3 lg:grid-cols-6 max-w-6xl mx-auto">
            <div className="text-center p-6 rounded-xl bg-blue-50 hover:bg-blue-100 transition">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900">{fmt(STATS.studentsEnrolled)}+</div>
              <div className="text-sm text-gray-600">Students Enrolled</div>
            </div>
            <div className="text-center p-6 rounded-xl bg-green-50 hover:bg-green-100 transition">
              <GraduationCap className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900">{STATS.programsOffered}</div>
              <div className="text-sm text-gray-600">Training Programs</div>
            </div>
            <div className="text-center p-6 rounded-xl bg-purple-50 hover:bg-purple-100 transition">
              <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900">{STATS.jobPlacementRate}%</div>
              <div className="text-sm text-gray-600">Job Placement Rate</div>
            </div>
            <div className="text-center p-6 rounded-xl bg-orange-50 hover:bg-orange-100 transition">
              <Award className="w-8 h-8 text-orange-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900">{fmt(STATS.certificatesIssued)}</div>
              <div className="text-sm text-gray-600">Certificates Issued</div>
            </div>
            <div className="text-center p-6 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition">
              <Briefcase className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900">{STATS.employerPartners}+</div>
              <div className="text-sm text-gray-600">Employer Partners</div>
            </div>
            <div className="text-center p-6 rounded-xl bg-teal-50 hover:bg-teal-100 transition">
              <Building2 className="w-8 h-8 text-teal-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900">{fmt(STATS.fundingSecured)}</div>
              <div className="text-sm text-gray-600">Funding Secured</div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`py-10 bg-slate-50 border-y ${className || ''}`}>
      <div className="container mx-auto px-4">
        <div className="grid gap-6 md:grid-cols-4 text-center max-w-4xl mx-auto">
          <div>
            <div className="text-3xl font-extrabold text-gray-900">$0</div>
            <div className="text-gray-600">Cost to Students</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-gray-900">100%</div>
            <div className="text-gray-600">Funded Programs</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-blue-600">{fmt(STATS.studentsEnrolled)}+</div>
            <div className="text-gray-600">Students Trained</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-green-600">{STATS.jobPlacementRate}%</div>
            <div className="text-gray-600">Job Placement</div>
          </div>
        </div>
      </div>
    </section>
  );
}
