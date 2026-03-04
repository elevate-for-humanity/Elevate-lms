import Image from 'next/image';
import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cash Advance Settings | Admin | Elevate For Humanity',
  description: 'Configure cash advance program settings.',
};

export default async function CashAdvanceSettingsPage() {
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
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/pages/admin-cash-advances-settings-hero.jpg" alt="Cash advance settings" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/admin/cash-advances"
            className="text-brand-blue-600 hover:text-brand-blue-800 mb-4 inline-block"
          >
            ← Back to Cash Advances
          </Link>
          <h1 className="text-3xl font-bold text-black">
            Cash Advance Settings
          </h1>
          <p className="mt-2 text-black">
            Configure cash advance program parameters and limits.
          </p>
        </div>

        {/* Settings Form */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-black">
              Program Settings
            </h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Maximum Amount */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Maximum Advance Amount
              </label>
              <div className="flex items-center gap-2">
                <span className="text-black">$</span>
                <input
                  type="number"
                  defaultValue="6000"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-brand-blue-500 focus:ring-brand-blue-500"
                />
              </div>
              <p className="mt-1 text-sm text-black">
                Maximum amount a student can request
              </p>
            </div>

            {/* Minimum Amount */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Minimum Advance Amount
              </label>
              <div className="flex items-center gap-2">
                <span className="text-black">$</span>
                <input
                  type="number"
                  defaultValue="100"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-brand-blue-500 focus:ring-brand-blue-500"
                />
              </div>
            </div>

            {/* Processing Fee */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Processing Fee (%)
              </label>
              <input
                type="number"
                step="0.1"
                defaultValue="2.5"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-blue-500 focus:ring-brand-blue-500"
              />
            </div>

            {/* Au Threshold */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Au Threshold
              </label>
              <div className="flex items-center gap-2">
                <span className="text-black">$</span>
                <input
                  type="number"
                  defaultValue="500"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-brand-blue-500 focus:ring-brand-blue-500"
                />
              </div>
              <p className="mt-1 text-sm text-black">
                Requests below this amount are au
              </p>
            </div>

            {/* Enable/Disable Program */}
            <div className="flex items-center justify-between py-4 border-t border-gray-200">
              <div>
                <h3 className="text-sm font-medium text-black">
                  Enable Cash Advance Program
                </h3>
                <p className="text-sm text-black">
                  Allow students to request cash advances
                </p>
              </div>
              <button
                type="button"
                className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-brand-green-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:ring-offset-2"
              >
                <span className="translate-x-5 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
              </button>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
              <button className="px-4 py-2 border border-gray-300 rounded-md text-black hover:bg-gray-50" aria-label="Action button">
                Cancel
              </button>
              <button className="px-4 py-2 bg-brand-blue-600 text-white rounded-md hover:bg-brand-blue-700" aria-label="Action button">
                Save Settings
              </button>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="mt-6 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-black">
              Notification Settings
            </h2>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-black">
                  Email Notifications
                </h3>
                <p className="text-sm text-black">
                  Send email when request is submitted
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 text-brand-blue-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-black">
                  SMS Notifications
                </h3>
                <p className="text-sm text-black">
                  Send SMS for status updates
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 text-brand-blue-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-black">
                  Admin Alerts
                </h3>
                <p className="text-sm text-black">
                  Alert admins of new requests
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 text-brand-blue-600 rounded"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
