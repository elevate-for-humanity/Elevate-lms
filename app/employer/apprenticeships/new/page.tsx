
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Employer Apprenticeships New | Elevate For Humanity',
  description: 'Elevate For Humanity - Career training and workforce development',
};


import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { createPlacement } from './_actions/create-placement';

export default async function NewPlacementPage() {
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
  if (!user) redirect('/login?next=/employer/apprenticeships/new');

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'employer') {
    redirect('/unauthorized');
  }

  // Get shops this employer has access to
  const { data: shopAccess } = await db
    .from('shop_staff')
    .select('shop_id, role, shops(id, name)')
    .eq('user_id', user.id);

  if (!shopAccess || shopAccess.length === 0) {
    redirect('/employer/shop/create');
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            Create Apprentice Placement
          </h1>
          <p className="text-black mb-8">
            Add a new apprentice to your shop
          </p>

          <form action={createPlacement} className="space-y-6">
            <div>
              <label htmlFor="shop_id" className="block text-sm font-semibold text-black mb-2">
                Shop *
              </label>
              <select
                id="shop_id"
                name="shop_id"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              >
                <option value="">Select a shop</option>
                {shopAccess.map((access) => (
                  <option key={access.shop_id} value={access.shop_id}>
                    {access.shops?.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="student_email" className="block text-sm font-semibold text-black mb-2">
                Student Email *
              </label>
              <input
                type="email"
                id="student_email"
                name="student_email"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                placeholder="student.email@gmail.com"
              />
              <p className="text-sm text-slate-500 mt-1">
                Enter the email of a registered student
              </p>
            </div>

            <div>
              <label htmlFor="program_slug" className="block text-sm font-semibold text-black mb-2">
                Program *
              </label>
              <select
                id="program_slug"
                name="program_slug"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              >
                <option value="">Select a program</option>
                <option value="barbering">Barbering</option>
                <option value="cosmetology">Cosmetology</option>
                <option value="esthetics">Esthetics</option>
                <option value="nail-tech">Nail Technology</option>
              </select>
            </div>

            <div>
              <label htmlFor="start_date" className="block text-sm font-semibold text-black mb-2">
                Start Date *
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              />
            </div>

            <div>
              <label htmlFor="end_date" className="block text-sm font-semibold text-black mb-2">
                Expected End Date
              </label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
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
                Create Placement
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
