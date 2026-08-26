/**
 * PARIS AI Operating System - Product Page
 * 
 * Complete enterprise AI workforce platform product page
 * Includes: Hero, Features, How It Works, Integrations, Demo, CTA
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Brain, 
  Zap, 
  Users, 
  Shield, 
  BarChart3, 
  Clock,
  CheckCircle2,
  ArrowRight,
  Bot,
  MessageSquare,
  FileText,
  GraduationCap,
  Building2,
  Users2,
  Globe,
  Lightbulb,
  Target,
  TrendingUp,
  Award,
  ChevronRight,
  Play,
  Star,
  Sparkles,
  Cpu,
  Network,
  Workflow
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'PARIS AI | AI Workforce Operating System | Elevate',
  description: 'PARIS AI - Zero Obstacles, Ready Advisors. Deploy specialized AI agents for admissions, recruiting, compliance, grants, and workforce management. Enterprise-grade AI for workforce development.',
  keywords: ['AI workforce', 'AI agents', 'admissions AI', 'recruiting AI', 'compliance automation', 'workforce development AI', 'enterprise AI'],
  openGraph: {
    title: 'PARIS AI Operating System',
    description: 'Deploy specialized AI agents for workforce development. Admissions, recruiting, compliance, grants, and more.',
    type: 'website',
  },
};

// Feature data
const CORE_FEATURES = [
  {
    icon: Bot,
    title: '18 Specialized AI Agents',
    description: 'Pre-built agents for admissions, recruiting, compliance, grants, curriculum, marketing, and more. Each trained for specific workforce development tasks.',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: MessageSquare,
    title: 'Conversational Intelligence',
    description: 'Natural language interactions that guide students through applications, answer questions 24/7, and provide personalized career counseling.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Workflow,
    title: 'Automated Workflows',
    description: 'From lead to enrollment to placement, automate repetitive tasks while maintaining human oversight for critical decisions.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Shield,
    title: 'Compliance Guardrails',
    description: 'Built-in WIOA, VR, ETPL, and FERPA compliance. Every action is logged, auditable, and meets regulatory requirements.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Analytics',
    description: 'Track agent performance, student progress, enrollment funnels, and workforce outcomes with comprehensive dashboards.',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Clock,
    title: '24/7 Availability',
    description: 'AI agents work around the clock, answering questions, processing applications, and engaging prospects when your team cannot.',
    color: 'from-indigo-500 to-blue-600',
  },
];

// Agent lineup
const AI_AGENTS = [
  { name: 'Admissions Specialist', description: 'Guide applicants through enrollment', icon: GraduationCap },
  { name: 'Career Coach', description: 'Personalized career pathway advice', icon: Target },
  { name: 'Grant Writer', description: 'Automate grant research and drafting', icon: FileText },
  { name: 'Recruiter', description: 'Match employers with talent', icon: Building2 },
  { name: 'Compliance Officer', description: 'Ensure regulatory adherence', icon: Shield },
  { name: 'Marketing Manager', description: 'Optimize outreach campaigns', icon: TrendingUp },
  { name: 'Curriculum Developer', description: 'Generate course content', icon: BookOpen },
  { name: 'Financial Aid Advisor', description: 'Navigate funding options', icon: Award },
  { name: 'Testing Proctor', description: 'Manage exam scheduling', icon: CheckCircle2 },
  { name: 'Employer Relations', description: 'Maintain partnerships', icon: Users2 },
];

// Integration partners
const INTEGRATIONS = [
  { name: 'Stripe', description: 'Payment processing', icon: CreditCard },
  { name: 'Supabase', description: 'Database & auth', icon: Database },
  { name: 'Twilio', description: 'SMS & voice', icon: MessageSquare },
  { name: 'Adzuna', description: 'Job matching', icon: Briefcase },
  { name: 'RAPIDS/DOL', description: 'Apprenticeship tracking', icon: Government },
  { name: 'WorkOne', description: 'Workforce boards', icon: Building },
  { name: 'ACT WorkKeys', description: 'Testing center', icon: ClipboardCheck },
  { name: 'Certiport', description: 'Certification exams', icon: Award },
];

// Stats
const STATS = [
  { value: '18+', label: 'AI Agents', sublabel: 'Pre-configured' },
  { value: '24/7', label: 'Availability', sublabel: 'Always on' },
  { value: '85%', label: 'Task Automation', sublabel: 'Of routine work' },
  { value: '3x', label: 'Faster Enrollment', sublabel: 'vs manual process' },
];

// How it works steps
const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Deploy Agents',
    description: 'Select from 18 pre-built AI agents or customize your own. Each agent is optimized for workforce development tasks.',
    icon: Bot,
  },
  {
    step: 2,
    title: 'Configure Workflows',
    description: 'Define approval chains, escalation paths, and integration points. Set guardrails without limiting capability.',
    icon: Workflow,
  },
  {
    step: 3,
    title: 'Connect Data',
    description: 'Integrate with existing systems - LMS, CRM, payment processors, government databases, and employer networks.',
    icon: Network,
  },
  {
    step: 4,
    title: 'Monitor & Optimize',
    description: 'Track performance in real-time. Use analytics to identify bottlenecks and continuously improve outcomes.',
    icon: BarChart3,
  },
];

// Benefits
const BENEFITS = [
  {
    title: 'Reduce Administrative Burden',
    description: 'Free your staff from repetitive tasks. AI handles applications, eligibility checks, and communications while humans focus on relationship-building.',
    metric: '60% time saved',
  },
  {
    title: 'Accelerate Enrollment',
    description: '24/7 AI assistance means no more waiting for business hours. Prospects convert faster with instant responses.',
    metric: '3x faster enrollment',
  },
  {
    title: 'Improve Compliance',
    description: 'Every AI action is logged and auditable. Reduce compliance risk while maintaining thorough documentation.',
    metric: '100% audit trail',
  },
  {
    title: 'Scale Without Limits',
    description: 'Handle seasonal spikes without hiring. AI scales instantly to meet demand during enrollment periods.',
    metric: 'Infinite scale',
  },
];

// Testimonials
const TESTIMONIALS = [
  {
    quote: "PARIS reduced our inquiry response time from 24 hours to instant. Our enrollment increased 40% without adding staff.",
    author: "Sarah Mitchell",
    role: "Director of Admissions",
    organization: "Indianapolis Career Center",
    rating: 5,
  },
  {
    quote: "The compliance officer agent alone saved us 20 hours per week on documentation. It's like having an extra staff member who never makes mistakes.",
    author: "Marcus Johnson",
    role: "Program Director",
    organization: "Workforce Solutions Plus",
    rating: 5,
  },
];

// FAQ
const FAQS = [
  {
    question: 'How does PARIS AI differ from generic chatbots?',
    answer: 'PARIS agents are purpose-built for workforce development. They understand WIOA eligibility, apprenticeship requirements, credential pathways, and employer partnerships. Generic chatbots lack this domain expertise.',
  },
  {
    question: 'Can AI agents make decisions without human approval?',
    answer: 'Yes, configurable per agent. Routine tasks (scheduling, FAQ responses, application status) are fully automated. High-stakes decisions (enrollment approval, funding awards) require human sign-off.',
  },
  {
    question: 'How long does implementation take?',
    answer: 'Most organizations are live within 2-4 weeks. Pre-built agents and integrations accelerate deployment. Custom configurations may extend timelines.',
  },
  {
    question: 'Is our student data secure?',
    answer: 'Absolutely. Data is encrypted at rest and in transit. We maintain FERPA compliance, offer data residency options, and provide complete audit logs of all AI interactions.',
  },
  {
    question: 'Can we white-label PARIS for our organization?',
    answer: 'Yes. White-label licensing is available for organizations wanting to deploy PARIS under their own brand. Contact us for enterprise pricing.',
  },
];

// Icons for integrations
function CreditCard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function Database({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

function Briefcase({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function Government({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function Building({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M8 10h.01" />
      <path d="M16 10h.01" />
      <path d="M8 14h.01" />
      <path d="M16 14h.01" />
      <path d="M12 14h.01" />
      <path d="M12 18h.01" />
      <path d="M12 10h.01" />
    </svg>
  );
}

function ClipboardCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  );
}

function BookOpen({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

export default function ParisAIPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-slate-950 to-slate-950" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
        <div className="absolute top-20 left-10 w-72 h-72 bg-violet-500/20 rounded-full blur-[100px]" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Brain className="w-8 h-8 text-violet-500" />
              <span className="font-bold text-xl">PARIS AI</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-slate-300 hover:text-white transition-colors">Features</Link>
              <Link href="#agents" className="text-slate-300 hover:text-white transition-colors">AI Agents</Link>
              <Link href="#integrations" className="text-slate-300 hover:text-white transition-colors">Integrations</Link>
              <Link href="#pricing" className="text-slate-300 hover:text-white transition-colors">Pricing</Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/contact" className="text-slate-300 hover:text-white transition-colors hidden sm:block">
                Contact
              </Link>
              <Link 
                href="/demo"
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white px-5 py-2 rounded-lg font-medium transition-all"
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-8">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-violet-300">Zero Obstacles, Ready Advisors</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-violet-200 to-white bg-clip-text text-transparent">
                PARIS AI
              </span>
              <br />
              <span className="text-4xl md:text-5xl text-slate-300">
                Workforce Operating System
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-slate-400 mb-8 max-w-3xl mx-auto leading-relaxed">
              Deploy specialized AI agents for workforce development. From admissions to placement, 
              automate complex workflows while maintaining human oversight for decisions that matter.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link 
                href="/demo"
                className="group flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-violet-50 transition-all"
              >
                Schedule Demo
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/contact"
                className="flex items-center gap-2 border border-white/20 px-8 py-4 rounded-xl font-medium text-lg hover:bg-white/5 transition-all"
              >
                <Play className="w-5 h-5" />
                Watch Video
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent mb-1">
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

      {/* Agent Visual */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 border-y border-white/5 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Meet Your AI Workforce
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              18 specialized agents, each trained for specific workforce development tasks
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {AI_AGENTS.map((agent) => (
              <div 
                key={agent.name}
                className="group bg-slate-800/50 border border-white/10 rounded-xl p-4 hover:border-violet-500/50 hover:bg-slate-800 transition-all"
              >
                <agent.icon className="w-8 h-8 text-violet-400 mb-3" />
                <h3 className="font-semibold text-white mb-1">{agent.name}</h3>
                <p className="text-sm text-slate-400">{agent.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Enterprise-Grade AI Capabilities
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Built for workforce development from the ground up. Not a generic chatbot 
              with a workforce skin — purpose-built for your unique challenges.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {CORE_FEATURES.map((feature) => (
              <div 
                key={feature.title}
                className="group relative bg-slate-900/50 border border-white/10 rounded-2xl p-8 hover:border-violet-500/30 transition-all duration-300"
              >
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity`} />
                
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

      {/* How It Works */}
      <section className="relative z-10 py-32 px-4 sm:px-6 lg:px-8 bg-slate-900/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              How It Works
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              From deployment to optimization in weeks, not months
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step, index) => (
              <div key={step.step} className="relative">
                {/* Connector line */}
                {index < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-violet-500/50 to-transparent" />
                )}
                
                <div className="relative bg-slate-800/50 border border-white/10 rounded-2xl p-8 h-full">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-violet-500/20 text-violet-400 font-bold text-xl mb-6">
                    {step.step}
                  </div>
                  
                  <step.icon className="w-10 h-10 text-violet-400 mb-4" />
                  
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-slate-400">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="relative z-10 py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Measurable Impact
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Real results from organizations already using PARIS AI
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {BENEFITS.map((benefit) => (
              <div 
                key={benefit.title}
                className="bg-slate-900/50 border border-white/10 rounded-2xl p-8"
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
      <section id="integrations" className="relative z-10 py-32 px-4 sm:px-6 lg:px-8 bg-slate-900/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Seamless Integrations
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Connect with the tools you already use. Workforce ecosystem integrations built-in.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {INTEGRATIONS.map((integration) => (
              <div 
                key={integration.name}
                className="bg-slate-800/50 border border-white/10 rounded-xl p-6 text-center hover:border-violet-500/30 transition-all"
              >
                <div className="inline-flex p-3 rounded-lg bg-slate-700/50 mb-4">
                  <integration.icon className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="font-semibold text-white mb-1">{integration.name}</h3>
                <p className="text-sm text-slate-400">{integration.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              What Our Partners Say
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {TESTIMONIALS.map((testimonial) => (
              <div 
                key={testimonial.author}
                className="bg-slate-900/50 border border-white/10 rounded-2xl p-8"
              >
                {/* Stars */}
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
                  <div className="text-sm text-violet-400">{testimonial.organization}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 py-32 px-4 sm:px-6 lg:px-8 bg-slate-900/50 border-y border-white/5">
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-8">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-sm text-violet-300">Ready to transform your workforce operations?</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Deploy PARIS AI Today
          </h2>
          
          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
            Join organizations already using AI to accelerate workforce development. 
            Start your free trial or schedule a personalized demo.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/demo"
              className="group flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-violet-50 transition-all"
            >
              Schedule Demo
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/contact"
              className="flex items-center gap-2 border border-white/20 px-8 py-4 rounded-xl font-medium text-lg hover:bg-white/5 transition-all"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-violet-500" />
              <span className="font-bold">PARIS AI</span>
              <span className="text-slate-500">by Elevate for Humanity</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/security" className="hover:text-white transition-colors">Security</Link>
              <Link href="/help" className="hover:text-white transition-colors">Documentation</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
