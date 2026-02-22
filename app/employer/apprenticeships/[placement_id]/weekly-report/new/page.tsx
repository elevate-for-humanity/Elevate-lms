
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Employer Apprenticeships Weekly Report New | Elevate For Humanity',
  description: 'Elevate For Humanity - Career training and workforce development',
};


import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { submitWeeklyReport } from './_actions/submit-weekly-report';

export default async function NewWeeklyReportPage({
  params,
}: {
  params: { placement_id: string };
}) {
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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'employer') {
    redirect('/unauthorized');
  }

  // Get placement and verify access
  const { data: placement } = await db
    .from('apprentice_placements')
    .select('id, student_id, shop_id, program_slug, shops(name)')
    .eq('id', params.placement_id)
    .single();

  if (!placement) {
    redirect('/employer/dashboard');
  }

  // Verify employer has access to this shop
  const { data: shopAccess } = await db
    .from('shop_staff')
    .select('shop_id')
    .eq('user_id', user.id)
    .eq('shop_id', placement.shop_id)
    .single();

  if (!shopAccess) {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            Submit Weekly Report
          </h1>
          <p className="text-black mb-2">
            Shop: {placement.shops?.name}
          </p>
          <p className="text-black mb-8">
            Program: {placement.program_slug}
          </p>

          <form action={submitWeeklyReport} className="space-y-6">
            <input type="hidden" name="placement_id" value={params.placement_id} />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="week_start" className="block text-sm font-semibold text-black mb-2">
                  Week Start Date *
                </label>
                <input
                  type="date"
                  id="week_start"
                  name="week_start"
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                />
              </div>

              <div>
                <label htmlFor="week_end" className="block text-sm font-semibold text-black mb-2">
                  Week End Date *
                </label>
                <input
                  type="date"
                  id="week_end"
                  name="week_end"
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="hours_ojt" className="block text-sm font-semibold text-black mb-2">
                  On-the-Job Training Hours *
                </label>
                <input
                  type="number"
                  id="hours_ojt"
                  name="hours_ojt"
                  required
                  min="0"
                  step="0.5"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label htmlFor="hours_related" className="block text-sm font-semibold text-black mb-2">
                  Related Instruction Hours *
                </label>
                <input
                  type="number"
                  id="hours_related"
                  name="hours_related"
                  required
                  min="0"
                  step="0.5"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-semibold text-black mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                placeholder="Optional notes about this week's progress..."
              />
            </div>

            <div className="pt-4 flex gap-4">
              <a
                href="/employer/dashboard"
                className="flex-1 px-6 py-3 border border-slate-300 text-black font-semibold rounded-lg hover:bg-slate-50 transition text-center"
              >
                Cancel
              </a>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition"
              >
                Submit Report
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
