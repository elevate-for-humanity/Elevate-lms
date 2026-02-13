import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Supersonic Fast Cash Diy Start | Elevate For Humanity',
  description: 'Elevate For Humanity - Supersonic Fast Cash Diy Start page',
};

import Link from 'next/link';

export default async function DIYStartPage() {
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
  
  // Fetch DIY tax info
  const { data: diyInfo } = await supabase
    .from('tax_services')
    .select('*')
    .eq('type', 'diy')
    .single();
  return (
    <div className="min-h-screen bg-gray-50 py-16">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Start" }]} />
      </div>
<div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl font-bold mb-6">Start Your DIY Tax Return</h1>
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-bold mb-6">Let's Get Started</h2>
          
          <div className="space-y-6 mb-8">
            <div className="border-l-4 border-orange-600 pl-4">
              <h3 className="font-semibold text-lg mb-2">Step 1: Gather Your Documents</h3>
              <ul className="list-disc list-inside text-black space-y-1">
                <li>W-2 forms from all employers</li>
                <li>1099 forms (if self-employed or freelance)</li>
                <li>Social Security card or ITIN</li>
                <li>Photo ID (driver's license or state ID)</li>
                <li>Bank account information for direct deposit</li>
              </ul>
            </div>

            <div className="border-l-4 border-orange-600 pl-4">
              <h3 className="font-semibold text-lg mb-2">Step 2: Choose Your Filing Method</h3>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">DIY Online</h4>
                  <p className="text-sm text-black mb-3">File yourself with our guided software</p>
                  <Link
                    href="/supersonic-fast-cash/diy/interview"
                    className="inline-block bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded text-sm font-semibold transition-colors"
                  >
                    Start Filing
                  </Link>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Professional Help</h4>
                  <p className="text-sm text-black mb-3">Work with a tax professional</p>
                  <Link
                    href="/supersonic-fast-cash/book-appointment"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold transition-colors"
                  >
                    Book Appointment
                  </Link>
                </div>
              </div>
            </div>

            <div className="border-l-4 border-orange-600 pl-4">
              <h3 className="font-semibold text-lg mb-2">Step 3: Review & Submit</h3>
              <p className="text-black">
                We'll review your return for accuracy and help you get the maximum refund you deserve.
              </p>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <h3 className="font-semibold mb-2">Need Help?</h3>
            <p className="text-black mb-4">
              Our tax professionals are available to answer questions and help you file.
            </p>
            <Link
              href="/contact"
              className="inline-block text-orange-600 hover:text-orange-700 font-semibold"
            >
              Contact Support →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
