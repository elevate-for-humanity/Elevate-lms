import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Partners Admin Shops | Elevate For Humanity',
  description: 'Elevate For Humanity - Career training and workforce development',
};

import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminShopsPage() {
  let shops: any[] = [];
  
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
    const result = await supabase
      .from('shops')
      .select('*')
      .order('created_at', { ascending: false });
    
    shops = result.data || [];
  } catch (error) {
    console.error('Failed to fetch shops:', error);
  }

  return (
    <div className="rounded-2xl border p-5">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Partners", href: "/partners" }, { label: "Shops" }]} />
      </div>
<div className="font-semibold">Admin: Shops</div>
      <div className="text-sm text-black mt-1">
        Approve and manage partner locations.
      </div>

      <div className="mt-4 overflow-auto">
        <table className="min-w-[900px] w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Name</th>
              <th className="py-2">Status</th>
              <th className="py-2">City</th>
              <th className="py-2">Created</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shops.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-center text-gray-500">
                  No shops found
                </td>
              </tr>
            ) : (
              shops.map((s: any) => (
                <tr key={s.id} className="border-b">
                  <td className="py-2">{s.name}</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded text-xs ${s.active ? 'bg-brand-green-100 text-brand-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {s.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-2">{s.city ?? '-'}</td>
                  <td className="py-2">
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2">
                    <button className="text-brand-blue-600 hover:underline text-sm">View</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
