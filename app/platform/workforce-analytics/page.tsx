
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  BarChart, TrendingUp, Users, FileText, ArrowRight,
  PieChart, Activity, Target, Download,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Workforce Analytics | Elevate For Humanity',
  description: 'Data-driven insights for workforce development. Real-time dashboards, DOL reporting, and outcome tracking for workforce boards and training providers.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/platform/workforce-analytics' },
  openGraph: {
    title: 'Workforce Analytics | Elevate For Humanity',
    description: 'Data-driven insights for workforce development decision making.',
    url: 'https://www.elevateforhumanity.org/platform/workforce-analytics',
    siteName: 'Elevate for Humanity',
    images: [{ url: '/hero-images/technology-hero.jpg', width: 1200, height: 630, alt: 'Workforce Analytics' }],
    type: 'website',
  },
};

const metrics = [
  { label: 'Participants Served', value: '12,450', change: '+15%' },
  { label: 'Completion Rate', value: '87%', change: '+3%' },
  { label: 'Employment Rate', value: '78%', change: '+5%' },
  { label: 'Avg Wage Gain', value: '$4.50/hr', change: '+8%' },
];

const features = [
  { icon: PieChart, title: 'Real-Time Dashboards', description: 'Live metrics on enrollment, completion, employment, and wage outcomes across all programs.' },
  { icon: FileText, title: 'DOL-Ready Reports', description: 'Pre-built report templates for WIOA quarterly and annual performance reporting.' },
  { icon: TrendingUp, title: 'Trend Analysis', description: 'Track performance over time with historical data, cohort comparisons, and forecasting.' },
  { icon: Target, title: 'Goal Tracking', description: 'Set and monitor performance targets for each program, provider, and region.' },
  { icon: Activity, title: 'Early Warning System', description: 'Automated alerts when students are at risk of dropping out or falling behind.' },
  { icon: Download, title: 'Data Export', description: 'Export data in CSV, Excel, or PDF format for external reporting and analysis.' },
];

const reportTypes = [
  { title: 'WIOA Performance', description: 'Quarterly and annual performance metrics for DOL reporting.' },
  { title: 'Enrollment Pipeline', description: 'Track applications, enrollments, and waitlists across programs.' },
  { title: 'Completion & Credentials', description: 'Monitor credential attainment and program completion rates.' },
  { title: 'Employment Outcomes', description: 'Post-program employment, retention, and wage data.' },
  { title: 'Provider Scorecard', description: 'Compare training provider performance and ROI.' },
  { title: 'Demographic Analysis', description: 'Participation and outcomes by age, race, gender, and barriers.' },
];

export default function WorkforceAnalyticsPage() {

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Platform', href: '/platform' }, { label: 'Workforce Analytics' }]} />
        </div>
      </div>
      <div class="max-w-6xl mx-auto px-4 pb-2"><p class="text-sm text-slate-600 font-medium">Part of the <a href="/platform" class="text-brand-red-600 hover:underline">Elevate Workforce Operating System</a></p></div>

      {/* Hero */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] w-full overflow-hidden">
          <Image src="/hero-images/technology-hero.jpg" alt="Workforce Analytics" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Workforce Analytics</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">Data-driven insights for better workforce outcomes. Track participants from enrollment to employment.</p>
          </div>
        </div>
      </section>

      {/* Live Metrics */}
      <section className="py-12 bg-indigo-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-center text-sm font-medium text-indigo-600 uppercase tracking-wider mb-6">Platform Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {metrics.map((m, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border text-center">
                <p className="text-3xl font-bold text-gray-900">{m.value}</p>
                <p className="text-gray-600 text-sm mb-2">{m.label}</p>
                <span className="text-brand-green-600 text-sm font-medium">{m.change} YoY</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Analytics Features</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to measure, report, and improve workforce development outcomes.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Report Types */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Built-In Report Types</h2>
            <p className="text-lg text-gray-600">Pre-configured reports ready for federal and state reporting requirements.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportTypes.map((r, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border">
                <div className="flex items-start gap-3">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{r.title}</h3>
                    <p className="text-gray-600 text-sm">{r.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative h-[350px] rounded-2xl overflow-hidden shadow-xl">
              <Image src="/images/pages/platform-page-6.jpg" alt="Analytics dashboard" fill sizes="100vw" className="object-cover" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Integrated With Your Workflow</h2>
              <p className="text-gray-600 mb-6">
                Analytics are built into every part of the platform. No separate tools or manual data entry required.
              </p>
              <div className="space-y-3">
                {[
                  'Automatic data collection from LMS and enrollment systems',
                  'Real-time sync with attendance and progress tracking',
                  'Integration with state workforce databases',
                  'API access for custom reporting and BI tools',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">See Your Data in Action</h2>
          <p className="text-indigo-100 text-lg mb-8">Schedule a demo to see how our analytics platform can transform your workforce reporting.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/contact" className="px-8 py-4 bg-white text-indigo-700 font-bold rounded-lg hover:bg-indigo-50 transition inline-flex items-center gap-2">
              Schedule Demo <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/store/compliance" className="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition">
              Compliance Tools
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
