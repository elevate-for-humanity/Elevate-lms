import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Employer Shop Create | Elevate For Humanity',
  description: 'Elevate For Humanity - Career training and workforce development',
};

import { createClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { createShop } from './_actions/create-shop';

export default async function CreateShopPage() {
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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/employer/shop/create');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'employer') {
    redirect('/unauthorized');
  }

  // Check if user already has shop access
  const { data: existingAccess } = await supabase
    .from('shop_staff')
    .select('shop_id, shops(name)')
    .eq('user_id', user.id)
    .limit(1);

  if (existingAccess && existingAccess.length > 0) {
    redirect('/employer/dashboard');
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            Create Your Shop
          </h1>
          <p className="text-black mb-8">
            Set up your shop to start managing apprenticeships
          </p>

          <form action={createShop} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-black mb-2">
                Shop Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                placeholder="e.g., Main Street Barbershop"
              />
            </div>

            <div>
              <label htmlFor="ein" className="block text-sm font-semibold text-black mb-2">
                EIN (Employer Identification Number)
              </label>
              <input
                type="text"
                id="ein"
                name="ein"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                placeholder="XX-XXXXXXX"
              />
            </div>

            <div>
              <label htmlFor="address1" className="block text-sm font-semibold text-black mb-2">
                Street Address *
              </label>
              <input
                type="text"
                id="address1"
                name="address1"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              />
            </div>

            <div>
              <label htmlFor="address2" className="block text-sm font-semibold text-black mb-2">
                Address Line 2
              </label>
              <input
                type="text"
                id="address2"
                name="address2"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                placeholder="Suite, Unit, etc."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label htmlFor="city" className="block text-sm font-semibold text-black mb-2">
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                />
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-semibold text-black mb-2">
                  State *
                </label>
                <select
                  id="state"
                  name="state"
                  required
                  defaultValue="IN"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                >
                  <option value="IN">IN</option>
                  <option value="IL">IL</option>
                  <option value="OH">OH</option>
                  <option value="MI">MI</option>
                  <option value="KY">KY</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="zip" className="block text-sm font-semibold text-black mb-2">
                ZIP Code *
              </label>
              <input
                type="text"
                id="zip"
                name="zip"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                placeholder="XXXXX"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-black mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                placeholder="(XXX) XXX-XXXX"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-black mb-2">
                Shop Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition"
              >
                Create Shop
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
