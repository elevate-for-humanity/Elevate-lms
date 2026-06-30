import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { 
  Building2, 
  Users, 
  BarChart, 
  FileText, 
  CheckCircle,
  Globe,
  Award,
  TrendingUp,
  Shield,
  Clock,
  DollarSign,
  ChevronRight
} from 'lucide-react';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/platform/workforce-boards',
  },
  title: 'Workforce Board Portal | Elevate For Humanity',
  description: 'Streamline WIOA case management, track participant outcomes, manage training providers, and generate compliance reports.',
};

const PORTAL_FEATURES = [
  {
    icon: Users,
    title: 'Participant Management',
    description: 'Track WIOA participants from enrollment through employment. Manage eligibility, services, and outcomes in one system.',
  },
  {
    icon: FileText,
    title: 'Case Management',
    description: 'Comprehensive case notes, service tracking, and follow-up management. Never miss a required touchpoint.',
  },
  {
    icon: BarChart,
    title: 'Performance Reporting',
    description: 'Real-time dashboards for WIOA performance indicators. Track employment, earnings, and credential attainment.',
  },
  {
    icon: Building2,
    title: 'Provider Management',
    description: 'Manage your ETPL providers, monitor performance, and track training outcomes across all partners.',
  },
  {
    icon: DollarSign,
    title: 'Financial Tracking',
    description: 'Track ITA expenditures, supportive services, and OJT contracts. Manage budgets and obligations.',
  },
  {
    icon: Shield,
    title: 'Compliance Tools',
    description: 'Built-in WIOA compliance checks, automated reporting, and audit-ready documentation.',
  },
];

const WIOA_PROGRAMS = [
  { name: 'Adult Program', description: 'Employment and training for adults 18+' },
  { name: 'Dislocated Worker', description: 'Services for laid-off workers' },
  { name: 'Youth Program', description: 'In-school and out-of-school youth services' },
  { name: 'National Dislocated Worker Grants', description: 'Disaster and emergency grants' },
];

const PERFORMANCE_METRICS = [
  { metric: 'Employment Rate Q2', target: '75%', description: 'Employed in Q2 after exit' },
  { metric: 'Employment Rate Q4', target: '72%', description: 'Employed in Q4 after exit' },
  { metric: 'Median Earnings Q2', target: '$6,500', description: 'Median earnings in Q2' },
  { metric: 'Credential Rate', target: '65%', description: 'Credential attainment rate' },
  { metric: 'Measurable Skill Gains', target: '55%', description: 'Skills gains during program' },
  { metric: 'Effectiveness in Serving Employers', target: 'Met', description: 'Employer engagement' },
];

export default function WorkforceBoardsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('/images/patterns/grid.svg')] opacity-5" />
          <div className="max-w-7xl mx-auto px-4 py-20 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-blue-500/20 backdrop-blur px-4 py-2 rounded-full text-sm font-medium text-blue-300 mb-6">
                  <Building2 className="w-4 h-4" />
                  <span>For Workforce Boards</span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
                  Workforce Board Portal
                </h1>
                <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                  Streamline WIOA case management, track participant outcomes, manage training providers, 
                  and generate compliance reports—all in one integrated platform.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/workforce-board/dashboard"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg"
                  >
                    Access Portal
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition border border-white/20"
                  >
                    Request Demo
                  </Link>
                </div>
              </div>
              <div className="relative hidden lg:block">
                <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="/images/heroes/workforce-board.jpg"
                    alt="Workforce Board Portal"
                    fill
                    className="object-cover"
                    sizes="50vw"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
                Complete WIOA Management
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Everything you need to manage WIOA programs, track outcomes, and maintain compliance.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {PORTAL_FEATURES.map((feature) => {
                const IconComponent = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="bg-slate-50 rounded-2xl p-8 hover:shadow-lg transition"
                  >
                    <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                      <IconComponent className="w-7 h-7 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* WIOA Programs */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
                WIOA Program Support
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Manage all WIOA Title I programs from a single integrated platform.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {WIOA_PROGRAMS.map((program) => (
                <div
                  key={program.name}
                  className="bg-white rounded-xl p-6 border border-slate-200 hover:border-blue-300 hover:shadow-md transition"
                >
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{program.name}</h3>
                  <p className="text-slate-600 text-sm">{program.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Performance Metrics */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
                Track Performance Indicators
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Real-time tracking of all WIOA primary indicators of performance.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PERFORMANCE_METRICS.map((item) => (
                <div
                  key={item.metric}
                  className="bg-white rounded-xl p-6 border border-slate-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-slate-900">{item.metric}</h3>
                    <span className="text-2xl font-black text-blue-600">{item.target}</span>
                  </div>
                  <p className="text-slate-600 text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Integration Section */}
        <section className="py-20 bg-slate-900 text-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-black mb-6">
                  Seamless State System Integration
                </h2>
                <p className="text-lg text-slate-300 mb-8">
                  Our platform integrates with state workforce systems to streamline data entry, 
                  reduce duplication, and ensure accurate reporting.
                </p>
                
                <div className="space-y-4">
                  {[
                    'Automated data sync with state MIS',
                    'Real-time eligibility verification',
                    'Integrated wage record matching',
                    'Automated quarterly reporting',
                    'PIRL-compliant data exports',
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative h-[400px] rounded-2xl overflow-hidden">
                <Image
                  src="/images/heroes/data-integration.jpg"
                  alt="System Integration"
                  fill
                  className="object-cover"
                  sizes="50vw"
                />
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-black mb-6">
              Ready to Modernize Your Workforce Operations?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join workforce boards across the country using our platform to improve outcomes and streamline operations.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-blue-50 transition"
              >
                Schedule a Demo
              </Link>
              <Link
                href="/partners/workforce"
                className="inline-flex items-center gap-2 bg-blue-500/30 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-500/40 transition border border-white/30"
              >
                Learn More
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
