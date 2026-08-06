/**
 * Employer Journey - Conversion Funnel
 * 
 * Complete employer journey from discovering talent to building workforce
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Building2,
  Users,
  Briefcase,
  Award,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  Clock,
  DollarSign,
  Shield,
  Heart,
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
  Users2,
  Handshake,
  ClipboardList,
  BarChart3,
  Truck,
  HeartPulse,
  Scissors,
  Stethoscope,
  HardHat
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'For Employers | Workforce Solutions | Elevate',
  description: 'Partner with Elevate to build your workforce. Hire certified graduates, sponsor apprenticeships, and access WIOA funding for training.',
  keywords: ['employer partnership', 'workforce development', 'apprenticeship', 'hiring', 'WIOA', 'talent pipeline'],
  openGraph: {
    title: 'For Employers',
    description: 'Build your workforce pipeline with certified talent',
    type: 'website',
  },
};

// Journey steps
const JOURNEY_STEPS = [
  {
    step: 1,
    phase: 'Discover',
    title: 'Explore Solutions',
    description: 'Learn how we solve your workforce challenges. From entry-level hiring to advanced certifications.',
    icon: Search,
    color: 'from-violet-500 to-purple-600',
    duration: '30 min consultation',
    activities: ['Workforce needs assessment', 'Solution overview', 'Funding options', 'Custom proposal'],
    cta: 'Schedule Consultation',
  },
  {
    step: 2,
    phase: 'Partner',
    title: 'Build Partnership',
    description: 'We create a custom workforce program for your industry, locations, and hiring needs.',
    icon: Handshake,
    color: 'from-blue-500 to-cyan-500',
    duration: '1-2 weeks',
    activities: ['MOU signing', 'Curriculum alignment', 'Schedule planning', 'Staff introduction'],
    cta: 'Start Partnership',
  },
  {
    step: 3,
    phase: 'Recruit',
    title: 'Hire Talent',
    description: 'Access our pipeline of job-ready candidates. Pre-screened, certified, and prepared to work.',
    icon: Users,
    color: 'from-emerald-500 to-teal-500',
    duration: 'Ongoing',
    activities: ['Job posting', 'Candidate matching', 'Interview coordination', 'Pre-hire screening'],
    cta: 'Post Job Opening',
  },
  {
    step: 4,
    phase: 'Develop',
    title: 'Upskill Team',
    description: 'Invest in your existing workforce with customized training programs. WIOA funding available.',
    icon: GraduationCap,
    color: 'from-amber-500 to-orange-500',
    duration: 'Flexible',
    activities: ['Skills assessment', 'Custom curriculum', 'On-site or online', 'Certification prep'],
    cta: 'Explore Training',
  },
  {
    step: 5,
    phase: 'Apprentice',
    title: 'Start Apprenticeship',
    description: 'Launch registered apprenticeships with DOL recognition. Get tax credits and grant funding.',
    icon: Award,
    color: 'from-pink-500 to-rose-500',
    duration: '1-4 years',
    activities: ['RAPIDS registration', 'OJL development', 'RTI coordination', 'Competency tracking'],
    cta: 'Learn Apprenticeship',
  },
  {
    step: 6,
    phase: 'Succeed',
    title: 'Grow Together',
    description: 'Ongoing support, graduate tracking, and continuous improvement of your workforce program.',
    icon: TrendingUp,
    color: 'from-indigo-500 to-blue-600',
    duration: 'Long-term',
    activities: ['Performance metrics', 'Graduate tracking', 'Program refinement', 'Expansion planning'],
    cta: 'View Success Stories',
  },
];

// Industry solutions
const INDUSTRIES = [
  { name: 'HVAC & Refrigeration', icon: Truck, credential: 'EPA 608, NATE', jobs: 'HVAC Technician, Installer, Service Tech' },
  { name: 'Healthcare', icon: Stethoscope, credential: 'NHA CCMA, Phlebotomy, EKG', jobs: 'Medical Assistant, MA, Reception' },
  { name: 'Barber & Cosmetology', icon: Scissors, credential: 'State License, Barber', jobs: 'Barber, Stylist, Manager' },
  { name: 'Construction', icon: HardHat, credential: 'OSHA 30, CDL', jobs: 'Safety Manager, Driver, Laborer' },
  { name: 'All Industries', icon: Users2, credential: 'CPR, First Aid, OSHA 10', jobs: 'Any entry-level position' },
];

// Benefits
const BENEFITS = [
  { title: 'Pre-Certified Talent', description: 'Graduates earn industry-recognized certifications. Career services support job search and employer connections.', metric: 'Credentialed candidates' },
  { title: 'WIOA Funding', description: 'Offset training costs with workforce development funds. We handle the paperwork.', metric: 'Funding assistance' },
  { title: 'Custom Curriculum', description: 'Training aligned to YOUR standards, equipment, and processes.', metric: 'Tailored to you' },
  { title: 'Apprenticeship Tax Credits', description: 'Employers may claim federal tax credits for registered apprentices.', metric: 'Tax credit eligible' },
];

// FAQ
const FAQS = [
  { question: 'How much does it cost to partner?', answer: 'Costs vary by program. WIOA funding can cover 50-100% of training costs for eligible positions. Initial consultations are always free.' },
  { question: 'How quickly can we hire?', answer: 'Our candidate pipeline is ongoing. Post a job today and receive pre-screened candidates within 2-4 weeks.' },
  { question: 'What industries do you serve?', answer: 'We specialize in HVAC, healthcare, barber/cosmetology, construction, and general workforce. Custom programs available.' },
  { question: 'Can we train existing employees?', answer: 'Absolutely. Upskilling programs can be customized for your current workforce. WIOA funding often applies.' },
  { question: 'What if we need a custom credential?', answer: 'We can develop custom curriculum and proctor custom certification exams. Contact us to discuss your needs.' },
];

// Icons
function Search({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export default function EmployerJourneyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Hero */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-900/20 to-slate-950">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8">
            <Building2 className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300">For Employers</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-blue-200 to-white bg-clip-text text-transparent">
              Build Your Workforce
            </span>
            <br />
            <span className="text-3xl md:text-4xl text-slate-400">
              From Discovery to Success
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-12">
            Partner with Elevate to solve your workforce challenges. 
            Access certified talent, WIOA funding, and apprenticeship programs.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/contact"
              className="group flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-all"
            >
              Schedule Consultation
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/employers/post-job"
              className="flex items-center gap-2 border border-white/20 px-8 py-4 rounded-xl font-medium text-lg hover:bg-white/5 transition-all"
            >
              <Briefcase className="w-5 h-5" />
              Post Job Opening
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-900/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">500+</div>
              <div className="text-slate-400">Employer Partners</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">2,000+</div>
              <div className="text-slate-400">Placements Annually</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">85%</div>
              <div className="text-slate-400">1-Year Retention</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">$5M+</div>
              <div className="text-slate-400">WIOA Funding Secured</div>
            </div>
          </div>
        </div>
      </section>

      {/* Journey Timeline */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Your 6-Step Partnership Journey
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              We make partnering simple. Here&apos;s what to expect at every stage.
            </p>
          </div>

          <div className="space-y-8">
            {JOURNEY_STEPS.map((step) => (
              <div 
                key={step.step}
                className="relative bg-slate-900/50 border border-white/10 rounded-2xl p-8 md:p-12 hover:border-blue-500/30 transition-all"
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
                      href="/contact"
                      className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium"
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

      {/* Industries */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-900/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Industries We Serve
            </h2>
            <p className="text-xl text-slate-400">
              Specialized training programs with employer-aligned curriculum
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {INDUSTRIES.map((industry) => (
              <div 
                key={industry.name}
                className="bg-slate-800/50 border border-white/10 rounded-xl p-6 hover:border-blue-500/30 transition-all"
              >
                <industry.icon className="w-10 h-10 text-blue-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">{industry.name}</h3>
                <div className="text-sm">
                  <div className="text-slate-500 mb-1">Credentials</div>
                  <div className="text-slate-300 mb-3">{industry.credential}</div>
                  <div className="text-slate-500 mb-1">Positions</div>
                  <div className="text-slate-300">{industry.jobs}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Why Partner With Us?
            </h2>
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

      {/* Testimonials */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-y border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-6">What Partners Say</h2>
          </div>
          
          <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-8">
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <blockquote className="text-xl text-slate-300 mb-6 leading-relaxed">
              "We were struggling to find certified HVAC technicians. Elevate&apos;s program delivered 
              job-ready graduates in 8 weeks. Our hiring manager says it&apos;s the best workforce 
              partnership we&apos;ve ever had."
            </blockquote>
            <div>
              <div className="font-semibold text-white">Michael Rodriguez</div>
              <div className="text-slate-400">HR Director</div>
              <div className="text-sm text-blue-400">Comfort Solutions HVAC</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Common Questions
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
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-950 to-blue-900/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Build Your Workforce?
          </h2>
          <p className="text-xl text-slate-400 mb-12">
            Schedule a free consultation. We&apos;ll assess your needs and create a custom workforce solution.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/contact"
              className="group flex items-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-all"
            >
              Schedule Free Consultation
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/employers/post-job"
              className="flex items-center gap-2 border border-white/20 px-8 py-4 rounded-xl font-medium text-lg hover:bg-white/5 transition-all"
            >
              <Briefcase className="w-5 h-5" />
              Post Job Opening
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-500" />
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
