export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, Play, LayoutGrid, Users, FileBarChart, Eye, Award, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Institutional Operator Demo',
  description: 'See how institutions operate multiple programs while maintaining clean, auditable records.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/store/demo/institutional',
  },
};

const demoSteps = [
  {
    step: 1,
    title: 'Program Manager View',
    description: 'Multiple programs listed with different funding paths per program.',
    icon: LayoutGrid,
    detail: 'See all active programs at a glance. Each program has its own funding configuration, eligibility rules, and credential types.',
  },
  {
    step: 2,
    title: 'Roster & Progress',
    description: 'Multiple cohorts with attendance and progress views.',
    icon: Users,
    detail: 'Track learners across cohorts. Attendance logged automatically. Progress percentages updated in real-time.',
  },
  {
    step: 3,
    title: 'Compliance Dashboard',
    description: 'Report filters by funding source, dates, and program.',
    icon: FileBarChart,
    detail: 'Generate compliance reports without manual data entry. Filter by WIOA, WRG, JRI, or self-pay. Export for audits.',
  },
  {
    step: 4,
    title: 'Partner Visibility',
    description: 'Employer and partner read-only access to relevant data.',
    icon: Eye,
    detail: 'Partners see only what they need. No full admin access required. Controlled visibility maintains data integrity.',
  },
  {
    step: 5,
    title: 'Credential Management',
    description: 'Rules per credential type with automated issuance.',
    icon: Award,
    detail: 'Different credentials for different programs. Completion requirements enforced automatically. Verification links generated.',
  },
];

export default function InstitutionalDemoPage() {
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
            <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">INSTITUTIONAL LICENSE</span>
            <span className="text-slate-400">$2,500/month</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-black mb-4">
            Operate Multiple Programs With Audit-Ready Records
          </h1>
          <p className="text-xl text-slate-300 mb-6">
            This demo shows how institutions manage multiple programs while maintaining clean, oversight-ready records. 
            Reporting views are generated from live enrollment and attendance data — not manual entry.
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

      {/* Demo Video Placeholder */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="aspect-video bg-slate-900 rounded-2xl flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-slate-900/80" />
            <div className="relative text-center">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-white/20 transition-colors">
                <Play className="w-8 h-8 text-white ml-1" />
              </div>
              <p className="text-white font-semibold">Watch Institutional Operator Demo</p>
              <p className="text-slate-400 text-sm mt-1">8–10 minutes</p>
            </div>
          </div>
          <p className="text-center text-sm text-slate-500 mt-4">
            This demo reflects the live production system.
          </p>
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
            and <strong>internal reporting prep</strong>. Reports generate from live data, not manual assembly.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Activate Institutional License?</h2>
          <p className="text-blue-100 mb-8">
            $2,500/month • Up to 1,000 learners • Up to 25 programs • Cancel anytime
          </p>
          <Link
            href="/store/checkout?license=institutional"
            className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-lg font-bold hover:bg-blue-50 transition-colors"
          >
            Activate Institutional License
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
