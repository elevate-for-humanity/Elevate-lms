import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { ArrowRight, CheckCircle, MessageSquare, FileText, HelpCircle, Briefcase, GraduationCap, DollarSign } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Get Started | Elevate For Humanity',
  description: 'Get immediate help with enrollment, programs, funding, and support — all self-service, no phone call needed.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/call-now',
  },
};

export default function GetStartedPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Get Started' }]} />
        </div>
      </div>

      <section className="bg-blue-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <MessageSquare className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-6">How Can We Help?</h1>
          <p className="text-xl text-blue-100 mb-8">Everything you need is available online — no phone call required. Choose what you need below.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Link href="/apply" className="bg-white rounded-xl p-8 shadow-sm border hover:border-blue-500 hover:shadow-md transition group">
              <GraduationCap className="w-10 h-10 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600">Enroll in a Program</h3>
              <p className="text-gray-600 mb-4">Apply online in minutes. Pick your program, check eligibility, and start training in as little as 2 weeks.</p>
              <span className="text-blue-600 font-semibold flex items-center gap-2">Apply Now <ArrowRight className="w-4 h-4" /></span>
            </Link>

            <Link href="/inquiry" className="bg-white rounded-xl p-8 shadow-sm border hover:border-blue-500 hover:shadow-md transition group">
              <HelpCircle className="w-10 h-10 text-green-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-600">Ask a Question</h3>
              <p className="text-gray-600 mb-4">Not sure which program is right for you? Submit an inquiry and get a personalized response within 24 hours.</p>
              <span className="text-green-600 font-semibold flex items-center gap-2">Get Info <ArrowRight className="w-4 h-4" /></span>
            </Link>

            <Link href="/wioa-eligibility" className="bg-white rounded-xl p-8 shadow-sm border hover:border-blue-500 hover:shadow-md transition group">
              <DollarSign className="w-10 h-10 text-orange-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600">Check Funding Eligibility</h3>
              <p className="text-gray-600 mb-4">See if you qualify for free training through WIOA, WRG, or JRI funding. Takes less than 2 minutes.</p>
              <span className="text-orange-600 font-semibold flex items-center gap-2">Check Eligibility <ArrowRight className="w-4 h-4" /></span>
            </Link>

            <Link href="/employer" className="bg-white rounded-xl p-8 shadow-sm border hover:border-blue-500 hover:shadow-md transition group">
              <Briefcase className="w-10 h-10 text-purple-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600">Employer Partnership</h3>
              <p className="text-gray-600 mb-4">Hire trained graduates, access tax credits, and post jobs. Set up your employer account online.</p>
              <span className="text-purple-600 font-semibold flex items-center gap-2">Partner With Us <ArrowRight className="w-4 h-4" /></span>
            </Link>

            <Link href="/faq" className="bg-white rounded-xl p-8 shadow-sm border hover:border-blue-500 hover:shadow-md transition group">
              <FileText className="w-10 h-10 text-teal-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-teal-600">FAQ & Help Center</h3>
              <p className="text-gray-600 mb-4">Find answers to common questions about enrollment, funding, programs, certificates, and more.</p>
              <span className="text-teal-600 font-semibold flex items-center gap-2">Browse FAQ <ArrowRight className="w-4 h-4" /></span>
            </Link>

            <Link href="/support" className="bg-white rounded-xl p-8 shadow-sm border hover:border-blue-500 hover:shadow-md transition group">
              <MessageSquare className="w-10 h-10 text-red-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-red-600">Technical Support</h3>
              <p className="text-gray-600 mb-4">Having trouble with your account, courses, or the platform? Submit a support ticket and get help fast.</p>
              <span className="text-red-600 font-semibold flex items-center gap-2">Get Support <ArrowRight className="w-4 h-4" /></span>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-8">Everything Is Self-Service</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              'Apply online in minutes',
              'Check eligibility instantly',
              'Get answers from our FAQ',
              'Submit inquiries 24/7',
              'Track your application status',
              'Enroll and start training',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 justify-center">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
