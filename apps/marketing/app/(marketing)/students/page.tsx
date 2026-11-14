/**
 * Student Journey - Conversion Funnel
 * 
 * Complete student journey from discovery to career placement
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { 
  GraduationCap,
  Search,
  FileText,
  CreditCard,
  BookOpen,
  Award,
  Briefcase,
  ArrowRight,
  CheckCircle2,
  Clock,
  Users,
  DollarSign,
  Shield,
  Heart,
  Target,
  TrendingUp,
  Star,
  ChevronRight,
  Play,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  Calendar,
  UserCheck,
  FileCheck,
  Building2,
  Mic,
  Video,
  Wifi,
  GraduationCap as GradIcon
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Student Journey | Career Training to Placement | Elevate',
  description: 'Your path from career exploration to job placement. Discover programs, get funded, train with AI, earn credentials, and launch your career.',
  keywords: ['student journey', 'career training', 'job placement', 'workforce development', 'student success'],
  openGraph: {
    title: 'Student Journey',
    description: 'From discovery to placement - your complete career training journey',
    type: 'website',
  },
};

// Journey steps
const JOURNEY_STEPS = [
  {
    step: 1,
    phase: 'Discover',
    title: 'Explore Careers',
    description: 'Take our AI-powered career assessment. Discover programs that match your interests, skills, and goals.',
    icon: Search,
    color: 'from-violet-500 to-purple-600',
    duration: '15-30 min',
    activities: ['Career assessment', 'Program discovery', 'Goal setting', 'AI recommendations'],
    cta: 'Start Assessment',
  },
  {
    step: 2,
    phase: 'Apply',
    title: 'Submit Application',
    description: 'Complete your application with AI assistance. Our admissions agent helps you every step of the way.',
    icon: FileText,
    color: 'from-blue-500 to-cyan-500',
    duration: '30-60 min',
    activities: ['Application guidance', 'Document upload', 'Eligibility check', 'Interview scheduling'],
    cta: 'Apply Now',
  },
  {
    step: 3,
    phase: 'Fund',
    title: 'Secure Funding',
    description: 'We help you navigate WIOA, VR, veterans benefits, employer sponsorships, and payment plans.',
    icon: DollarSign,
    color: 'from-emerald-500 to-teal-500',
    duration: '1-2 weeks',
    activities: ['Funding assessment', 'WIOA application', 'Payment plans', 'Scholarship search'],
    cta: 'Explore Funding',
  },
  {
    step: 4,
    phase: 'Learn',
    title: 'Start Training',
    description: 'Learn with AI-powered courses, virtual simulations, and expert instructors. Study anywhere, anytime.',
    icon: BookOpen,
    color: 'from-amber-500 to-orange-500',
    duration: 'Weeks to months',
    activities: ['AI course content', 'Video lessons', 'Practice labs', 'Live sessions'],
    cta: 'View Programs',
  },
  {
    step: 5,
    phase: 'Certify',
    title: 'Earn Credentials',
    description: 'Prepare for and pass industry certifications. EPA 608, OSHA 30, NHA, and more.',
    icon: Award,
    color: 'from-pink-500 to-rose-500',
    duration: 'Exam schedule',
    activities: ['Exam prep', 'Practice tests', 'Certification exams', 'Digital badges'],
    cta: 'See Credentials',
  },
  {
    step: 6,
    phase: 'Place',
    title: 'Launch Career',
    description: 'Get matched with employers, polish your resume, practice interviews, and land your dream job.',
    icon: Briefcase,
    color: 'from-indigo-500 to-blue-600',
    duration: 'Ongoing support',
    activities: ['Resume building', 'Interview prep', 'Employer matching', 'Job leads'],
    cta: 'Career Services',
  },
];

// Program highlights
const PROGRAMS = [
  { name: 'HVAC/R', credential: 'EPA 608 Universal', duration: '8-16 weeks', jobs: '45,000+ annual openings', salary: '$50,000/year avg' },
  { name: 'Medical Assistant', credential: 'NHA CCMA', duration: '12-20 weeks', jobs: '100,000+ annual openings', salary: '$37,000/year avg' },
  { name: 'Barber/Cosmetology', credential: 'State License', duration: '12-24 weeks', jobs: '40,000+ annual openings', salary: '$35,000/year avg' },
  { name: 'Commercial Driver', credential: 'CDL Class A/B', duration: '4-8 weeks', jobs: '300,000+ annual openings', salary: '$55,000/year avg' },
  { name: 'Healthcare', credential: 'CPR/BLS Certified', duration: '4-8 weeks', jobs: '200,000+ annual openings', salary: '$40,000/year avg' },
  { name: 'Construction', credential: 'OSHA 30', duration: '6-12 weeks', jobs: '800,000+ annual openings', salary: '$55,000/year avg' },
];

// Support features
const SUPPORT = [
  { icon: Heart, title: 'Personalized Coaching', description: 'AI-powered guidance matched to your learning style and career goals' },
  { icon: Clock, title: 'Flexible Schedule', description: 'Online courses available 24/7. In-person options for hands-on training' },
  { icon: Users, title: 'Small Class Sizes', description: 'Maximum 15 students per cohort for personalized attention' },
  { icon: Shield, title: 'Career Guarantee', description: 'Continued support until you\'re placed in your chosen field' },
];

// FAQ
const FAQS = [
  { question: 'How long does the entire journey take?', answer: 'It varies by program. Short certifications (OSHA 30, CPR) can be completed in weeks. Complete career programs typically take 3-9 months from application to job placement.' },
  { question: 'What if I can\'t afford tuition?', answer: 'We accept WIOA funding, Vocational Rehabilitation, veterans benefits, employer sponsorships, and offer payment plans. Our team helps determine what funding you may qualify for.' },
  { question: 'Do I need prior experience?', answer: 'No! Most of our programs are designed for beginners. Our AI assessment helps match you with programs suited to your current skill level and career goals.' },
  { question: 'What support do I get after graduation?', answer: 'Career services support. Resume help, interview coaching, employer connections, and job leads. We don\'t stop supporting you until you\'re employed.' },
  { question: 'Are your credentials recognized nationally?', answer: 'Yes. Our credentials include EPA 608, OSHA 30, NHA certifications, and state licensing prep — all recognized by employers nationwide.' },
];

// Additional icons
function Building({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </svg>
  );
}

export default function StudentJourneyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Hero */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-violet-900/20 to-slate-950">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-8">
            <GraduationCap className="w-4 h-4 text-violet-400" />
            <span className="text-sm text-violet-300">Your Path to a Career</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-violet-200 to-white bg-clip-text text-transparent">
              From Discovery to Career
            </span>
            <br />
            <span className="text-3xl md:text-4xl text-slate-400">
              Your Complete Journey
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-12">
            We guide you every step of the way — from exploring careers to landing your dream job. 
            AI-powered support, expert instructors, and career services included.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/apply"
              className="group flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-violet-50 transition-all"
            >
              Start Your Journey
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/programs"
              className="flex items-center gap-2 border border-white/20 px-8 py-4 rounded-xl font-medium text-lg hover:bg-white/5 transition-all"
            >
              <Play className="w-5 h-5" />
              Explore Programs
            </Link>
          </div>
        </div>
      </section>

      {/* Journey Timeline */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Your 6-Step Journey
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              From your first click to your first paycheck — we&apos;re with you at every step
            </p>
          </div>

          <div className="space-y-8">
            {JOURNEY_STEPS.map((step) => (
              <div 
                key={step.step}
                className="relative bg-slate-900/50 border border-white/10 rounded-2xl p-8 md:p-12 hover:border-violet-500/30 transition-all"
              >
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Step indicator */}
                  <div className="flex flex-row md:flex-col items-center md:items-start gap-4 md:w-48">
                    <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${step.color}`}>
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-slate-500 mb-1">Step {step.step}</div>
                      <div className="text-2xl font-bold text-white">{step.phase}</div>
                      <div className="text-sm text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {step.duration}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
                    <p className="text-slate-400 mb-6 leading-relaxed">{step.description}</p>
                    
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                      {step.activities.map((activity) => (
                        <div key={activity} className="flex items-center gap-2 text-slate-300">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          {activity}
                        </div>
                      ))}
                    </div>

                    <Link 
                      href="/apply"
                      className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 font-medium"
                    >
                      {step.cta}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-900/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Popular Programs
            </h2>
            <p className="text-xl text-slate-400">
              Industry-recognized credentials with strong job markets
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PROGRAMS.map((program) => (
              <div 
                key={program.name}
                className="bg-slate-800/50 border border-white/10 rounded-xl p-6 hover:border-violet-500/30 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">{program.name}</h3>
                  <Award className="w-6 h-6 text-amber-400" />
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Credential</span>
                    <span className="text-slate-300">{program.credential}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Duration</span>
                    <span className="text-slate-300">{program.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Job Outlook</span>
                    <span className="text-emerald-400">{program.jobs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Avg Salary</span>
                    <span className="text-white font-medium">{program.salary}</span>
                  </div>
                </div>

                <Link 
                  href="/programs"
                  className="mt-6 block w-full text-center py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-colors"
                >
                  Learn More
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              We Support You Whole Person
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Success isn&apos;t just about passing exams. We support your entire journey.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SUPPORT.map((item) => (
              <div 
                key={item.title}
                className="bg-slate-900/50 border border-white/10 rounded-xl p-6 text-center"
              >
                <item.icon className="w-10 h-10 text-violet-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-violet-900/30 to-purple-900/30 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">85%</div>
              <div className="text-slate-400">Receive Financial Aid</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">92%</div>
              <div className="text-slate-400">Complete Programs</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">87%</div>
              <div className="text-slate-400">Placed in Field</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">6mo</div>
              <div className="text-slate-400">Post-Grad Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Questions?
            </h2>
          </div>

          <div className="space-y-6">
            {FAQS.map((faq, index) => (
              <div 
                key={index}
                className="bg-slate-900/50 border border-white/10 rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-3">{faq.question}</h3>
                <p className="text-slate-400">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-950 to-violet-900/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Start?
          </h2>
          <p className="text-xl text-slate-400 mb-12">
            Your career transformation begins with a single step. 
            Apply today and talk to an admissions advisor for free.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/apply"
              className="group flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-violet-50 transition-all"
            >
              Apply Now - It&apos;s Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/contact"
              className="flex items-center gap-2 border border-white/20 px-8 py-4 rounded-xl font-medium text-lg hover:bg-white/5 transition-all"
            >
              <Phone className="w-5 h-5" />
              Talk to Advisor
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-violet-500" />
              <span className="font-bold">Elevate for Humanity</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/accessibility" className="hover:text-white transition-colors">Accessibility</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
