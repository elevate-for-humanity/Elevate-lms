import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Grant Intake | Admin | Elevate For Humanity',
  description: 'Submit new grant applications and manage intake process.',
};

export default async function GrantIntakePage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">

      {/* Hero Image */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/admin/grants"
            className="text-brand-blue-600 hover:text-brand-blue-800 mb-4 inline-block"
          >
            ← Back to Grants
          </Link>
          <h1 className="text-3xl font-bold text-black">Grant Intake</h1>
          <p className="mt-2 text-black">
            Submit new grant application and start the intake process.
          </p>
        </div>

        {/* Intake Form */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-black">
              New Grant Application
            </h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Grant Information */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Grant Name
              </label>
              <input
                type="text"
                placeholder="e.g., WIOA Youth Program Grant 2024"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-blue-500 focus:ring-brand-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Funding Agency
              </label>
              <input
                type="text"
                placeholder="e.g., Indiana Department of Workforce Development"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-blue-500 focus:ring-brand-blue-500"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Grant Amount
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-black">$</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-brand-blue-500 focus:ring-brand-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Grant Type
                </label>
                <select className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-blue-500 focus:ring-brand-blue-500">
                  <option value="">Select type</option>
                  <option value="wioa">WIOA</option>
                  <option value="wrg">WRG</option>
                  <option value="jri">Job Ready Indy (JRI)</option>
                  <option value="federal">Federal</option>
                  <option value="state">State</option>
                  <option value="private">Private Foundation</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Application Deadline
                </label>
                <input
                  type="date"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-blue-500 focus:ring-brand-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Grant Period
                </label>
                <select className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-blue-500 focus:ring-brand-blue-500">
                  <option value="">Select period</option>
                  <option value="1year">1 Year</option>
                  <option value="2year">2 Years</option>
                  <option value="3year">3 Years</option>
                  <option value="multi">Multi-Year</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Grant Description
              </label>
              <textarea
                rows={4}
                placeholder="Describe the grant purpose, requirements, and goals..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-blue-500 focus:ring-brand-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Target Population
              </label>
              <textarea
                rows={3}
                placeholder="Who will this grant serve? (e.g., Youth ages 16-24, Justice-involved individuals)"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-blue-500 focus:ring-brand-blue-500"
              />
            </div>

            {/* Required Documents */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Required Documents
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded text-brand-blue-600"
                  />
                  <span className="text-sm text-black">
                    Budget Narrative
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded text-brand-blue-600"
                  />
                  <span className="text-sm text-black">Program Plan</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded text-brand-blue-600"
                  />
                  <span className="text-sm text-black">
                    Letters of Support
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded text-brand-blue-600"
                  />
                  <span className="text-sm text-black">
                    Financial Statements
                  </span>
                </label>
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Upload Documents
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="text-black">
                    <p className="text-sm">Click to upload or drag and drop</p>
                    <p className="text-xs text-black mt-1">
                      PDF, DOC, DOCX up to 10MB
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
              <Link
                href="/admin/grants"
                className="px-4 py-2 border border-gray-300 rounded-md text-black hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700" aria-label="Action button">
                Save as Draft
              </button>
              <button className="px-4 py-2 bg-brand-blue-600 text-white rounded-md hover:bg-brand-blue-700" aria-label="Action button">
                Submit Application
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
