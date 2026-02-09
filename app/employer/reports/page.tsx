export const dynamic = 'force-dynamic';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';


export const metadata: Metadata = {
  title: 'Reports | Elevate for Humanity',
  description: 'Employer reports and analytics',
};

export default async function EmployerReportsPage() {
  let user = null;

  try {
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
    const { data: authData } = await supabase.auth.getUser();
    user = authData.user;
  } catch (error) { /* Error handled silently */ }

  return (
    <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Employer", href: "/employer" }, { label: "Reports" }]} />
      </div>
<h1 className="text-3xl font-bold mb-6">Reports & Analytics</h1>
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <p className="text-black mb-6">
          View hiring metrics and workforce analytics.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">0</div>
            <div className="text-sm text-black">Active Postings</div>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">0</div>
            <div className="text-sm text-black">Applications</div>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">0</div>
            <div className="text-sm text-black">Hires</div>
          </div>
        </div>
        
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Hiring Pipeline</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-black">New Applications</span>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-black">Under Review</span>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-black">Interviews Scheduled</span>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-black">Offers Extended</span>
                <span className="font-semibold">0</span>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Time to Hire</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-black">Average Days</span>
                <span className="font-semibold">-</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-black">Fastest Hire</span>
                <span className="font-semibold">-</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-black">Application Response Rate</span>
                <span className="font-semibold">-</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-black">Interview Show Rate</span>
                <span className="font-semibold">-</span>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Candidate Sources</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-black">Direct Applications</span>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-black">Referrals</span>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-black">Training Programs</span>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-black">Job Boards</span>
                <span className="font-semibold">0</span>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Retention Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-black">30-Day Retention</span>
                <span className="font-semibold">-</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-black">90-Day Retention</span>
                <span className="font-semibold">-</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-black">1-Year Retention</span>
                <span className="font-semibold">-</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-black">Avg. Tenure</span>
                <span className="font-semibold">-</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700" aria-label="Action button">
            Export Report
          </button>
          <button className="border border-slate-300 px-6 py-2 rounded-lg hover:bg-slate-50" aria-label="Action button">
            Schedule Report
          </button>
        </div>
      </div>
    </div>
  );
}
