
import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowLeft, ArrowRight, Clock, Calendar, Award } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Apply for Sanitation & Infection Control Apprenticeship | Elevate for Humanity',
  description: 'Apply for the 2Exclusive Sanitation & Infection Control Apprenticeship. 32-week program with paid OJT.',
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
              { label: 'Sanitation & Infection Control', href: '/programs/sanitation-infection-control' },
              { label: 'Apply' },
            ]}
            className="text-white/80 mb-4"
          />
          <span className="inline-block px-3 py-1 bg-brand-green-500 text-white text-sm font-semibold rounded-full mb-3">
            DOL REGISTERED APPRENTICESHIP
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-white">Apply for Sanitation & Infection Control Apprenticeship</h1>
          <p className="text-white/90 mt-2">2Exclusive Apprenticeship Program - 32 Weeks with Paid OJT</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Program Quick Facts */}
        <div className="bg-slate-50 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Program Quick Facts</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-brand-blue-600" />
              <div>
                <p className="text-sm text-slate-600">Duration</p>
                <p className="font-bold text-slate-900">32 Weeks</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-brand-green-600" />
              <div>
                <p className="text-sm text-slate-600">Start Dates</p>
                <p className="font-bold text-slate-900">Quarterly</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6 text-purple-600" />
              <div>
                <p className="text-sm text-slate-600">Certifications</p>
                <p className="font-bold text-slate-900">4 Credentials</p>
              </div>
            </div>
          </div>
        </div>

        {/* Prerequisites */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Prerequisites</h2>
          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-brand-blue-600 font-bold">•</span>
                <span className="text-brand-blue-900">High school diploma or equivalent</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand-blue-600 font-bold">•</span>
                <span className="text-brand-blue-900">Willingness to learn infection control and sanitation procedures</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand-blue-600 font-bold">•</span>
                <span className="text-brand-blue-900">Ability to pass background check</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand-blue-600 font-bold">•</span>
                <span className="text-brand-blue-900">Prior janitorial or healthcare cleaning experience preferred (not required)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* What's Included */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">What's Included</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              '32 weeks of comprehensive training',
              '12 weeks of paid on-the-job training',
              'OSHA 10/30 certification',
              'Infection control certification',
              'Hazardous waste management certification',
              'Holistic wellness cleaning certification',
              'Hands-on experience in real facilities',
              'Job placement assistance',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-brand-green-50 p-3 rounded-lg">
                <span className="text-brand-green-600 font-bold">•</span>
                <span className="text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Application Deadlines */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Application Deadlines</h2>
          <div className="bg-slate-50 rounded-xl p-6">
            <p className="text-slate-700 mb-4">New cohorts start every quarter. Apply at least 30 days before your desired start date.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 text-center border border-slate-200">
                <p className="font-bold text-slate-900">January</p>
                <p className="text-sm text-slate-600">Q1 Start</p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center border border-slate-200">
                <p className="font-bold text-slate-900">April</p>
                <p className="text-sm text-slate-600">Q2 Start</p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center border border-slate-200">
                <p className="font-bold text-slate-900">July</p>
                <p className="text-sm text-slate-600">Q3 Start</p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center border border-slate-200">
                <p className="font-bold text-slate-900">October</p>
                <p className="text-sm text-slate-600">Q4 Start</p>
              </div>
            </div>
          </div>
        </div>

        {/* Two Options */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Option 1: Get More Information */}
          <div className="bg-slate-50 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-brand-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Get More Information</h3>
            <p className="text-slate-600 mb-6">
              Have questions? Submit an inquiry and we'll send you detailed program information.
            </p>
            <Link
              href="/inquiry?program=sanitation-infection-control"
              className="inline-flex items-center justify-center w-full px-6 py-4 bg-white text-brand-blue-600 font-bold rounded-full border-2 border-brand-blue-600 hover:bg-brand-blue-50 transition"
            >
              Request Information
            </Link>
          </div>

          {/* Option 2: Start Enrollment */}
          <div className="bg-gradient-to-br from-brand-green-600 to-brand-green-700 rounded-2xl p-8 text-center text-white">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowRight className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Ready to Enroll?</h3>
            <p className="text-brand-green-100 mb-6">
              Start your enrollment application now. We'll review your eligibility and contact you within 2-3 business days.
            </p>
            <Link
              href="/apply/student?program=sanitation-infection-control"
              className="inline-flex items-center justify-center w-full px-6 py-4 bg-white text-brand-green-700 font-bold rounded-full hover:bg-brand-green-50 transition"
            >
              Start Enrollment
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-slate-900 text-white rounded-xl p-6 text-center">
          <p className="mb-2">Questions about the program?</p>
          <p className="text-lg">
            Call <a href="/support" className="text-brand-green-400 font-bold hover:underline">(317) 314-3757</a> or email{' '}
            <a href="/contact" className="text-brand-green-400 font-bold hover:underline">Contact Us</a>
          </p>
        </div>

        {/* Back Link */}
        <div className="mt-8">
          <Link
            href="/programs/sanitation-infection-control"
            className="inline-flex items-center text-brand-blue-600 hover:text-brand-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Program Details
          </Link>
        </div>
      </div>
    </main>
  );
}
