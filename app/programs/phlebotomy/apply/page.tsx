import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowLeft, CheckCircle, Clock, DollarSign, Calendar } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Apply for Phlebotomy | Elevate for Humanity',
  description: 'Apply for our Phlebotomy program. Free training with WIOA funding available.',
};

export default function ApplyPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="bg-blue-900 text-white py-8">
        <div className="max-w-4xl mx-auto px-6">
          <Breadcrumbs
            items={[
              { label: 'Programs', href: '/programs' },
              { label: 'Phlebotomy', href: '/programs/phlebotomy' },
              { label: 'Apply' },
            ]}
            className="text-blue-200 mb-4"
          />
          <h1 className="text-3xl md:text-4xl font-bold">Apply for Phlebotomy</h1>
          <p className="text-blue-100 mt-2">Start your career training today</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-gray-50 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold text-black mb-4">Program Overview</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="font-semibold text-black">Varies</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Cost</p>
                <p className="font-semibold text-black">Free with WIOA</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Next Start</p>
                <p className="font-semibold text-black">Rolling Enrollment</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-black mb-4">Eligibility Requirements</h2>
          <ul className="space-y-3">
            {[
              'Must be 18 years or older',
              'High school diploma or GED',
              'Indiana resident or authorized to work in US',
              'Meet WIOA eligibility requirements',
            ].map((req, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-black">{req}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-blue-50 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-black mb-4">Ready to Apply?</h2>
          <p className="text-gray-600 mb-6">
            Complete our online application to check your eligibility for free WIOA-funded training.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply?program=phlebotomy"
              className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
            >
              Start Application
            </Link>
            <Link
              href="/wioa-eligibility"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-bold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition"
            >
              Check WIOA Eligibility
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <Link
            href="/programs/phlebotomy"
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
