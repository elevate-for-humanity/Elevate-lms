/**
 * Dev Studio - Product Page
 * 
 * AI-Powered Development Environment for Elevate Platform
 * Complete product page with hero, features, integrations, demo
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { getAdminUrl } from '@/lib/config/admin-url';
import {
  Code2,
  Terminal,
  Zap,
  GitBranch,
  Box,
  Database,
  Monitor,
  Layers,
  Rocket,
  Shield,
  Clock,
  Users,
  FileCode,
  Container,
  Cloud,
  Terminal as TerminalIcon,
  Play,
  ArrowRight,
  Star,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Brain,
  Bug,
  RefreshCw,
  GitMerge,
  Box as BoxIcon,
  Server,
  Gauge,
  Lock,
  Layers as LayersIcon
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dev Studio | AI-Powered Development Environment | Elevate',
  description: 'Dev Studio - Build, deploy, and manage workforce applications with AI assistance. Integrated development environment with container management, GitHub integration, and real-time monitoring.',
  keywords: ['development environment', 'AI coding', 'container management', 'GitHub integration', 'deployment automation', 'DevOps'],
  openGraph: {
    title: 'Dev Studio',
    description: 'AI-powered development environment for workforce applications',
    type: 'website',
  },
};

// Features
const CORE_FEATURES = [
  {
    icon: Brain,
    title: 'AI Code Assistance',
    description: 'Integrated AI coding assistant understands your codebase, suggests improvements, and helps you build faster.',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: Container,
    title: 'Container Management',
    description: 'Deploy and manage containers directly from the IDE. Northflank integration for production deployments.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: GitMerge,
    title: 'GitHub Integration',
    description: 'Seamless GitHub workflows. Clone repos, manage branches, review PRs, and deploy from anywhere.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Monitor,
    title: 'Real-Time Monitoring',
    description: 'Live performance metrics, container health, deployment status, and error tracking in one view.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: Database,
    title: 'Database Explorer',
    description: 'Browse, query, and manage Supabase databases. Visual schema editor and query builder included.',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Rocket,
    title: 'One-Click Deploy',
    description: 'Deploy to staging or production with a single click. Automatic rollbacks on failure.',
    color: 'from-indigo-500 to-blue-600',
  },
];

// Capabilities
const CAPABILITIES = [
  { name: 'Code Editor', description: 'VS Code-inspired editor with syntax highlighting' },
  { name: 'Terminal', description: 'Integrated terminal with full shell access' },
  { name: 'File Explorer', description: 'Browse and manage project files' },
  { name: 'Git Panel', description: 'Visual Git management and history' },
  { name: 'Preview', description: 'Live preview for web applications' },
  { name: 'Debug Console', description: 'Integrated debugging tools' },
  { name: 'API Explorer', description: 'Test and debug API endpoints' },
  { name: 'Logs Viewer', description: 'Real-time application logs' },
];

// Integrations
const INTEGRATIONS = [
  { name: 'GitHub', description: 'Repository management & CI/CD' },
  { name: 'Northflank', description: 'Container deployment' },
  { name: 'Supabase', description: 'Database & auth' },
  { name: 'Vercel', description: 'Frontend hosting' },
  { name: 'Cloudflare', description: 'Edge functions & CDN' },
  { name: 'GitHub Actions', description: 'CI/CD pipelines' },
];

// Stats
const STATS = [
  { value: '50+', label: 'Languages', sublabel: 'Supported' },
  { value: '10x', label: 'Faster Dev', sublabel: 'With AI assistance' },
  { value: '100%', label: 'Integrated', sublabel: 'No context switching' },
  { value: '24/7', label: 'Monitoring', sublabel: 'Always available' },
];

// How it works
const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Connect Your Repo',
    description: 'Link your GitHub repository or start from a template. Dev Studio indexes your entire codebase.',
    icon: GitBranch,
  },
  {
    step: 2,
    title: 'Build with AI',
    description: 'Let AI assistants help write code, explain functions, and suggest improvements as you work.',
    icon: Sparkles,
  },
  {
    step: 3,
    title: 'Test & Debug',
    description: 'Built-in testing tools, debugging, and live preview let you catch issues before deployment.',
    icon: Bug,
  },
  {
    step: 4,
    title: 'Deploy Instantly',
    description: 'Push to deploy. Containers spin up automatically. Monitor health in real-time.',
    icon: Rocket,
  },
];

// Benefits
const BENEFITS = [
  {
    title: 'No Context Switching',
    description: 'Everything you need in one place. Code, terminal, database, deployment, monitoring — no tab switching.',
    metric: '40% more productive',
  },
  {
    title: 'AI-Powered Development',
    description: 'AI understands your codebase, not just generic patterns. Context-aware suggestions that actually help.',
    metric: '10x faster coding',
  },
  {
    title: 'Instant Deployments',
    description: 'From code to production in seconds. Container orchestration handled automatically.',
    metric: 'Zero-downtime deploys',
  },
  {
    title: 'Enterprise Security',
    description: 'SOC 2 compliant infrastructure. RBAC, audit logs, and encrypted data at rest and in transit.',
    metric: 'SOC 2 Certified',
  },
];

// Testimonials
const TESTIMONIALS = [
  {
    quote: "Dev Studio cut our deployment time from hours to minutes. The AI suggestions are surprisingly good.",
    author: "James Wilson",
    role: "Lead Developer",
    organization: "TechEd Solutions",
    rating: 5,
  },
  {
    quote: "Finally, an IDE that understands workforce applications. The database explorer alone saves me hours.",
    author: "Maria Santos",
    role: "Backend Engineer",
    organization: "CareerConnect Inc",
    rating: 5,
  },
];

// FAQ
const FAQS = [
  {
    question: 'What programming languages does Dev Studio support?',
    answer: 'Dev Studio supports 50+ languages including JavaScript, TypeScript, Python, Go, Rust, Java, and more. Language servers provide intelligent code completion and error checking.',
  },
  {
    question: 'How does the AI code assistance work?',
    answer: 'AI models are fine-tuned on workforce development codebases. They understand your code context, not just generic patterns. Suggestions improve as you work in your specific codebase.',
  },
  {
    question: 'Can I use my own IDE and still deploy through Dev Studio?',
    answer: 'Yes. Dev Studio offers standalone deployment features that work with any IDE. You can also sync files from VS Code, JetBrains, or other editors.',
  },
  {
    question: 'What container platforms are supported?',
    answer: 'Dev Studio integrates with Northflank for container management. You can also connect to any Kubernetes cluster or Docker-compatible platform.',
  },
  {
    question: 'Is there a local development option?',
    answer: 'Yes. Dev Studio can run locally via Docker or connect to remote development containers. Your choice of local or cloud-based development.',
  },
];

export default function DevStudioPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-900/20 via-slate-950 to-slate-950" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/20 rounded-full blur-[100px]" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-amber-500/20 rounded-full blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <TerminalIcon className="w-8 h-8 text-orange-500" />
              <span className="font-bold text-xl">Dev Studio</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-slate-300 hover:text-white transition-colors">Features</Link>
              <Link href="#capabilities" className="text-slate-300 hover:text-white transition-colors">Capabilities</Link>
              <Link href="#integrations" className="text-slate-300 hover:text-white transition-colors">Integrations</Link>
              <Link href="#pricing" className="text-slate-300 hover:text-white transition-colors">Pricing</Link>
            </div>
            <div className="flex items-center gap-4">
              <a href={getAdminUrl("/studio")} className="text-slate-300 hover:text-white transition-colors hidden sm:block">
                Open Studio
              </a>
              <Link 
                href="/demo"
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white px-5 py-2 rounded-lg font-medium transition-all"
              >
                Request Demo
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-8">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-orange-300">AI-Powered Development Environment</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-orange-200 to-white bg-clip-text text-transparent">
                Dev Studio
              </span>
              <br />
              <span className="text-4xl md:text-5xl text-slate-300">
                Build Faster with AI
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-slate-400 mb-8 max-w-3xl mx-auto leading-relaxed">
              The complete development environment for workforce applications. 
              Code, deploy, and manage with AI assistance built in.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link 
                href="/demo"
                className="group flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-orange-50 transition-all"
              >
                Start Building Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href={getAdminUrl("/studio")}
                className="flex items-center gap-2 border border-white/20 px-8 py-4 rounded-xl font-medium text-lg hover:bg-white/5 transition-all"
              >
                <Play className="w-5 h-5" />
                View Live Demo
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent mb-1">
                    {stat.value}
                  </div>
                  <div className="text-lg font-medium text-white">{stat.label}</div>
                  <div className="text-sm text-slate-500">{stat.sublabel}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* IDE Preview Mockup */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 border-y border-white/5 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="bg-slate-800 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            {/* Title bar */}
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 border-b border-white/10">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="flex-1 text-center text-sm text-slate-400">
                elevate-lms/app/page.tsx — Dev Studio
              </div>
            </div>
            {/* Editor content */}
            <div className="flex h-[400px]">
              {/* Sidebar */}
              <div className="w-12 bg-slate-900 border-r border-white/10 flex flex-col items-center py-4 gap-4">
                <FileCode className="w-5 h-5 text-orange-400" />
                <GitBranch className="w-5 h-5 text-slate-500" />
                <Search className="w-5 h-5 text-slate-500" />
                <BoxIcon className="w-5 h-5 text-slate-500" />
                <Database className="w-5 h-5 text-slate-500" />
                <Gauge className="w-5 h-5 text-slate-500" />
              </div>
              {/* File tree */}
              <div className="w-56 bg-slate-900/50 border-r border-white/10 p-4 text-sm">
                <div className="text-slate-500 mb-2">EXPLORER</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-300"><FileCode className="w-4 h-4" /> app</div>
                  <div className="flex items-center gap-2 text-slate-400 pl-4"><FileCode className="w-4 h-4" /> page.tsx</div>
                  <div className="flex items-center gap-2 text-slate-400 pl-4"><FileCode className="w-4 h-4" /> layout.tsx</div>
                  <div className="flex items-center gap-2 text-slate-300 pl-4"><Folder className="w-4 h-4" /> components</div>
                  <div className="flex items-center gap-2 text-slate-300"><FileCode className="w-4 h-4" /> lib</div>
                  <div className="flex items-center gap-2 text-slate-300"><TerminalIcon className="w-4 h-4" /> package.json</div>
                </div>
              </div>
              {/* Code area */}
              <div className="flex-1 p-4 font-mono text-sm overflow-auto">
                <div className="text-slate-500">1</div>
                <div><span className="text-purple-400">import</span> <span className="text-slate-300">{'{ Metadata }'}</span> <span className="text-purple-400">from</span> <span className="text-green-400">'next'</span>;</div>
                <div><span className="text-purple-400">import</span> <span className="text-slate-300">{'{ AIAssistant }'}</span> <span className="text-purple-400">from</span> <span className="text-green-400">'@dev-studio/ai'</span>;</div>
                <div className="text-slate-700">// AI: This component looks great! Consider adding</div>
                <div className="text-slate-700">// error boundaries for production resilience.</div>
                <div className="text-slate-500">5</div>
                <div><span className="text-purple-400">export default function</span> <span className="text-yellow-400">HomePage</span>() {'{'}</div>
                <div className="pl-4"><span className="text-purple-400">return</span> {'('}</div>
                <div className="pl-8"><span className="text-yellow-400">{'<AIAssistant'}</span> <span className="text-cyan-400">context</span>=<span className="text-green-400">"homepage"</span> {'/>'}</div>
                <div className="pl-8"><span className="text-yellow-400">{'<Hero'}</span> <span className="text-cyan-400">title</span>=<span className="text-green-400">"Build Faster"</span> {'/>'}</div>
                <div className="pl-4">);</div>
                <div>{'}'}</div>
              </div>
              {/* AI Panel */}
              <div className="w-72 bg-slate-900/80 border-l border-white/10 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-orange-400" />
                  <span className="text-sm font-semibold text-orange-400">AI Assistant</span>
                </div>
                <div className="text-sm text-slate-300 mb-4">
                  I can see you&apos;re building a homepage component. I&apos;ve analyzed your codebase and have some suggestions:
                </div>
                <div className="space-y-2">
                  <div className="bg-slate-800 rounded p-3 text-sm">
                    <div className="text-orange-400 mb-1">Performance</div>
                    <div className="text-slate-400">Add dynamic imports for below-fold content</div>
                  </div>
                  <div className="bg-slate-800 rounded p-3 text-sm">
                    <div className="text-green-400 mb-1">SEO</div>
                    <div className="text-slate-400">Consider adding structured data</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Enterprise Development Tools
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Everything you need to build workforce applications. 
              Not just an editor — a complete development platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {CORE_FEATURES.map((feature) => (
              <div 
                key={feature.title}
                className="group relative bg-slate-900/50 border border-white/10 rounded-2xl p-8 hover:border-orange-500/30 transition-all duration-300"
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-6`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section id="capabilities" className="relative z-10 py-32 px-4 sm:px-6 lg:px-8 bg-slate-900/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Complete IDE Capabilities
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Full-featured development environment with everything you expect
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CAPABILITIES.map((cap) => (
              <div 
                key={cap.name}
                className="bg-slate-800/50 border border-white/10 rounded-xl p-6 hover:border-orange-500/30 transition-all"
              >
                <h3 className="font-semibold text-white mb-2">{cap.name}</h3>
                <p className="text-sm text-slate-400">{cap.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              From Code to Production
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Streamlined workflow from development to deployment
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step, index) => (
              <div key={step.step} className="relative">
                {index < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-orange-500/50 to-transparent" />
                )}
                <div className="relative bg-slate-800/50 border border-white/10 rounded-2xl p-8 h-full">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-500/20 text-orange-400 font-bold text-xl mb-6">
                    {step.step}
                  </div>
                  <step.icon className="w-10 h-10 text-orange-400 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-slate-400">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="relative z-10 py-32 px-4 sm:px-6 lg:px-8 bg-slate-900/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Why Dev Studio?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {BENEFITS.map((benefit) => (
              <div 
                key={benefit.title}
                className="bg-slate-800/50 border border-white/10 rounded-2xl p-8"
              >
                <div className="flex items-start justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white">{benefit.title}</h3>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium">
                    {benefit.metric}
                  </span>
                </div>
                <p className="text-slate-400 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section id="integrations" className="relative z-10 py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Integrations
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Connect with the tools you already use
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {INTEGRATIONS.map((integration) => (
              <div 
                key={integration.name}
                className="bg-slate-800/50 border border-white/10 rounded-xl p-6 text-center hover:border-orange-500/30 transition-all"
              >
                <div className="font-semibold text-white mb-1">{integration.name}</div>
                <p className="text-sm text-slate-400">{integration.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 py-32 px-4 sm:px-6 lg:px-8 bg-slate-900/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              What Developers Say
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {TESTIMONIALS.map((testimonial) => (
              <div 
                key={testimonial.author}
                className="bg-slate-800/50 border border-white/10 rounded-2xl p-8"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <blockquote className="text-xl text-slate-300 mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>
                <div>
                  <div className="font-semibold text-white">{testimonial.author}</div>
                  <div className="text-slate-400">{testimonial.role}</div>
                  <div className="text-sm text-orange-400">{testimonial.organization}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            {FAQS.map((faq, index) => (
              <div 
                key={index}
                className="bg-slate-800/50 border border-white/10 rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-3">{faq.question}</h3>
                <p className="text-slate-400 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-8">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-orange-300">Ready to transform your development workflow?</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Start Building Today
          </h2>
          
          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
            Join thousands of developers building workforce applications faster with AI-powered Dev Studio.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/demo"
              className="group flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-orange-50 transition-all"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href={getAdminUrl("/studio")}
              className="flex items-center gap-2 border border-white/20 px-8 py-4 rounded-xl font-medium text-lg hover:bg-white/5 transition-all"
            >
              Open Dev Studio
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <TerminalIcon className="w-6 h-6 text-orange-500" />
              <span className="font-bold">Dev Studio</span>
              <span className="text-slate-500">by Elevate for Humanity</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/security" className="hover:text-white transition-colors">Security</Link>
              <Link href="/docs/dev-studio" className="hover:text-white transition-colors">Documentation</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Additional icons needed
function Search({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function Folder({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    </svg>
  );
}
