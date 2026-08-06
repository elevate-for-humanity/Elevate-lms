export const dynamic = 'force-static';

import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { getAdminUrl } from '@/lib/config/admin-url';
import { 
  Code, Bot, Workflow, Database, Cloud, Terminal, 
  Sparkles, ArrowRight, Play, Check, Zap, GitBranch, 
  Container, Activity, Box, Settings, Layers
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dev Studio',
  description: 'AI-powered development environment with workflow automation, container management, and intelligent code assistance for technical teams.',
  keywords: ['dev studio', 'AI coding', 'workflow automation', 'container management', 'development tools'],
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/store/dev-studio',
  },
};

const features = [
  {
    icon: Bot,
    title: 'AI Co-Brain',
    desc: 'Intelligent code assistant that understands your codebase, suggests solutions, and writes code alongside you.',
    details: ['Context-aware suggestions', 'Code refactoring', 'Bug detection', 'Documentation generation'],
  },
  {
    icon: Workflow,
    title: 'Workflow Builder',
    desc: 'Visual drag-and-drop workflow automation. Connect APIs, trigger events, and build complex pipelines.',
    details: ['Visual editor', '200+ integrations', 'Conditional logic', 'Real-time logs'],
  },
  {
    icon: Container,
    title: 'Container Management',
    desc: 'Deploy and manage containers directly from your browser. Northflank, Docker, and Kubernetes support.',
    details: ['One-click deploys', 'Health monitoring', 'Log streaming', 'Auto-scaling'],
  },
  {
    icon: Database,
    title: 'Database Tools',
    desc: 'Schema visualization, migration management, and query builder. All your databases in one place.',
    details: ['Schema designer', 'Migration tracking', 'Query builder', 'Data export'],
  },
  {
    icon: Code,
    title: 'Code Editor',
    desc: 'Full-featured code editor with syntax highlighting, autocomplete, and real-time collaboration.',
    details: ['Multi-language support', 'Git integration', 'Live collaboration', 'Terminal access'],
  },
  {
    icon: Cloud,
    title: 'API Testing',
    desc: 'Build, test, and document APIs. Generate SDKs and mock servers automatically.',
    details: ['Request builder', 'Environment variables', 'Mock servers', 'OpenAPI export'],
  },
];

const workflowTemplates = [
  { name: 'Student Enrollment Pipeline', desc: 'Application → Documents → Payment → LMS Access', color: 'bg-emerald-100 text-emerald-700' },
  { name: 'Payment Processing', desc: 'Stripe Webhook → Validate → Update DB → Send Email', color: 'bg-blue-100 text-blue-700' },
  { name: 'Credential Issuance', desc: 'Completion → Verify → Generate → Email Certificate', color: 'bg-purple-100 text-purple-700' },
  { name: 'Employer Onboarding', desc: 'Invite → Collect Info → Create Account → Assign Training', color: 'bg-orange-100 text-orange-700' },
  { name: 'Grant Application', desc: 'Intake Form → Eligibility Check → Document Review → Approval', color: 'bg-pink-100 text-pink-700' },
  { name: 'WIOA Reporting', desc: 'Collect Data → Calculate Metrics → Generate PIRL → Submit', color: 'bg-indigo-100 text-indigo-700' },
];

export default function DevStudioPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Store", href: "/store" }, { label: "Dev Studio" }]} />
      </div>

      {/* Hero - Bright & Clean */}
      <section className="relative min-h-[70vh] flex items-end overflow-hidden bg-gradient-to-br from-cyan-600 via-teal-600 to-emerald-500">
        <div className="absolute inset-0 bg-[url('/images/patterns/grid.svg')] opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="grid grid-cols-4 gap-4 px-8">
            {['Agent', 'Workflow', 'Container', 'Deploy'].map((item) => (
              <div key={item} className="rounded-xl bg-white/20 backdrop-blur p-4 text-center">
                <p className="text-white font-bold text-sm">{item}</p>
                <p className="text-white/70 text-xs mt-1">Dev Studio</p>
              </div>
            ))}
          </div>
        </div>

        {/* White Content Box */}
        <div className="relative z-10 w-full bg-white">
          <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
            <div className="grid lg:grid-cols-2 gap-8 items-end">
              {/* Left - Content */}
              <div>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-bold mb-4">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  AI-Powered Development
                </span>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-4">
                  Dev Studio
                  <span className="block text-brand-red-600">
                    Build Faster with AI
                  </span>
                </h1>

                <p className="text-lg text-slate-600 mb-6 max-w-xl">
                  The complete AI-powered development environment. Write code, build workflows,
                  manage containers, and deploy—all with intelligent assistance.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <a href={getAdminUrl("/studio")}
                    className="inline-flex items-center justify-center gap-2 bg-brand-red-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-brand-red-700 transition-colors text-center"
                  >
                    Open Dev Studio
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="/store/dev-studio#demo"
                    className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-6 py-3 rounded-lg transition-colors text-center"
                  >
                    <Play className="w-5 h-5" />
                    Watch Demo
                  </Link>
                </div>
              </div>

              {/* Right - Terminal Mockup */}
              <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 border-b border-slate-700">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <span className="text-xs text-slate-400 ml-2">Dev Studio — AI Assistant</span>
                </div>
                <div className="p-4 font-mono text-sm">
                <div className="flex items-start gap-3 mb-4">
                  <Bot className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div className="text-slate-300">
                    <p className="mb-2">I see you're working on the enrollment flow. Want me to help with:</p>
                    <ul className="space-y-1 text-slate-400 ml-4">
                      <li>• Generate Stripe checkout integration</li>
                      <li>• Create email notification templates</li>
                      <li>• Add webhook error handling</li>
                    </ul>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-emerald-400 flex-shrink-0">$</span>
                  <div className="text-slate-300">
                    <p>Generate enrollment webhook handler</p>
                    <p className="text-slate-500">// Creates: handler, tests, docs</p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <p className="text-emerald-400">✓ Generated 3 files:</p>
                  <p className="text-slate-400 text-xs mt-1">lib/enrollment/webhook-handler.ts</p>
                  <p className="text-slate-400 text-xs">tests/webhook-handler.test.ts</p>
                  <p className="text-slate-400 text-xs">docs/webhook-handler.md</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Workflow Builder Demo */}
      <section id="demo" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Visual Workflow Builder</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Build complex automation pipelines with a drag-and-drop interface. No code required.
            </p>
          </div>
          
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
            {/* Workflow Canvas */}
            <div className="bg-white rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Workflow className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-slate-900">Student Enrollment Pipeline</span>
                </div>
                <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">Active</span>
              </div>
              
              {/* Workflow Nodes */}
              <div className="flex items-center justify-between gap-2 overflow-x-auto pb-4">
                {[
                  { icon: Box, label: 'Application', sub: 'Submitted', color: 'bg-blue-100 border-blue-300', iconColor: 'text-blue-600' },
                  { icon: Settings, label: 'Eligibility', sub: 'Check', color: 'bg-purple-100 border-purple-300', iconColor: 'text-purple-600' },
                  { icon: Database, label: 'Documents', sub: 'Upload', color: 'bg-orange-100 border-orange-300', iconColor: 'text-orange-600' },
                  { icon: Layers, label: 'Payment', sub: 'Process', color: 'bg-emerald-100 border-emerald-300', iconColor: 'text-emerald-600' },
                  { icon: Check, label: 'Enrolled', sub: 'Complete', color: 'bg-green-100 border-green-300', iconColor: 'text-green-600' },
                ].map((node, i) => (
                  <div key={node.label} className="flex items-center">
                    <div className={`w-28 p-3 ${node.color} border-2 rounded-xl text-center`}>
                      <node.icon className={`w-6 h-6 ${node.iconColor} mx-auto mb-1`} />
                      <p className="text-xs font-semibold text-slate-900">{node.label}</p>
                      <p className="text-[10px] text-slate-600">{node.sub}</p>
                    </div>
                    {i < 4 && (
                      <div className="w-8 flex-shrink-0">
                        <ArrowRight className="w-4 h-4 text-slate-400 mx-auto" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Metrics */}
              <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-200">
                {[
                  { label: 'Runs Today', value: '147', change: '+12%' },
                  { label: 'Success Rate', value: '99.2%', change: '▲ 0.3%' },
                  { label: 'Avg Time', value: '2m 34s', change: '▼ 8s' },
                  { label: 'Errors', value: '1', change: 'Resolved' },
                ].map(m => (
                  <div key={m.label} className="text-center">
                    <p className="text-xs text-slate-500">{m.label}</p>
                    <p className="text-lg font-bold text-slate-900">{m.value}</p>
                    <p className="text-xs text-emerald-600">{m.change}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Templates */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Ready-to-Use Templates</h3>
              <div className="grid md:grid-cols-3 gap-3">
                {workflowTemplates.map(t => (
                  <div key={t.name} className="bg-white p-4 rounded-lg border border-slate-200 hover:border-blue-300 cursor-pointer transition-colors">
                    <span className={`inline-block px-2 py-1 ${t.color} text-xs font-medium rounded mb-2`}>
                      {t.name}
                    </span>
                    <p className="text-xs text-slate-600">{t.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything You Need</h2>
            <p className="text-lg text-slate-600">A complete development environment in your browser</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-slate-600 mb-4">{f.desc}</p>
                  <ul className="space-y-1">
                    {f.details.map(d => (
                      <li key={d} className="flex items-center gap-2 text-sm text-slate-500">
                        <Check className="w-4 h-4 text-emerald-500" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Dev Studio Plans</h2>
            <p className="text-lg text-slate-600">Included with Professional and Enterprise plans</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-8 border-2 border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Professional</h3>
              <p className="text-slate-600 mb-4">For individual developers</p>
              <p className="text-4xl font-bold text-slate-900 mb-6">$29<span className="text-lg font-normal text-slate-500">/mo</span></p>
              <ul className="space-y-3 mb-6">
                {['AI Co-Brain', 'Workflow Builder', 'Code Editor', '5 Projects', 'Community Support'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-slate-700">
                    <Check className="w-5 h-5 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/store/checkout/dev-studio-pro" className="block text-center bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors">
                Get Started
              </Link>
            </div>
            
            <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-4 right-4 px-3 py-1 bg-purple-500 text-xs font-bold rounded-full">
                POPULAR
              </div>
              <h3 className="text-xl font-bold mb-2">Team</h3>
              <p className="text-slate-400 mb-4">For development teams</p>
              <p className="text-4xl font-bold mb-6">$79<span className="text-lg font-normal text-slate-400">/user</span></p>
              <ul className="space-y-3 mb-6">
                {['Everything in Professional', 'Unlimited Projects', 'Team Collaboration', 'Priority Support', 'Advanced Security'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-slate-300">
                    <Check className="w-5 h-5 text-emerald-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/store/checkout/dev-studio-team" className="block text-center bg-white text-slate-900 font-bold py-3 rounded-xl hover:bg-slate-100 transition-colors">
                Get Started
              </Link>
            </div>
          </div>
          
          <p className="text-center text-slate-500 mt-8">
            Dev Studio is also included with all Elevate Platform Professional and Enterprise licenses.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to code faster?</h2>
          <p className="text-slate-400 mb-8">
            Start with a free trial. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={getAdminUrl("/studio")} className="inline-flex items-center gap-2 bg-white text-slate-900 font-bold px-8 py-4 rounded-xl hover:bg-slate-100 transition-colors">
              Open Dev Studio Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/contact?subject=Dev+Studio+Demo" className="inline-flex items-center gap-2 border border-slate-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-slate-800 transition-colors">
              Schedule Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
