import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Tax Preparer Training | Admin | Elevate For Humanity',
  description: 'Manage tax preparer training and certifications.',
};

export default async function TaxPreparerTrainingPage() {
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/admin/tax-filing"
            className="text-brand-blue-600 hover:text-brand-blue-800 mb-4 inline-block"
          >
            ← Back to Tax Filing
          </Link>
          <h1 className="text-3xl font-bold text-black">
            Tax Preparer Training
          </h1>
          <p className="mt-2 text-black">
            Manage VITA certification training and continuing education.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-brand-blue-600">0</div>
            <div className="text-black text-sm">Trainees</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-brand-green-600">0</div>
            <div className="text-black text-sm">Certified</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-brand-orange-600">0</div>
            <div className="text-black text-sm">In Progress</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-black">
              VITA Certification Training
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-black mb-2">
                  Basic Certification
                </h3>
                <p className="text-sm text-black mb-3">
                  Complete IRS VITA training and pass certification test
                </p>
                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-brand-blue-600 text-white rounded-md hover:bg-brand-blue-700 text-sm" aria-label="Action button">
                    Start Training
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-md text-black hover:bg-gray-50 text-sm" aria-label="Action button">
                    View Materials
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-black mb-2">
                  Advanced Certification
                </h3>
                <p className="text-sm text-black mb-3">
                  Advanced tax scenarios and complex returns
                </p>
                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-brand-blue-600 text-white rounded-md hover:bg-brand-blue-700 text-sm" aria-label="Action button">
                    Start Training
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-md text-black hover:bg-gray-50 text-sm" aria-label="Action button">
                    View Materials
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-black mb-2">
                  Quality Review Training
                </h3>
                <p className="text-sm text-black mb-3">
                  Learn to review and approve tax returns
                </p>
                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-brand-blue-600 text-white rounded-md hover:bg-brand-blue-700 text-sm" aria-label="Action button">
                    Start Training
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-md text-black hover:bg-gray-50 text-sm" aria-label="Action button">
                    View Materials
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-brand-blue-900 mb-2">
            Training Resources
          </h3>
          <ul className="space-y-2 text-brand-blue-800">
            <li>• IRS VITA Training Materials</li>
            <li>• Practice Tax Scenarios</li>
            <li>• Certification Tests</li>
            <li>• Continuing Education Courses</li>
            <li>• Quality Review Guidelines</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
