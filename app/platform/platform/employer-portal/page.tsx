import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { 
  Users, 
  Briefcase, 
  Search, 
  FileText, 
  TrendingUp,
  CheckCircle,
  Calendar,
  MessageSquare,
  Award,
  Building,
  DollarSign,
  ChevronRight
} from 'lucide-react';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/platform/employer-portal',
  },
  title: 'Employer Portal | Elevate For Humanity',
  description: 'Access qualified candidates, post jobs, manage apprenticeships, and connect with workforce-ready graduates through our employer portal.',
};

const PORTAL_FEATURES = [
  {
    icon: Search,
    title: 'Candidate Search',
    description: 'Search our database of qualified, trained candidates filtered by skills, certifications, location, and availability.',
  },
  {
    icon: Briefcase,
    title: 'Job Posting',
    description: 'Post job openings directly to our platform and reach thousands of job-ready graduates actively seeking employment.',
  },
  {
    icon: Users,
    title: 'Apprenticeship Management',
    description: 'Host apprentices, track their progress, provide feedback, and convert top performers to full-time employees.',
  },
  {
    icon: FileText,
    title: 'Application Tracking',
    description: 'Review applications, schedule interviews, and manage your hiring pipeline all in one centralized dashboard.',
  },
  {
    icon: TrendingUp,
    title: 'Analytics & Reports',
    description: 'Track hiring metrics, time-to-fill, candidate quality scores, and ROI on your workforce development investment.',
  },
  {
    icon: DollarSign,
    title: 'Funding Programs',
    description: 'Access OJT reimbursements, tax credits, and workforce development grants to offset training and hiring costs.',
  },
];

const BENEFITS = [
  'Pre-screened, trained candidates ready to work',
  'Reduced time-to-hire with qualified talent pool',
  'OJT wage reimbursements up to 75%',
  'Tax credits for hiring eligible workers',
  'Ongoing support and retention assistance',
  'Custom training programs for your needs',
];

export default function EmployerPortalPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('/images/patterns/grid.svg')] opacity-5" />
          <div className="max-w-7xl mx-auto px-4 py-20 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-blue-500/20 backdrop-blur px-4 py-2 rounded-full text-sm font-medium text-blue-300 mb-6">
                  <Building className="w-4 h-4" />
                  <span>For Employers</span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
                  Employer Portal
                </h1>
                <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                  Connect with workforce-ready graduates, post jobs, manage apprenticeships, 
                  and access funding programs—all from one powerful employer dashboard.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/employer/dashboard"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg"
                  >
                    Access Portal
                  </Link>
                  <Link
                    href="/employers/post-job"
                    className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition border border-white/20"
                  >
                    Post a Job
                  </Link>
                </div>
              </div>
              <div className="relative hidden lg:block">
                <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="/images/heroes/employer-dashboard.jpg"
                    alt="Employer Portal Dashboard"
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
        <section className="bg-blue-600 text-white py-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-black">500+</div>
                <div className="text-blue-100">Employer Partners</div>
              </div>
              <div>
                <div className="text-4xl font-black">85%</div>
                <div className="text-blue-100">Placement Rate</div>
              </div>
              <div>
                <div className="text-4xl font-black">75%</div>
                <div className="text-blue-100">OJT Reimbursement</div>
              </div>
              <div>
                <div className="text-4xl font-black">90%</div>
                <div className="text-blue-100">Retention Rate</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
                Powerful Hiring Tools
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Everything you need to find, hire, and retain qualified talent for your organization.
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

        {/* Benefits Section */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/images/business/team-meeting.jpg"
                  alt="Employer Benefits"
                  fill
                  className="object-cover"
                  sizes="50vw"
                />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6">
                  Why Partner With Us?
                </h2>
                <p className="text-lg text-slate-600 mb-8">
                  We provide more than just candidates. Our comprehensive workforce solutions 
                  help you build a skilled, reliable team while reducing hiring costs.
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
                    href="/employers"
                    className="inline-flex items-center gap-2 text-blue-600 font-bold hover:text-blue-700"
                  >
                    Learn More About Employer Benefits
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
                How It Works
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Get started in minutes and begin connecting with qualified candidates today.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                { step: '1', title: 'Create Account', description: 'Sign up for free and complete your company profile' },
                { step: '2', title: 'Post Jobs', description: 'Create job listings with your requirements and preferences' },
                { step: '3', title: 'Review Candidates', description: 'Browse applications and schedule interviews' },
                { step: '4', title: 'Hire & Train', description: 'Make offers and access OJT funding programs' },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-black mb-6">
              Ready to Find Your Next Great Hire?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join hundreds of employers who trust us to connect them with qualified, trained candidates.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/employer/register"
                className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-blue-50 transition"
              >
                Create Employer Account
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-blue-500/30 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-500/40 transition border border-white/30"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
