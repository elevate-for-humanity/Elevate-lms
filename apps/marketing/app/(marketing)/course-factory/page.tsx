/**
 * Course Factory - Product Page
 * 
 * AI-Powered Course Generation Platform
 * Complete product page with hero, features, demo
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { 
  GraduationCap,
  Sparkles,
  BookOpen,
  Award,
  Video,
  Brain,
  FileText,
  CheckCircle2,
  Clock,
  Users,
  TrendingUp,
  Play,
  ArrowRight,
  Star,
  ChevronRight,
  Layers,
  Zap,
  Target,
  BarChart3,
  Globe,
  Shield,
  RefreshCw,
  Palette,
  Mic,
  Presentation,
  FileCheck,
  GraduationCap as GradIcon,
  Book,
  Award as AwardIcon
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Course Factory | AI-Powered Course Generation | Elevate',
  description: 'Course Factory - Generate complete workforce training courses in hours, not months. AI-powered curriculum development with credential intelligence, video generation, and automated publishing.',
  keywords: ['course generation', 'AI curriculum', 'workforce training', 'credentialing', 'video courses', 'e-learning'],
  openGraph: {
    title: 'Course Factory',
    description: 'AI-powered course generation for workforce development',
    type: 'website',
  },
};

// Features
const CORE_FEATURES = [
  {
    icon: Brain,
    title: 'AI Curriculum Design',
    description: 'Intelligent course structure based on competency frameworks, learning objectives, and industry standards.',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: Video,
    title: 'AI Video Generation',
    description: 'Generate professional course videos with AI avatars, voiceovers, and dynamic content.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: FileText,
    title: 'Assessment Builder',
    description: 'Create quizzes, exams, and competency assessments aligned with certification requirements.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Award,
    title: 'Credential Intelligence',
    description: 'Map courses to industry credentials. EPA 608, OSHA 30, NHA certifications, and more.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: BookOpen,
    title: 'Interactive Content',
    description: 'Build engaging lessons with simulations, flashcards, practice exams, and hands-on labs.',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Zap,
    title: 'Fast Generation',
    description: 'Generate complete courses in hours, not months. From outline to published in days.',
    color: 'from-indigo-500 to-blue-600',
  },
];

// Content types
const CONTENT_TYPES = [
  { name: 'Video Lessons', icon: Video, count: 'AI-generated with avatars' },
  { name: 'Presentations', icon: Presentation, count: 'Interactive slideshows' },
  { name: 'Workbooks', icon: Book, count: 'Fillable exercises' },
  { name: 'Quizzes', icon: FileCheck, count: 'Adaptive assessments' },
  { name: 'Flashcards', icon: Brain, count: 'Spaced repetition' },
  { name: 'Simulations', icon: Target, count: 'Hands-on practice' },
];

// Credentials supported
const CREDENTIALS = [
  { name: 'EPA 608', description: 'HVAC Refrigerant Handling' },
  { name: 'OSHA 30', description: 'Construction Safety' },
  { name: 'NHA CCMA', description: 'Medical Assistant' },
  { name: 'CareerSafe', description: 'OSHA Outreach' },
  { name: 'ServSafe', description: 'Food Safety' },
  { name: 'CPR/AED', description: 'First Aid/CPR' },
  { name: ' CDL', description: 'Commercial Driver' },
  { name: 'Barber', description: 'State Licensing' },
];

// Stats
const STATS = [
  { value: '30+', label: 'Credentials', sublabel: 'Pre-configured' },
  { value: '100+', label: 'Courses', sublabel: 'Generated' },
  { value: '10x', label: 'Faster', sublabel: 'vs manual' },
  { value: '50%', label: 'Cost Savings', sublabel: 'Per course' },
];

// How it works
const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Select Credential',
    description: 'Choose from 30+ pre-built credentials or define your own. AI understands the requirements.',
    icon: Award,
  },
  {
    step: 2,
    title: 'Configure Blueprint',
    description: 'Set learning objectives, competency mappings, and content preferences.',
    icon: Layers,
  },
  {
    step: 3,
    title: 'AI Generates Content',
    description: 'Watch as AI creates lessons, videos, assessments, and supporting materials.',
    icon: Sparkles,
  },
  {
    step: 4,
    title: 'Review & Publish',
    description: 'Quality check with AI insights, then publish directly to your LMS.',
    icon: Rocket,
  },
];

// Benefits
const BENEFITS = [
  {
    title: 'Massively Reduce Development Time',
    description: 'What took 6 months now takes 2 weeks. AI handles the heavy lifting while subject matter experts review and refine.',
    metric: '10x faster',
  },
  {
    title: 'Consistent Quality',
    description: 'Every course meets your standards. AI ensures consistency across instructors and programs.',
    metric: 'Standardized quality',
  },
  {
    title: 'Credential-Aligned',
    description: 'Built-in alignment to certifications means students are always preparing for what matters.',
    metric: 'Certification-ready',
  },
  {
    title: 'Continuous Updates',
    description: 'AI keeps content current as regulations and standards evolve. No more outdated materials.',
    metric: 'Always current',
  },
];

// Testimonials
const TESTIMONIALS = [
  {
    quote: "We went from 2 courses per year to 12. The quality is indistinguishable from our manual development.",
    author: "Dr. Patricia Williams",
    role: "Curriculum Director",
    organization: "Workforce Academy",
    rating: 5,
  },
  {
    quote: "The EPA 608 course generation alone saved us $80,000 in development costs. Incredible ROI.",
    author: "Robert Chen",
    role: "Executive Director",
    organization: "Trade School Network",
    rating: 5,
  },
];

// FAQ
const FAQS = [
  {
    question: 'How long does it take to generate a course?',
    answer: 'A complete course with videos, assessments, and supporting materials can be generated in 2-4 weeks. Simple courses can be ready in days.',
  },
  {
    question: 'Can I customize the AI-generated content?',
    answer: 'Absolutely. AI generates a first draft that you can review, edit, and enhance. Think of it as having a tireless assistant who creates initial drafts.',
  },
  {
    question: 'What credentials are supported?',
    answer: 'We support 30+ credentials including EPA 608, OSHA 30/10, NHA certifications, ServSafe, CDL, and state licensing programs. Custom credentials can be configured.',
  },
  {
    question: 'Do the videos look professional?',
    answer: 'Yes. Our AI generates videos with realistic avatars, professional voiceovers, and dynamic visuals. You can also record your own instructor for a personal touch.',
  },
  {
    question: 'How does the credential mapping work?',
    answer: 'When you select a credential, AI automatically builds curriculum aligned to exam objectives, competency frameworks, and regulatory requirements.',
  },
];

// Additional icons
function Rocket({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

export default function CourseFactoryPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/20 rounded-full blur-[100px]" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-teal-500/20 rounded-full blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <GraduationCap className="w-8 h-8 text-emerald-500" />
              <span className="font-bold text-xl">Course Factory</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-slate-300 hover:text-white transition-colors">Features</Link>
              <Link href="#credentials" className="text-slate-300 hover:text-white transition-colors">Credentials</Link>
              <Link href="#how" className="text-slate-300 hover:text-white transition-colors">How It Works</Link>
              <Link href="#pricing" className="text-slate-300 hover:text-white transition-colors">Pricing</Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/admin/studio" className="text-slate-300 hover:text-white transition-colors hidden sm:block">
                Open Builder
              </Link>
              <Link 
                href="/demo"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-5 py-2 rounded-lg font-medium transition-all"
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-300">AI-Powered Course Generation</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-emerald-200 to-white bg-clip-text text-transparent">
                Course Factory
              </span>
              <br />
              <span className="text-4xl md:text-5xl text-slate-300">
                Build Courses 10x Faster
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-slate-400 mb-8 max-w-3xl mx-auto leading-relaxed">
              Generate complete workforce training courses with AI. 
              From curriculum to videos to assessments — built in days, not months.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link 
                href="/demo"
                className="group flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-emerald-50 transition-all"
              >
                Start Generating
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/admin/studio"
                className="flex items-center gap-2 border border-white/20 px-8 py-4 rounded-xl font-medium text-lg hover:bg-white/5 transition-all"
              >
                <Play className="w-5 h-5" />
                Try Demo Course
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-1">
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

      {/* Content Types Preview */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 border-y border-white/5 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Complete Course Content, Auto-Generated
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Every course includes all the materials students need to succeed
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {CONTENT_TYPES.map((type) => (
              <div 
                key={type.name}
                className="bg-slate-800/50 border border-white/10 rounded-xl p-4 text-center hover:border-emerald-500/30 transition-all"
              >
                <type.icon className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <h3 className="font-semibold text-white text-sm">{type.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{type.count}</p>
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
              Enterprise Course Generation
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Not just content generation — a complete course development platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {CORE_FEATURES.map((feature) => (
              <div 
                key={feature.title}
                className="group relative bg-slate-900/50 border border-white/10 rounded-2xl p-8 hover:border-emerald-500/30 transition-all duration-300"
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

      {/* Credentials */}
      <section id="credentials" className="relative z-10 py-32 px-4 sm:px-6 lg:px-8 bg-slate-900/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Credential Intelligence Built-In
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Every course is aligned to industry-recognized credentials
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CREDENTIALS.map((cred) => (
              <div 
                key={cred.name}
                className="bg-slate-800/50 border border-white/10 rounded-xl p-6 hover:border-emerald-500/30 transition-all"
              >
                <AwardIcon className="w-8 h-8 text-emerald-400 mb-4" />
                <h3 className="font-bold text-white mb-1">{cred.name}</h3>
                <p className="text-sm text-slate-400">{cred.description}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <span className="text-slate-400">...and 25+ more credentials available</span>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="relative z-10 py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              How It Works
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              From credential selection to published course in days
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step, index) => (
              <div key={step.step} className="relative">
                {index < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-emerald-500/50 to-transparent" />
                )}
                <div className="relative bg-slate-800/50 border border-white/10 rounded-2xl p-8 h-full">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xl mb-6">
                    {step.step}
                  </div>
                  <step.icon className="w-10 h-10 text-emerald-400 mb-4" />
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
              Why Course Factory?
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
                  <div className="text-sm text-emerald-400">{testimonial.organization}</div>
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-300">Ready to accelerate your curriculum development?</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Generate Your First Course
          </h2>
          
          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
            Join workforce development organizations already using Course Factory to build better courses faster.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/demo"
              className="group flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-emerald-50 transition-all"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/contact"
              className="flex items-center gap-2 border border-white/20 px-8 py-4 rounded-xl font-medium text-lg hover:bg-white/5 transition-all"
            >
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-emerald-500" />
              <span className="font-bold">Course Factory</span>
              <span className="text-slate-500">by Elevate for Humanity</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/security" className="hover:text-white transition-colors">Security</Link>
              <Link href="/docs/course-factory" className="hover:text-white transition-colors">Documentation</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
