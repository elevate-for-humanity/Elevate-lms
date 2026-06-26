import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { 
  GraduationCap, 
  Users, 
  BarChart, 
  DollarSign, 
  CheckCircle,
  Globe,
  Award,
  BookOpen,
  Settings,
  TrendingUp,
  Shield,
  ChevronRight
} from 'lucide-react';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/platform/training-providers',
  },
  title: 'Training Provider Portal | Elevate For Humanity',
  description: 'Partner with us to deliver workforce training programs. Access our LMS platform, student management tools, and funding opportunities.',
};

const PORTAL_FEATURES = [
  {
    icon: BookOpen,
    title: 'Course Management',
    description: 'Create, upload, and manage your training courses with our intuitive course builder. Support for video, documents, quizzes, and interactive content.',
  },
  {
    icon: Users,
    title: 'Student Management',
    description: 'Track student enrollment, progress, attendance, and completion rates. Manage cohorts and communicate with learners.',
  },
  {
    icon: BarChart,
    title: 'Analytics Dashboard',
    description: 'Real-time insights into program performance, student outcomes, completion rates, and employment placement metrics.',
  },
  {
    icon: DollarSign,
    title: 'Revenue Management',
    description: 'Track tuition payments, manage billing, process refunds, and access detailed financial reports.',
  },
  {
    icon: Award,
    title: 'Certification System',
    description: 'Issue verifiable digital certificates and credentials. Track certification status and manage renewals.',
  },
  {
    icon: Shield,
    title: 'Compliance Tools',
    description: 'Stay compliant with WIOA, ETPL, and accreditation requirements. Automated reporting and documentation.',
  },
];

const BENEFITS = [
  'White-label LMS platform with your branding',
  'Access to WIOA-funded student referrals',
  'Automated compliance reporting',
  'Student recruitment and marketing support',
  'Employer partnership connections',
  'Technical support and training',
];

const PROGRAM_TYPES = [
  { name: 'Healthcare Training', examples: 'CNA, Medical Assistant, Phlebotomy' },
  { name: 'Skilled Trades', examples: 'HVAC, Electrical, Welding, Plumbing' },
  { name: 'Beauty & Cosmetology', examples: 'Barber, Cosmetology, Esthetician' },
  { name: 'Business & IT', examples: 'Tax Prep, Bookkeeping, IT Support' },
  { name: 'Transportation', examples: 'CDL, Forklift, Heavy Equipment' },
  { name: 'Professional Services', examples: 'Real Estate, Insurance, Notary' },
];

export default function TrainingProvidersPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('/images/patterns/grid.svg')] opacity-10" />
          <div className="max-w-7xl mx-auto px-4 py-20 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <GraduationCap className="w-4 h-4" />
                  <span>For Training Providers</span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
                  Training Provider Portal
                </h1>
                <p className="text-xl text-purple-100 mb-8 leading-relaxed">
                  Partner with us to expand your reach, streamline operations, and connect your 
                  programs with funded students and employer partners.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/program-holder/dashboard"
                    className="inline-flex items-center gap-2 bg-white text-purple-600 px-8 py-4 rounded-xl font-bold hover:bg-purple-50 transition shadow-lg"
                  >
                    Access Portal
                  </Link>
                  <Link
                    href="/partners/training-provider"
                    className="inline-flex items-center gap-2 bg-purple-500/30 backdrop-blur text-white px-8 py-4 rounded-xl font-bold hover:bg-purple-500/40 transition border border-white/30"
                  >
                    Become a Partner
                  </Link>
                </div>
              </div>
              <div className="relative hidden lg:block">
                <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="/images/heroes/training-provider.jpg"
                    alt="Training Provider Portal"
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

        {/* Stats Bar */}
        <section className="bg-slate-900 text-white py-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-black">150+</div>
                <div className="text-slate-400">Training Partners</div>
              </div>
              <div>
                <div className="text-4xl font-black">50+</div>
                <div className="text-slate-400">Program Types</div>
              </div>
              <div>
                <div className="text-4xl font-black">10K+</div>
                <div className="text-slate-400">Students Trained</div>
              </div>
              <div>
                <div className="text-4xl font-black">$5M+</div>
                <div className="text-slate-400">Funding Accessed</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
                Powerful Provider Tools
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Everything you need to manage your training programs, students, and business operations.
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
                    <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                      <IconComponent className="w-7 h-7 text-purple-600" />
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

        {/* Program Types */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
                Programs We Support
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                We partner with training providers across multiple industries and program types.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PROGRAM_TYPES.map((program) => (
                <div
                  key={program.name}
                  className="bg-white rounded-xl p-6 border border-slate-200 hover:border-purple-300 hover:shadow-md transition"
                >
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{program.name}</h3>
                  <p className="text-slate-600 text-sm">{program.examples}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6">
                  Why Partner With Us?
                </h2>
                <p className="text-lg text-slate-600 mb-8">
                  Join our network of training providers and gain access to students, funding, 
                  technology, and employer connections that help your programs thrive.
                </p>
                
                <div className="space-y-4">
                  {BENEFITS.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">{benefit}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  <Link
                    href="/partners/training-provider"
                    className="inline-flex items-center gap-2 text-purple-600 font-bold hover:text-purple-700"
                  >
                    Learn More About Partnership
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
              <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/images/business/training-classroom.jpg"
                  alt="Training Classroom"
                  fill
                  className="object-cover"
                  sizes="50vw"
                />
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-purple-600 to-indigo-700 text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-black mb-6">
              Ready to Grow Your Training Business?
            </h2>
            <p className="text-xl text-purple-100 mb-8">
              Join our network of training providers and start connecting with funded students today.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/apply/program-holder"
                className="inline-flex items-center gap-2 bg-white text-purple-600 px-8 py-4 rounded-xl font-bold hover:bg-purple-50 transition"
              >
                Apply to Partner
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-purple-500/30 text-white px-8 py-4 rounded-xl font-bold hover:bg-purple-500/40 transition border border-white/30"
              >
                Schedule a Demo
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
