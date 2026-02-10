import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowLeft, ArrowRight, Clock, Award, DollarSign } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Apply for Building Services Technician Apprenticeship | Elevate for Humanity',
  description: 'Apply for the Building Services Technician Apprenticeship. 6000-hour DOL registered program with paid OJT.',
};

export default function ApplyPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Banner */}
      <section className="bg-slate-900 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <Breadcrumbs
            items={[
              { label: 'Programs', href: '/programs' },
              { label: 'Building Services Technician', href: '/programs/building-services-technician' },
              { label: 'Apply' },
            ]}
            className="text-white/80 mb-4"
          />
          <span className="inline-block px-3 py-1 bg-green-500 text-white text-sm font-semibold rounded-full mb-3">
            DOL REGISTERED APPRENTICESHIP
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-white">Apply for Building Services Technician</h1>
          <p className="text-white/90 mt-2">6,000-Hour Program with Paid On-the-Job Training</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Program Quick Facts */}
        <div className="bg-slate-50 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Program Quick Facts</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm text-slate-600">Duration</p>
                <p className="font-bold text-slate-900">6,000 Hours (~3 years)</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-sm text-slate-600">Journeyworker Wage</p>
                <p className="font-bold text-slate-900">~$19/hour</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6 text-purple-600" />
              <div>
                <p className="text-sm text-slate-600">Credential</p>
                <p className="font-bold text-slate-900">DOL Certificate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Requirements</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span className="text-blue-900">18 years or older</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span className="text-blue-900">High school diploma or GED</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span className="text-blue-900">Valid driver's license (preferred)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span className="text-blue-900">Able to pass background check</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span className="text-blue-900">Physically able to work at heights and perform demanding tasks</span>
              </li>
            </ul>
          </div>
        </div>

        {/* What's Included */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">What's Included</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              'Paid on-the-job training from day one',
              'DOL Journeyworker Certificate',
              'OSHA 10/30 Safety Certification',
              'Multi-story window cleaning training',
              'Building maintenance skills',
              'Facility management experience',
              'Progressive wage increases',
              'Career advancement opportunities',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-green-50 p-3 rounded-lg">
                <span className="text-green-600 font-bold">✓</span>
                <span className="text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Two Options */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Option 1: Get More Information */}
          <div className="bg-slate-50 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Get More Information</h3>
            <p className="text-slate-600 mb-6">
              Have questions? Submit an inquiry and we'll send you detailed program information.
            </p>
            <Link
              href="/inquiry?program=building-services-technician"
              className="inline-flex items-center justify-center w-full px-6 py-4 bg-white text-blue-600 font-bold rounded-full border-2 border-blue-600 hover:bg-blue-50 transition"
            >
              Request Information
            </Link>
          </div>

          {/* Option 2: Start Enrollment */}
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-8 text-center text-white">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowRight className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Ready to Apply?</h3>
            <p className="text-green-100 mb-6">
              Start your application now. We'll review your eligibility and contact you within 2-3 business days.
            </p>
            <Link
              href="/apply/student?program=building-services-technician"
              className="inline-flex items-center justify-center w-full px-6 py-4 bg-white text-green-700 font-bold rounded-full hover:bg-green-50 transition"
            >
              Start Application
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-slate-900 text-white rounded-xl p-6 text-center">
          <p className="mb-2">Questions about the program?</p>
          <p className="text-lg">
            Call <a href="tel:317-314-3757" className="text-green-400 font-bold hover:underline">(317) 314-3757</a> or email{' '}
            <a href="mailto:elevate4humanityedu@gmail.com" className="text-green-400 font-bold hover:underline">elevate4humanityedu@gmail.com</a>
          </p>
        </div>

        {/* Back Link */}
        <div className="mt-8">
          <Link
            href="/programs/building-services-technician"
            className="inline-flex items-center text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Program Details
          </Link>
        </div>
      </div>
    </main>
  );
}
