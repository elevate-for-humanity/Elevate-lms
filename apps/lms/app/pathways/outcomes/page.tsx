import { Metadata } from 'next';
import { PROGRAM_WORKFORCE_OUTCOMES } from '@/lib/curriculum/workforce-outcomes';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { TrendingUp, Building2, Award, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Career Outcomes | Elevate for Humanity',
  description: 'Explore career outcomes, median wages, and job growth projections for Elevate programs.',
};

export default function OutcomesPage() {
  const outcomes = Object.entries(PROGRAM_WORKFORCE_OUTCOMES);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Pathways', href: '/pathways' }, { label: 'Career Outcomes' }]} />
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm font-bold mb-6">
              <TrendingUp className="w-4 h-4" />
              Career Outcomes
            </div>
            <h1 className="text-4xl font-black mb-4">Real Careers. Real Outcomes.</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Every Elevate program is aligned to real occupations with verified wage data and employer demand.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="text-4xl font-black text-brand-blue-600 mb-2">$45K+</div>
              <p className="text-slate-600">Average Median Wage</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="text-4xl font-black text-brand-green-600 mb-2">12+</div>
              <p className="text-slate-600">Programs with Verified Outcomes</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="text-4xl font-black text-brand-orange-600 mb-2">22K+</div>
              <p className="text-slate-600">Indiana Annual Openings</p>
            </div>
          </div>
        </div>
      </section>

      {/* Outcomes Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-black mb-8">Program Career Outcomes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {outcomes.map(([slug, outcome]) => (
              <div key={slug} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-black">{outcome.title}</h3>
                    <p className="text-sm text-slate-500">SOC: {outcome.socCode}</p>
                  </div>
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded">
                    {outcome.projectedGrowth}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-brand-green-600" />
                    <span className="text-sm text-slate-700">
                      <strong>${outcome.medianWage.toLocaleString()}</strong>/year median
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-brand-blue-600" />
                    <span className="text-sm text-slate-700">
                      <strong>~{outcome.indianaJobOpenings?.toLocaleString()}</strong> annual openings in Indiana
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-600" />
                    <span className="text-sm text-slate-700">
                      {outcome.topEmployers.slice(0, 3).join(', ')}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-brand-orange-600" />
                    <span className="text-sm font-semibold text-slate-700">Related Certifications</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {outcome.relatedCertifications.slice(0, 3).map((cert) => (
                      <span key={cert} className="px-2 py-1 bg-brand-blue-50 text-brand-blue-700 text-xs rounded">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <Link 
                    href={`/pathways/${slug}`}
                    className="text-sm font-semibold text-brand-blue-600 hover:text-brand-blue-700"
                  >
                    View Program →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-700">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your Career?</h2>
          <p className="text-blue-100 mb-8">
            Apply today and start your journey toward a fulfilling career with real growth potential.
          </p>
          <Link href="/apply" className="inline-block bg-white text-brand-blue-700 font-bold py-3 px-8 rounded-lg hover:bg-blue-50">
            Apply Now
          </Link>
        </div>
      </section>
    </div>
  );
}
