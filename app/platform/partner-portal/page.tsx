import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  Users, BarChart, FileText, Settings, CheckCircle, ArrowRight,
  GraduationCap, Shield, Clock, Globe,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Partner Portal | Elevate For Humanity',
  description: 'Manage students, track outcomes, and access reports through the partner portal. Tools for training providers, community organizations, and workforce partners.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/platform/partner-portal' },
  openGraph: {
    title: 'Partner Portal | Elevate For Humanity',
    description: 'Manage students, track outcomes, and access reports through the partner portal.',
    url: 'https://www.elevateforhumanity.org/platform/partner-portal',
    siteName: 'Elevate for Humanity',
    images: [{ url: '/hero-images/pathways-hero.jpg', width: 1200, height: 630, alt: 'Partner Portal' }],
    type: 'website',
  },
};

const features = [
  { icon: Users, title: 'Student Management', description: 'Enroll students, track progress, manage records, and communicate with learners.' },
  { icon: BarChart, title: 'Analytics Dashboard', description: 'Real-time performance metrics, completion rates, and outcome tracking.' },
  { icon: FileText, title: 'Reporting', description: 'Generate compliance reports, outcome summaries, and funding documentation.' },
  { icon: Settings, title: 'Program Settings', description: 'Configure your programs, courses, schedules, and enrollment requirements.' },
  { icon: GraduationCap, title: 'Course Delivery', description: 'Deliver training through the built-in LMS with video, quizzes, and assignments.' },
  { icon: Shield, title: 'Compliance Tools', description: 'Automated WIOA documentation, audit trails, and regulatory compliance.' },
];

const partnerTypes = [
  { title: 'Training Providers', description: 'Deliver courses and programs to funded learners.', href: '/platform/training-providers' },
  { title: 'Community Organizations', description: 'Refer participants and provide wraparound services.', href: '/partners/join' },
  { title: 'Workforce Boards', description: 'Manage regional workforce development programs.', href: '/platform/workforce-boards' },
  { title: 'Employers', description: 'Hire graduates and host apprentices.', href: '/platform/employer-portal' },
];

export default function PartnerPortalPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Platform', href: '/platform' }, { label: 'Partner Portal' }]} />
        </div>
      </div>
      <div class="max-w-6xl mx-auto px-4 pb-2"><p class="text-sm text-slate-600 font-medium">Part of the <a href="/platform" class="text-brand-red-600 hover:underline">Elevate Workforce Operating System</a></p></div>

      {/* Hero */}
      <section className="relative min-h-[450px] flex items-center overflow-hidden">
        <Image src="/hero-images/pathways-hero.jpg" alt="Partner Portal" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-brand-blue-900/70" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 w-full">
          <span className="text-brand-blue-200 font-medium text-sm uppercase tracking-wider">Platform Solutions</span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 mt-2">Partner Portal</h1>
          <p className="text-xl text-brand-blue-100 max-w-2xl mb-8">
            Everything you need to manage your training programs, track student outcomes, and stay compliant.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/partners/login" className="px-8 py-4 bg-white text-brand-blue-700 font-bold rounded-lg hover:bg-brand-blue-50 transition">
              Access Portal
            </Link>
            <Link href="/partners/join" className="px-8 py-4 bg-brand-blue-500 text-white font-bold rounded-lg hover:bg-brand-blue-400 transition">
              Become a Partner
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Portal Features</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A single platform to manage every aspect of your workforce training partnership.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition">
                <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-brand-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Types */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Who Uses the Partner Portal</h2>
            <p className="text-lg text-gray-600">Tailored experiences for every type of workforce partner.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {partnerTypes.map((p, i) => (
              <Link key={i} href={p.href} className="bg-white rounded-xl p-6 border hover:shadow-md transition flex items-start gap-4 group">
                <div className="w-10 h-10 bg-brand-blue-600 text-white rounded-lg flex items-center justify-center font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1 group-hover:text-brand-blue-600 transition">{p.title}</h3>
                  <p className="text-gray-600 text-sm">{p.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl">
              <Image src="/images/artlist/office-meeting.jpg" alt="Partner collaboration" fill sizes="100vw" className="object-cover" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">What Partners Get</h2>
              <div className="space-y-4">
                {[
                  'Dedicated partner dashboard with real-time metrics',
                  'Student enrollment and progress management tools',
                  'Automated compliance documentation and audit trails',
                  'Built-in LMS for course delivery and assessments',
                  'Funding reconciliation and payment tracking',
                  'Direct communication channel with students and staff',
                  'Custom branding for your program pages',
                  'Priority support from our partner success team',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-brand-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Become a Partner</h2>
          <p className="text-brand-blue-100 text-lg mb-8">Join our network of training providers and community organizations.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/partners/join" className="px-8 py-4 bg-white text-brand-blue-700 font-bold rounded-lg hover:bg-brand-blue-50 transition inline-flex items-center gap-2">
              Apply Now <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/partners/login" className="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition">
              Partner Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
