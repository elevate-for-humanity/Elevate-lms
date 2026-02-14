import { Metadata } from 'next';
import Link from 'next/link';
import { 
  TrendingUp, Users, Award, Briefcase, GraduationCap, 
  DollarSign, CheckCircle, ArrowRight, MapPin, BarChart3 
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Indiana Workforce Outcomes | Elevate for Humanity',
  description: 'Training completion rates, employment outcomes, and workforce impact data for Elevate programs operating in Indiana.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/outcomes/indiana',
  },
};

const outcomeMetrics = [
  {
    label: 'Program Completion Rate',
    value: '87%',
    description: 'Students who complete their enrolled training program',
    icon: GraduationCap,
  },
  {
    label: 'Employment Within 6 Months',
    value: '78%',
    description: 'Graduates employed in their field within 6 months',
    icon: Briefcase,
  },
  {
    label: 'Average Wage Increase',
    value: '42%',
    description: 'Average wage increase for graduates vs. pre-enrollment',
    icon: DollarSign,
  },
  {
    label: 'Credential Attainment',
    value: '91%',
    description: 'Students who earn an industry-recognized credential',
    icon: Award,
  },
];

const programOutcomes = [
  {
    program: 'Barber Apprenticeship',
    enrolled: 124,
    completed: 108,
    employed: 96,
    avgWage: '$38,500',
    region: 'Indianapolis Metro',
  },
  {
    program: 'CNA Certification',
    enrolled: 89,
    completed: 78,
    employed: 71,
    avgWage: '$34,200',
    region: 'Statewide',
  },
  {
    program: 'HVAC Technician',
    enrolled: 56,
    completed: 48,
    employed: 44,
    avgWage: '$45,800',
    region: 'Central Indiana',
  },
  {
    program: 'CDL Training',
    enrolled: 67,
    completed: 61,
    employed: 58,
    avgWage: '$52,000',
    region: 'Statewide',
  },
  {
    program: 'IT Support',
    enrolled: 43,
    completed: 37,
    employed: 32,
    avgWage: '$41,500',
    region: 'Indianapolis Metro',
  },
];

const fundingSources = [
  { name: 'WIOA Adult & Dislocated Worker', percentage: 38 },
  { name: 'Workforce Ready Grant (WRG)', percentage: 28 },
  { name: 'EmployIndy / WorkOne', percentage: 18 },
  { name: 'Self-Pay / Employer Sponsored', percentage: 12 },
  { name: 'Other (JRI, DOL Grants)', percentage: 4 },
];

export default function IndianaOutcomesPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'About', href: '/about' },
            { label: 'Indiana Outcomes' },
          ]} />
        </div>
      </div>

      {/* Hero */}
      <div className="bg-slate-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-6 h-6 text-brand-blue-400" />
            <span className="text-brand-blue-400 font-medium">Indiana</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Indiana Workforce Outcomes
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl">
            Measurable results from Elevate training programs operating across Indiana. 
            Data reflects program completions, employment placement, and wage outcomes.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Key Metrics */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Key Metrics</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {outcomeMetrics.map((metric) => (
              <div key={metric.label} className="bg-white border border-slate-200 rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-brand-blue-50 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <metric.icon className="w-6 h-6 text-brand-blue-600" />
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-1">{metric.value}</div>
                <div className="text-sm font-medium text-slate-700 mb-2">{metric.label}</div>
                <div className="text-xs text-slate-500">{metric.description}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Program Breakdown */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Outcomes by Program</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="py-3 pr-4 text-sm font-semibold text-slate-700">Program</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-700 text-right">Enrolled</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-700 text-right">Completed</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-700 text-right">Employed</th>
                  <th className="py-3 px-4 text-sm font-semibold text-slate-700 text-right">Avg Wage</th>
                  <th className="py-3 pl-4 text-sm font-semibold text-slate-700">Region</th>
                </tr>
              </thead>
              <tbody>
                {programOutcomes.map((row) => (
                  <tr key={row.program} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 pr-4 font-medium text-slate-900">{row.program}</td>
                    <td className="py-3 px-4 text-right text-slate-700">{row.enrolled}</td>
                    <td className="py-3 px-4 text-right text-slate-700">{row.completed}</td>
                    <td className="py-3 px-4 text-right text-slate-700">{row.employed}</td>
                    <td className="py-3 px-4 text-right font-medium text-green-700">{row.avgWage}</td>
                    <td className="py-3 pl-4 text-slate-600 text-sm">{row.region}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Funding Sources */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Funding Sources</h2>
          <div className="space-y-4">
            {fundingSources.map((source) => (
              <div key={source.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-700 font-medium">{source.name}</span>
                  <span className="text-slate-900 font-semibold">{source.percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div 
                    className="bg-brand-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${source.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Methodology */}
        <section className="mb-16 bg-slate-50 rounded-xl p-6 border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Data Methodology</h2>
          <ul className="space-y-2 text-slate-700 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Completion rates measured at program end date, including extensions</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Employment tracked via employer verification and UI wage records at 6-month intervals</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Wage data reflects annualized earnings from primary employment</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Credential attainment includes state licenses, industry certifications, and apprenticeship completions</span>
            </li>
          </ul>
        </section>

        {/* CTA */}
        <section className="text-center py-8 border-t border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Interested in Our Programs?</h2>
          <p className="text-slate-600 mb-6">
            View available training programs or contact us about workforce partnerships.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/programs"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg font-medium hover:bg-brand-blue-700 transition-colors"
            >
              View Programs
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/platform/partners"
              className="inline-flex items-center gap-2 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Partner With Us
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
