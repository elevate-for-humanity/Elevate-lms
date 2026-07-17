export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, Play, Building2, DollarSign, Briefcase, FileSearch, Bot, Download, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Enterprise Infrastructure Demo',
  keywords: ["demo", "platform demo", "workforce software", "LMS demo"], description: 'See how workforce boards and regional systems govern programs without direct operational involvement.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/store/demo/enterprise',
  },
};

const demoSteps = [
  {
    step: 1,
    title: 'Multi-Tenant Overview',
    keywords: ["demo", "platform demo", "workforce software", "LMS demo"], description: 'Multiple organizations with regional rollups visible from single dashboard.',
    icon: Building2,
    detail: 'Workforce boards see all providers. Regional operators see their territory. Each tenant isolated but aggregated for oversight.',
  },
  {
    step: 2,
    title: 'Funding Oversight',
    keywords: ["demo", "platform demo", "workforce software", "LMS demo"], description: 'WIOA / WRG / JRI views with outcome tracking across all programs.',
    icon: DollarSign,
    detail: 'Track funding utilization by source. See outcomes by funding type. Compliance data aggregated automatically.',
  },
  {
    step: 3,
    title: 'Employer Portal',
    description: "Employers see verified credentials for candidates they're considering.",
    icon: Briefcase,
    detail: 'Employers verify credentials without contacting providers. Hiring decisions supported by verified completion data.',
  },
  {
    step: 4,
    title: 'Audit Trail',
    keywords: ["demo", "platform demo", "workforce software", "LMS demo"], description: 'Event logs showing every action, status change, and decision point.',
    icon: FileSearch,
    detail: 'Full audit history. Who did what, when, and why. Exportable for compliance reviews and external audits.',
  },
  {
    step: 5,
    title: 'AI Avatar Support',
    keywords: ["demo", "platform demo", "workforce software", "LMS demo"], description: 'Learner guidance without staff intervention.',
    icon: Bot,
    detail: 'Avatar answers eligibility questions, explains requirements, guides applications. Staff freed from repetitive inquiries.',
  },
  {
    step: 6,
    title: 'Export & Reporting',
    keywords: ["demo", "platform demo", "workforce software", "LMS demo"], description: 'Downloadable reports for any time period, funding source, or program.',
    icon: Download,
    detail: 'Generate compliance reports on demand. Export to CSV, PDF. Data formatted for federal and state reporting requirements.',
  },
];

export default function EnterpriseDemoPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/store" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Licenses
          </Link>
          
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-slate-700 text-white text-xs font-bold px-3 py-1 rounded-full">ENTERPRISE LICENSE</span>
            <span className="text-slate-400">$8,500/month</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-black mb-4">
            Govern Workforce Programs at Regional Scale
          </h1>
          <p className="text-xl text-slate-300 mb-6">
            This demo shows how workforce boards and regional systems govern programs without direct operational involvement. 
            Every action is logged. Every outcome is traceable.
          </p>
          
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              10–12 minutes
            </span>
            <span>•</span>
            <span>For workforce boards, agencies, regional operators</span>
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
                <span className="text-xs text-slate-500">workforce-board.elevateforhumanity.org</span>
              </div>
            </div>
            
            {/* Analytics Dashboard Mockup */}
            <div className="p-6 bg-slate-50">
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'WIOA Enrolled', value: '1,247', change: 'This quarter' },
                  { label: 'ITA Issued', value: '$2.4M', change: 'Allocated' },
                  { label: 'Credentials Earned', value: '892', change: '+18% YoY' },
                  { label: 'Placement Rate', value: '87%', change: 'Above target' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-lg p-4 border border-slate-200">
                    <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                    <p className="text-xs text-emerald-600 mt-1">{stat.change}</p>
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <h4 className="font-semibold text-slate-900 mb-4">Provider Performance</h4>
                  <div className="space-y-3">
                    {[
                      { name: 'Elevate for Humanity', enrolled: 342, placed: 298, rate: '87%' },
                      { name: 'Workforce Partners LLC', enrolled: 215, placed: 178, rate: '83%' },
                    ].map((p) => (
                      <div key={p.name} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                        <div>
                          <p className="font-medium text-sm text-slate-900">{p.name}</p>
                          <p className="text-xs text-slate-500">{p.enrolled} enrolled</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-600">{p.rate}</p>
                          <p className="text-xs text-slate-500">{p.placed} placed</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <h4 className="font-semibold text-slate-900 mb-4">PIRL Reporting Status</h4>
                  <div className="space-y-3">
                    {['Q1 2026', 'Q4 2025', 'Q3 2025'].map((q, i) => (
                      <div key={q} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                        <span className="text-sm text-slate-900">{q}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${i === 0 ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {i === 0 ? 'In Progress' : 'Submitted'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-6">
            <p className="text-sm text-slate-500 mb-4">
              This is a preview of the live workforce board analytics dashboard
            </p>
            <Link
              href="/store/demo/admin"
              className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-lg transition-colors"
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
                    <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-bold text-slate-600">STEP {step.step}</span>
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
            This replaces <strong>compliance teams</strong>, <strong>reporting analysts</strong>, 
            and <strong>manual oversight</strong>. Governance without operational burden.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-800 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready for Enterprise Access?</h2>
          <p className="text-slate-300 mb-8">
            $8,500/month • Up to 10,000 learners • Unlimited programs • Multi-org governance
          </p>
          <Link
            href="/contact?subject=Enterprise%20License"
            className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-lg font-bold hover:bg-slate-100 transition-colors"
          >
            Request Enterprise Access
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-slate-400 text-sm mt-6">
            Enterprise licenses include dedicated onboarding and priority support.
          </p>
        </div>
      </section>
    </div>
  );
}
