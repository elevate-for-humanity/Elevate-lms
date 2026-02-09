import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowLeft, CheckCircle, Clock, DollarSign, Calendar, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Apply for HVAC Technician | Free Funded Training | Elevate for Humanity',
  description: 'Apply for free HVAC Technician training through Indiana Career Connect. 100% funded for eligible participants.',
};

export default function ApplyPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Banner */}
      <section className="relative h-[40vh] min-h-[300px] max-h-[400px]">
        <Image
          src="/images/hvac/hvac-hero.jpg"
          alt="HVAC Technician Training"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-4xl mx-auto px-6 pb-8 w-full">
            <Breadcrumbs
              items={[
                { label: 'Programs', href: '/programs' },
                { label: 'HVAC Technician', href: '/programs/hvac' },
                { label: 'Apply' },
              ]}
              className="text-white/80 mb-4"
            />
            <span className="inline-block px-3 py-1 bg-green-500 text-white text-sm font-semibold rounded-full mb-3">
              FREE FUNDED PROGRAM
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Apply for HVAC Technician Training</h1>
            <p className="text-white/90 mt-2">100% funded through Indiana Career Connect for eligible participants</p>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Program Quick Facts */}
        <div className="bg-slate-50 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Program Quick Facts</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-sm text-slate-600">Cost</p>
                <p className="font-bold text-slate-900">$0*</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm text-slate-600">Duration</p>
                <p className="font-bold text-slate-900">12-16 Weeks</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-orange-600" />
              <div>
                <p className="text-sm text-slate-600">Start Date</p>
                <p className="font-bold text-slate-900">Rolling</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-purple-600" />
              <div>
                <p className="text-sm text-slate-600">Format</p>
                <p className="font-bold text-slate-900">Hybrid</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4">*For eligible participants through WRG/Indiana Career Connect funding</p>
        </div>

        {/* What's Included */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">What's Included (Free for Eligible Participants)</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              'Full HVAC technician training curriculum',
              'Online coursework access',
              'Hands-on lab training',
              'EPA 608 certification exam & fees',
              'OSHA 10 safety certification',
              'Books and training materials',
              'Paid OJT/internship placement',
              'Job placement assistance',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-green-50 p-3 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Eligibility */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Eligibility Requirements</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <p className="text-blue-800 mb-4">You may qualify for free training if you meet these criteria:</p>
            <ul className="space-y-2">
              {[
                'Indiana resident',
                '18 years or older',
                'High school diploma or GED (or enrolled)',
                'Unemployed, underemployed, or seeking career change',
                'Meet income guidelines OR receive public assistance',
              ].map((req, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-blue-900">{req}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-blue-700 mt-4">
              Additional qualifying factors: Veterans, single parents, individuals with disabilities, 
              foster youth, justice-involved individuals
            </p>
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
              href="/inquiry?program=hvac"
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
            <h3 className="text-xl font-bold mb-2">Ready to Enroll?</h3>
            <p className="text-green-100 mb-6">
              Start your enrollment application now. We'll check your eligibility for free funding.
            </p>
            <Link
              href="/apply/student?program=hvac"
              className="inline-flex items-center justify-center w-full px-6 py-4 bg-white text-green-700 font-bold rounded-full hover:bg-green-50 transition"
            >
              Start Enrollment
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <p className="text-blue-800">
            <strong>100% Free</strong> for eligible participants through Indiana Career Connect / WRG funding.
            We'll verify your eligibility during the enrollment process.
          </p>
        </div>

        {/* Back Link */}
        <div className="mt-8">
          <Link
            href="/programs/hvac"
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
