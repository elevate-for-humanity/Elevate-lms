import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  Briefcase, Users, Search, FileText, CheckCircle, ArrowRight,
  DollarSign, Award, BarChart, Calendar,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Employer Portal | Elevate For Humanity',
  description: 'Connect with skilled, job-ready candidates from our training programs. Post jobs, manage apprentices, and access tax credits.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/platform/employer-portal' },
  openGraph: {
    title: 'Employer Portal | Elevate For Humanity',
    description: 'Connect with skilled, job-ready candidates from our training programs.',
    url: 'https://www.elevateforhumanity.org/platform/employer-portal',
    siteName: 'Elevate for Humanity',
    images: [{ url: '/hero-images/employer-hero.jpg', width: 1200, height: 630, alt: 'Employer Portal' }],
    type: 'website',
  },
};

const features = [
  { icon: Search, title: 'Talent Search', description: 'Search our database of certified, job-ready candidates filtered by skills, location, and availability.' },
  { icon: Users, title: 'Candidate Profiles', description: 'View detailed profiles with certifications, training history, skills assessments, and references.' },
  { icon: FileText, title: 'Job Postings', description: 'Post positions directly to our talent pool and receive matched candidate applications.' },
  { icon: Calendar, title: 'Hiring Events', description: 'Host virtual and in-person hiring events with pre-screened candidates.' },
  { icon: DollarSign, title: 'Tax Credits (WOTC)', description: 'Access Work Opportunity Tax Credits when hiring from eligible populations.' },
  { icon: BarChart, title: 'Hiring Analytics', description: 'Track your hiring pipeline, time-to-fill, and retention metrics.' },
];

const howItWorks = [
  { step: '1', title: 'Create Account', description: 'Register your company and set up your employer profile.' },
  { step: '2', title: 'Post Positions', description: 'List open positions with required skills and qualifications.' },
  { step: '3', title: 'Review Candidates', description: 'Browse matched candidates or receive applications from our talent pool.' },
  { step: '4', title: 'Hire & Onboard', description: 'Make offers, complete paperwork, and access tax credit documentation.' },
];

const stats = [
  { value: '500+', label: 'Employer Partners' },
  { value: '3,200+', label: 'Placements Made' },
  { value: '85%', label: '6-Month Retention' },
  { value: '$9,600', label: 'Avg WOTC Credit' },
];

export default function EmployerPortalPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Platform', href: '/platform' }, { label: 'Employer Portal' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative min-h-[450px] flex items-center overflow-hidden">
        <Image src="/hero-images/employer-hero.jpg" alt="Employer Portal" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-orange-900/70" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 w-full">
          <span className="text-orange-200 font-medium text-sm uppercase tracking-wider">Platform Solutions</span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 mt-2">Employer Portal</h1>
          <p className="text-xl text-orange-100 max-w-2xl mb-8">
            Hire skilled, certified candidates ready to work. Access tax credits and streamline your hiring pipeline.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/employer/register" className="px-8 py-4 bg-white text-orange-700 font-bold rounded-lg hover:bg-orange-50 transition">
              Create Employer Account
            </Link>
            <Link href="/employer/login" className="px-8 py-4 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-400 transition">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-orange-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-orange-700">{s.value}</p>
                <p className="text-gray-600 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Portal Features</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to find, hire, and retain skilled workers from our training programs.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600">Start hiring job-ready candidates in four steps.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {howItWorks.map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 bg-orange-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Why Hire Through Elevate</h2>
              <div className="space-y-4">
                {[
                  'Pre-screened, certified candidates with verified skills',
                  'Access to WOTC tax credits (up to $9,600 per hire)',
                  'On-the-job training support and mentorship programs',
                  'Retention support to reduce turnover costs',
                  'Compliance documentation for workforce funding programs',
                  'Dedicated employer success manager',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl">
              <Image src="/images/business/handshake-1.jpg" alt="Employer partnership" fill className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-orange-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Start Hiring Today</h2>
          <p className="text-orange-100 text-lg mb-8">Create your free employer account and connect with qualified candidates.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/employer/register" className="px-8 py-4 bg-white text-orange-700 font-bold rounded-lg hover:bg-orange-50 transition inline-flex items-center gap-2">
              Create Account <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/contact" className="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
