import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Supersonic Fast Cash Diy Interview | Elevate For Humanity',
  description: 'Elevate For Humanity - Supersonic Fast Cash Diy Interview page',
};

import Link from 'next/link';

export default async function DIYInterviewPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Fetch interview questions
  const { data: questions } = await supabase
    .from('tax_interview_questions')
    .select('*')
    .order('order_index');
  return (
    <div className="min-h-screen bg-gray-50 py-16">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Interview" }]} />
      </div>
<div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl font-bold mb-6">DIY Tax Interview</h1>
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Tax Filing Interview</h2>
              <span className="text-sm text-black">Step 1 of 5</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
              <div className="bg-orange-600 h-2 rounded-full" style={{width: '20%'}}></div>
            </div>
          </div>

          <form className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Social Security Number *
                  </label>
                  <input
                    type="text"
                    placeholder="XXX-XX-XXXX"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Filing Status</h3>
              <div className="space-y-2">
                <label className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="radio" name="filing_status" value="single" className="mr-3" />
                  <span>Single</span>
                </label>
                <label className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="radio" name="filing_status" value="married_joint" className="mr-3" />
                  <span>Married Filing Jointly</span>
                </label>
                <label className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="radio" name="filing_status" value="married_separate" className="mr-3" />
                  <span>Married Filing Separately</span>
                </label>
                <label className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="radio" name="filing_status" value="head_of_household" className="mr-3" />
                  <span>Head of Household</span>
                </label>
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t">
              <Link
                href="/supersonic-fast-cash/diy/start"
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
              >
                Back
              </Link>
              <button
                type="submit"
                className="px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors"
              >
                Continue
              </button>
            </div>
          </form>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-black">
              <strong>Need help?</strong> Our tax professionals are available to assist you.{' '}
              <Link href="/supersonic-fast-cash/book-appointment" className="text-blue-600 hover:underline">
                Book an appointment
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
