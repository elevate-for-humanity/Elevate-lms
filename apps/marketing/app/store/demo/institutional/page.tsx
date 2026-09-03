export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, Play, LayoutGrid, Users, FileBarChart, Eye, Award, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Institutional Operator Demo',
  keywords: ["demo", "platform demo", "workforce software", "LMS demo"], description: 'See how institutions operate multiple programs while maintaining clean, auditable records.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/store/demo/institutional',
  },
};

const demoSteps = [
  {
    step: 1,
    title: 'Program Manager View',
    keywords: ["demo", "platform demo", "workforce software", "LMS demo"], description: 'Multiple programs listed with different funding paths per program.',
    icon: LayoutGrid,
    detail: 'See all active programs at a glance. Each program has its own funding configuration, eligibility rules, and credential types.',
  },
  {
    step: 2,
    title: 'Roster & Progress',
    keywords: ["demo", "platform demo", "workforce software", "LMS demo"], description: 'Multiple cohorts with attendance and progress views.',
    icon: Users,
    detail: 'Track learners across cohorts. Attendance logged automatically. Progress percentages updated in real-time.',
  },
  {
    step: 3,
    title: 'Compliance Dashboard',
    keywords: ["demo", "platform demo", "workforce software", "LMS demo"], description: 'Report filters by funding source, dates, and program.',
    icon: FileBarChart,
    detail: 'Generate compliance reports without manual data entry. Filter by WIOA, WRG, JRI, or self-pay. Export for audits.',
  },
  {
    step: 4,
    title: 'Partner Visibility',
    keywords: ["demo", "platform demo", "workforce software", "LMS demo"], description: 'Employer and partner read-only access to relevant data.',
    icon: Eye,
    detail: 'Partners see only what they need. No full admin access required. Controlled visibility maintains data integrity.',
  },
  {
    step: 5,
    title: 'Credential Management',
    keywords: ["demo", "platform demo", "workforce software", "LMS demo"], description: 'Rules per credential type with automated issuance.',
    icon: Award,
    detail: 'Different credentials for different programs. Completion requirements enforced automatically. Verification links generated.',
  },
];

export default function InstitutionalDemoPage() {
  return (
    <main className="bg-white min-h-screen">
      {/* Header */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/store/demos" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Licenses
          </Link>
          
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">INSTITUTIONAL LICENSE</span>
            <span className="text-slate-400">$2,500/month</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-black mb-4">
            Operate Multiple Programs With Audit-Ready Records
          </h1>
          <p className="text-xl text-slate-300 mb-6">
            This demo shows how institutions manage multiple programs while maintaining clean, oversight-ready records. 
            The preview below uses clearly labeled sample data to show how enrollment, attendance, and reporting workflows fit together.
          </p>
          
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              8–10 minutes
            </span>
            <span>•</span>
            <span>For schools, nonprofits, training providers</span>
          </div>
        </div>
      </section>

      {/* Interactive Demo Preview */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Browser chrome */}
            <div className="bg-slate-100 px-4 py-3 flex items-center gap-2 border-b border-slate-200">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="flex-1 text-center">
                <span className="text-xs text-slate-500">admin.elevateforhumanity.org</span>
              </div>
            </div>
            
            {/* Dashboard Mockup */}
            <div className="p-6 bg-slate-50">
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Active Students', value: '247', change: '+12%' },
                  { label: 'Applications', value: '38', change: '3 pending' },
                  { label: 'Revenue MTD', value: '$12,450', change: '+8%' },
                  { label: 'Credentials', value: '89', change: 'This month' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-lg p-4 border border-slate-200">
                    <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                    <p className="text-xs text-emerald-600 mt-1">{stat.change}</p>
                  </div>
                ))}
              </div>
              
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-slate-900">Recent Applications</h4>
                  <span className="text-xs text-slate-500">Last 7 days</span>
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'Marcus Johnson', program: 'CDL Training', status: 'Under Review' },
                    { name: 'Sarah Williams', program: 'HVAC Technician', status: 'Approved' },
                    { name: 'James Brown', program: 'Medical Assistant', status: 'Pending Docs' },
                  ].map((app) => (
                    <div key={app.name} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-brand-blue-100 rounded-full flex items-center justify-center text-brand-blue-700 font-semibold text-xs">
                          {app.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-slate-900">{app.name}</p>
                          <p className="text-xs text-slate-500">{app.program}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        app.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                        app.status === 'Pending Docs' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-6">
            <p className="text-sm text-slate-500 mb-4">
              Sample dashboard preview — no production participant data
            </p>
            <Link
              href="/store/demo/admin"
              className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-6 py-3 rounded-lg transition-colors"
            >
              <Play className="w-5 h-5" />
              Open Interactive Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Demo Flow */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-4">Demo Flow</h2>
          <p className="text-center text-slate-600 mb-12">What you'll see in this walkthrough</p>
          
          <div className="space-y-6">
            {demoSteps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="flex gap-4 p-6 bg-slate-50 rounded-xl">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-bold text-blue-600">STEP {step.step}</span>
                      <h3 className="font-bold text-lg">{step.title}</h3>
                    </div>
                    <p className="text-slate-700 mb-2">{step.description}</p>
                    <p className="text-sm text-slate-500">{step.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What This Replaces */}
      <section className="py-12 bg-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl font-bold mb-4">What This Replaces</h2>
          <p className="text-slate-700 max-w-2xl mx-auto">
            This replaces <strong>registrar coordination</strong>, <strong>compliance staff tracking</strong>, 
            and <strong>internal reporting prep</strong>. In production, reports are designed to generate from authorized operational records rather than a separate manual assembly process.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Scope an Institutional License?</h2>
          <p className="text-blue-100 mb-8">
            Starting at $2,500/month • Final scope, service levels, implementation, and contract terms are confirmed before purchase
          </p>
          <Link
            href="/contact?topic=platform-licensing&product=institutional"
            className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-lg font-bold hover:bg-blue-50 transition-colors"
          >
            Request Institutional Scope
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
