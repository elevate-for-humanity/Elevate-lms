export const dynamic = 'force-static';

import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Workflow, ArrowRight, Play, CheckCircle, Zap, Users, Database, Bell, FileText, Settings } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Workflow Studio',
  description: 'Visual drag-and-drop workflow automation. Build enrollment pipelines, compliance workflows, and business processes without code.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/store/workflow-studio',
  },
};

const triggers = [
  { name: 'Form Submission', desc: 'When application submitted' },
  { name: 'Payment Received', desc: 'When Stripe payment clears' },
  { name: 'Document Uploaded', desc: 'When student uploads docs' },
  { name: 'Schedule Event', desc: 'Time-based triggers' },
  { name: 'Email Received', desc: 'Inbound email triggers' },
  { name: 'Webhook', desc: 'External system triggers' },
];

const actions = [
  { name: 'Send Email', desc: 'Automated email sending' },
  { name: 'Create Record', desc: 'Database record creation' },
  { name: 'Update Status', desc: 'Record status changes' },
  { name: 'Notify Team', desc: 'Slack/Teams alerts' },
  { name: 'Generate Document', desc: 'PDF/doc creation' },
  { name: 'API Call', desc: 'External system integration' },
];

const templates = [
  { name: 'Student Enrollment', flows: 147, success: '99.2%' },
  { name: 'Payment Processing', flows: 89, success: '99.8%' },
  { name: 'Credential Issuance', flows: 234, success: '100%' },
  { name: 'Compliance Alerts', flows: 56, success: '98.5%' },
];

export default function WorkflowStudioPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Store", href: "/store" }, { label: "Workflow Studio" }]} />
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="/images/pages/admin-automation-qa-hero.webp" 
            alt="Workflow Automation" 
            fill 
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-orange-900/95 via-orange-900/80 to-orange-900/60" />
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-full text-sm font-bold mb-6 backdrop-blur-sm">
                <Workflow className="w-4 h-4" />
                Workflow Studio
              </div>
              
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
                Automate Any <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-yellow-300">Business Process</span>
              </h1>
              
              <p className="text-xl text-slate-200 mb-8">
                Visual drag-and-drop workflow builder. Create enrollment pipelines, compliance workflows, 
                and automate repetitive tasks without writing code.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/admin/workflows" className="inline-flex items-center justify-center gap-2 bg-brand-red-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-brand-red-700 transition-all hover:-translate-y-0.5">
                  Open Workflow Studio
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="#templates" className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white font-bold px-8 py-4 rounded-xl border border-white/20 hover:bg-white/20 transition-all">
                  <Play className="w-5 h-5" />
                  View Templates
                </Link>
              </div>
            </div>
            
            {/* Workflow Builder Preview */}
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-slate-800 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <span className="text-xs text-slate-400 ml-2">Workflow Builder</span>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold text-slate-900">Student Enrollment Pipeline</span>
                  <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded">Active</span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {[
                    { label: 'Application', color: 'bg-blue-100' },
                    { label: 'Validate', color: 'bg-purple-100' },
                    { label: 'Alert', color: 'bg-yellow-100' },
                    { label: 'Enroll', color: 'bg-emerald-100' },
                    { label: 'Setup', color: 'bg-slate-100' },
                  ].map((node, i) => (
                    <div key={node.label} className="flex items-center">
                      <div className={`w-20 p-2 ${node.color} rounded-lg text-center`}>
                        <p className="text-xs font-medium text-slate-700">{node.label}</p>
                      </div>
                      {i < 4 && <ArrowRight className="w-4 h-4 text-slate-400 mx-1" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Build in Minutes</h2>
            <p className="text-lg text-slate-600">Three steps to automation</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: 1, icon: Zap, title: 'Choose Trigger', desc: 'Start with a form submission, payment, schedule, or webhook' },
              { step: 2, icon: Workflow, title: 'Add Steps', desc: 'Drag conditions, actions, and integrations into your flow' },
              { step: 3, icon: CheckCircle, title: 'Activate', desc: 'Turn on and monitor with real-time logs and analytics' },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-orange-600" />
                </div>
                <span className="text-sm font-bold text-orange-600">Step {item.step}</span>
                <h3 className="text-xl font-bold text-slate-900 mt-2 mb-3">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Triggers & Actions */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Triggers</h3>
              <div className="space-y-3">
                {triggers.map(t => (
                  <div key={t.name} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Zap className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{t.name}</p>
                      <p className="text-sm text-slate-500">{t.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Actions</h3>
              <div className="space-y-3">
                {actions.map(a => (
                  <div key={a.name} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{a.name}</p>
                      <p className="text-sm text-slate-500">{a.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Templates */}
      <section id="templates" className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready-to-Use Templates</h2>
            <p className="text-lg text-slate-600">Start with proven workflows</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {templates.map(t => (
              <div key={t.name} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
                <Workflow className="w-8 h-8 text-orange-600 mb-4" />
                <h3 className="font-bold text-slate-900 mb-2">{t.name}</h3>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {t.flows} flows
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    {t.success}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <Workflow className="w-12 h-12 text-orange-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Ready to automate?</h2>
          <p className="text-xl text-slate-300 mb-8">
            Start with pre-built templates or build your own workflow from scratch.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/admin/workflows" className="inline-flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-xl transition-all hover:-translate-y-0.5">
              Open Workflow Studio
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/store/trial" className="inline-flex items-center justify-center gap-2 border border-slate-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-slate-800 transition-all">
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
