import { Metadata } from 'next';
import Link from 'next/link';
import { 
  GraduationCap, Users, Building2, Award, Clock, DollarSign,
  CheckCircle, Brain, Zap, Shield, BarChart3, Users2,
  BookOpen, MessageSquare, FileText, TrendingUp, ArrowRight
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Platform Features',
  description: 'Discover the powerful features of Elevate for Humanity\'s workforce development platform. AI-powered tools, employer integrations, and comprehensive student tracking.',
};

const PLATFORM_FEATURES = [
  {
    category: 'For Students',
    icon: GraduationCap,
    features: [
      { title: 'AI Career Assessment', description: 'PARiS AI interviews guide you to the right career path based on your skills and goals.' },
      { title: 'Self-Paced Learning', description: 'Access coursework 24/7 with interactive modules and progress tracking.' },
      { title: 'Certification Prep', description: 'Built-in exam preparation for NHA, Certiport, EPA 608, and more.' },
      { title: 'Career Services', description: 'Resume building, interview coaching, and job placement support.' },
    ],
  },
  {
    category: 'For Employers',
    icon: Building2,
    features: [
      { title: 'OJL Tracking', description: 'Track on-the-job learning hours with digital competency sign-offs.' },
      { title: 'RTI Management', description: 'Monitor related technical instruction progress for each apprentice.' },
      { title: 'Talent Pipeline', description: 'Access pre-screened graduates ready for immediate hire.' },
      { title: 'Grant Support', description: 'We help you navigate employer apprenticeship grants.' },
    ],
  },
  {
    category: 'For Workforce Partners',
    icon: Users,
    features: [
      { title: 'Grant Management', description: 'Track WIOA and WRG funding allocation and utilization.' },
      { title: 'Outcomes Reporting', description: 'Real-time dashboards showing graduate employment rates.' },
      { title: 'Partner Network', description: 'Connect training providers, employers, and job seekers.' },
      { title: 'Compliance Tools', description: 'DOL-registered apprenticeship management built-in.' },
    ],
  },
];

const CORE_FEATURES = [
  { icon: Brain, title: 'PARiS AI Assistant', description: 'AI-powered career guidance and enrollment support available 24/7.' },
  { icon: Zap, title: 'Fast Enrollment', description: 'Complete applications in under 5 minutes with AI assistance.' },
  { icon: Shield, title: 'Secure & Compliant', description: 'SOC 2 compliant with FERPA and DOL standards built-in.' },
  { icon: BarChart3, title: 'Real-Time Analytics', description: 'Track progress, outcomes, and ROI with live dashboards.' },
  { icon: BookOpen, title: 'LMS Integration', description: 'Seamless learning management with progress sync.' },
  { icon: MessageSquare, title: 'CRM Built-In', description: 'Student relationship management with automated follow-ups.' },
  { icon: FileText, title: 'Digital Binder', description: 'All student documents, contracts, and credentials in one place.' },
  { icon: TrendingUp, title: 'Placement Tracking', description: 'Follow graduates through their first 90 days of employment.' },
];

const STATS = [
  { value: '95%', label: 'Certification Pass Rate' },
  { value: '87%', label: 'Job Placement Rate' },
  { value: '$0', label: 'Cost to Students (with funding)' },
  { value: '48hrs', label: 'Average Enrollment Time' },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              A Complete Workforce Platform
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8">
              Everything you need to recruit, train, certify, and place workers — 
              all in one integrated platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/demo" className="inline-flex items-center justify-center gap-2 bg-white text-brand-blue-700 font-bold py-4 px-8 rounded-xl hover:bg-blue-50 transition-colors">
                Try the Demo <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white font-bold py-4 px-8 rounded-xl hover:bg-white/10 transition-colors">
                Schedule a Walkthrough
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-brand-blue-600 mb-2">{stat.value}</div>
                <div className="text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Platform Capabilities</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Built for workforce development professionals who need powerful tools without the complexity.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CORE_FEATURES.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <div key={feature.title} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <IconComponent className="w-6 h-6 text-brand-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600 text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Role-Based Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Built for Every Stakeholder</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Role-based dashboards and tools designed specifically for students, employers, and workforce agencies.
            </p>
          </div>
          <div className="space-y-16">
            {PLATFORM_FEATURES.map((category) => {
              const IconComponent = category.icon;
              return (
                <div key={category.category} className="grid lg:grid-cols-2 gap-12 items-center">
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-brand-blue-600 rounded-xl flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900">{category.category}</h3>
                    </div>
                    <div className="space-y-6">
                      {category.features.map((feature) => (
                        <div key={feature.title} className="flex gap-4">
                          <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-bold text-slate-900 mb-1">{feature.title}</h4>
                            <p className="text-slate-600">{feature.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-slate-100 rounded-2xl aspect-video flex items-center justify-center">
                    <div className="text-center p-8">
                      <IconComponent className="w-16 h-16 text-brand-blue-300 mx-auto mb-4" />
                      <p className="text-slate-500">{category.category} Dashboard</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Seamless Integrations</h2>
              <p className="text-slate-300 text-lg mb-8">
                Connect with the tools you already use. Our API-first platform integrates with 
                Stripe, Calendly, government portals, and more.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {['Stripe Payments', 'Calendly Scheduling', 'Indiana FSSA', 'WorkOne Network', 'DOL Systems', 'WIOA Portals'].map((integration) => (
                  <div key={integration} className="flex items-center gap-2 text-slate-300">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span>{integration}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-800 rounded-2xl p-8">
              <h3 className="font-bold text-lg mb-4">API Available</h3>
              <p className="text-slate-400 mb-6">
                Build custom integrations with our REST API and webhooks.
              </p>
              <Link href="/docs/api" className="inline-flex items-center gap-2 text-brand-blue-400 hover:text-brand-blue-300">
                View API Documentation <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-brand-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Workforce?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join hundreds of workforce agencies, employers, and training providers who trust Elevate for Humanity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/demo" className="inline-flex items-center justify-center gap-2 bg-white text-brand-blue-700 font-bold py-4 px-8 rounded-xl hover:bg-blue-50 transition-colors">
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 border-2 border-white text-white font-bold py-4 px-8 rounded-xl hover:bg-white/10 transition-colors">
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
