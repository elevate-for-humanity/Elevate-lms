
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  GraduationCap, DollarSign, Users, BarChart, ArrowRight,
  Shield, Globe,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Training Provider Solutions | Elevate For Humanity',
  description: 'Grow your training business with our LMS and student management platform. Access funded learners, automate compliance, and track outcomes.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/platform/training-providers' },
  openGraph: {
    title: 'Training Provider Solutions | Elevate For Humanity',
    description: 'Grow your training business with our LMS and student management platform.',
    url: 'https://www.elevateforhumanity.org/platform/training-providers',
    siteName: 'Elevate for Humanity',
    images: [{ url: '/hero-images/programs-hero.jpg', width: 1200, height: 630, alt: 'Training Provider Solutions' }],
    type: 'website',
  },
};

const benefits = [
  { icon: Users, title: 'Reach More Students', description: 'Access our network of funded learners through WIOA, SNAP E&T, and other workforce programs.' },
  { icon: DollarSign, title: 'Streamlined Payments', description: 'Get paid faster with automated billing, invoicing, and funding reconciliation.' },
  { icon: GraduationCap, title: 'LMS Platform', description: 'Deliver courses online with built-in video, quizzes, assignments, and progress tracking.' },
  { icon: BarChart, title: 'Track Outcomes', description: 'Measure and report student success with real-time analytics and DOL-ready reports.' },
  { icon: Shield, title: 'Compliance Built-In', description: 'Automated WIOA, FERPA, and ADA compliance documentation and audit trails.' },
  { icon: Globe, title: 'ETPL Integration', description: 'Manage your Eligible Training Provider List status and program approvals.' },
];

const howItWorks = [
  { step: '1', title: 'Apply to Join', description: 'Submit your organization details and program catalog for review.' },
  { step: '2', title: 'Onboard Your Programs', description: 'We help you set up courses, pricing, and compliance documentation.' },
  { step: '3', title: 'Receive Referrals', description: 'Funded learners are matched to your programs through workforce partners.' },
  { step: '4', title: 'Deliver & Report', description: 'Teach using our LMS and let the platform handle outcome reporting.' },
];

const stats = [
  { value: '200+', label: 'Training Providers' },
  { value: '15,000+', label: 'Students Served' },
  { value: '92%', label: 'Completion Rate' },
  { value: '$2.4M', label: 'Funding Processed' },
];

export default function TrainingProvidersPage() {

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Platform', href: '/platform' }, { label: 'Training Providers' }]} />
        </div>
      </div>
      <div class="max-w-6xl mx-auto px-4 pb-2"><p class="text-sm text-slate-600 font-medium">Part of the <a href="/platform" class="text-brand-red-600 hover:underline">Elevate Workforce Operating System</a></p></div>

      {/* Hero */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <Image src="/hero-images/programs-hero.jpg" alt="Training Provider Solutions" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">For Training Providers</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">Grow your training business, reach funded learners, and let the platform handle compliance and reporting.</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-teal-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-teal-700">{s.value}</p>
                <p className="text-gray-600 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Partner With Us</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to run funded training programs, from enrollment to employment outcomes.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((b, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition flex items-start gap-4">
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <b.icon className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">{b.title}</h3>
                  <p className="text-gray-600 text-sm">{b.description}</p>
                </div>
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
            <p className="text-lg text-gray-600">Four steps to start receiving funded students.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {howItWorks.map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 bg-teal-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">What You Get as a Provider</h2>
              <div className="space-y-4">
                {[
                  'Branded course pages with your logo and content',
                  'Student enrollment and progress tracking dashboard',
                  'Automated attendance and hours verification',
                  'Built-in compliance documentation (WIOA, FERPA)',
                  'Direct payment processing and funding reconciliation',
                  'Outcome tracking and DOL-ready reporting',
                  'Marketing exposure to funded learner network',
                  'Dedicated partner success manager',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl">
              <Image src="/images/artlist/hero-training-6.jpg" alt="Training provider partnership" fill sizes="100vw" className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-teal-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Grow Your Training Business?</h2>
          <p className="text-teal-100 text-lg mb-8">Join our provider network and start receiving funded students.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/partners/join" className="px-8 py-4 bg-white text-teal-700 font-bold rounded-lg hover:bg-teal-50 transition inline-flex items-center gap-2">
              Apply Now <ArrowRight className="w-5 h-5" />
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
