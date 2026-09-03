'use client';

/**
 * TrustStrip — static stat display. No DB queries on render.
 * All values come from lib/site-stats — update there, not here.
 */

import { Users, GraduationCap, Briefcase, Award, TrendingUp, Building2 } from 'lucide-react';
import { SITE_STATS, statLabel } from '@/lib/site-stats';

interface Props {
  variant?: 'default' | 'compact' | 'detailed';
  showAnimation?: boolean;
  className?: string;
}

function fmt(n: string | number) {
  if (typeof n === 'string') return n;
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return n.toLocaleString('en-US');
  return n.toString();
}

export default function TrustStrip({ variant = 'default', className }: Props) {
  if (variant === 'compact') {
    return (
      <section
        className={`py-8 bg-gradient-to-r from-brand-red-600 to-brand-red-700 text-white ${className || ''}`}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            <div className="text-center">
              <div className="text-3xl font-extrabold">Many</div>
              <div className="text-sm text-white font-medium">Students Trained</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold">{statLabel.placement}</div>
              <div className="text-sm text-white font-medium">Job Placement</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold">$0</div>
              <div className="text-sm text-white font-medium">Cost to Students</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold">100%</div>
              <div className="text-sm text-white font-medium">Funded Programs</div>
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
          <h2 className="text-3xl font-bold text-center mb-12">Trusted by Students &amp; Employers</h2>
          <div className="grid gap-8 md:grid-cols-3 lg:grid-cols-6 max-w-6xl mx-auto">
            <div className="text-center p-6 rounded-xl bg-blue-50 hover:bg-blue-100 transition">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-slate-900">Many</div>
              <div className="text-sm text-slate-700">Students Enrolled</div>
            </div>
            <div className="text-center p-6 rounded-xl bg-brand-green-50 hover:bg-brand-green-100 transition">
              <GraduationCap aria-label="graduationcap" className="w-8 h-8 text-brand-green-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-slate-900">{statLabel.programs}</div>
              <div className="text-sm text-slate-700">Training Programs</div>
            </div>
            <div className="text-center p-6 rounded-xl bg-purple-50 hover:bg-purple-100 transition">
              <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-slate-900">{statLabel.placement}</div>
              <div className="text-sm text-slate-700">Job Placement Rate</div>
            </div>
            <div className="text-center p-6 rounded-xl bg-orange-50 hover:bg-orange-100 transition">
              <Award aria-label="award" className="w-8 h-8 text-orange-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-slate-900">
                {statLabel.credentials}
              </div>
              <div className="text-sm text-slate-700">Certificates Issued</div>
            </div>
            <div className="text-center p-6 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition">
              <Briefcase className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-slate-900">{statLabel.employers}</div>
              <div className="text-sm text-slate-700">Employer Partners</div>
            </div>
            <div className="text-center p-6 rounded-xl bg-teal-50 hover:bg-teal-100 transition">
              <Building2 className="w-8 h-8 text-teal-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-slate-900">{statLabel.funding}</div>
              <div className="text-sm text-slate-700">Funding Secured</div>
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
            <div className="text-3xl font-extrabold text-slate-900">$0</div>
            <div className="text-slate-700">Cost to Students</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900">100%</div>
            <div className="text-slate-700">Funded Programs</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-blue-600">Many</div>
            <div className="text-slate-700">Students Trained</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-brand-green-600">{statLabel.placement}</div>
            <div className="text-slate-700">Job Placement</div>
          </div>
        </div>
      </div>
    </section>
  );
}
