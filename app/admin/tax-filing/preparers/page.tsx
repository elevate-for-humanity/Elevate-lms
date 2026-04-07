import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Tax Preparers | Admin | Elevate For Humanity',
  description: 'Manage tax preparers and their certifications.',
};

export default async function TaxPreparersPage() {
  const supabase = await createClient();



  const { data: preparers } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'tax_preparer')
    .order('full_name');

  return (
    <div className="min-h-screen bg-white py-8">

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/admin/tax-filing"
            className="text-brand-blue-600 hover:text-brand-blue-800 mb-4 inline-block"
          >
            ← Back to Tax Filing
          </Link>
          <h1 className="text-3xl font-bold text-black">Tax Preparers</h1>
          <p className="mt-2 text-black">
            Manage tax preparers, certifications, and assignments.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-brand-blue-600">
              {preparers?.length || 0}
            </div>
            <div className="text-black text-sm">Total Preparers</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-brand-green-600">
              {preparers?.filter((p: Record<string, any>) => p.is_active)
                .length || 0}
            </div>
            <div className="text-black text-sm">Active</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-3xl font-bold text-brand-blue-600">VITA</div>
            <div className="text-black text-sm">Certified</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-black">
              Tax Preparers
            </h2>
            <button className="px-4 py-2 bg-brand-blue-600 text-white rounded-md hover:bg-brand-blue-700" aria-label="Action button">
              + Add Preparer
            </button>
          </div>

          {preparers && preparers.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {preparers.map((item: any) => (
                <div key={item.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-black">
                        {item.full_name}
                      </h3>
                      <p className="text-sm text-black">{item.email}</p>
                      <div className="mt-2 flex gap-2">
                        <span className="px-2 py-2 bg-brand-green-100 text-brand-green-800 text-xs rounded">
                          VITA Certified
                        </span>
                        <span className="px-2 py-2 bg-brand-blue-100 text-brand-blue-800 text-xs rounded">
                          Active
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/admin/users/${item.id}`}
                      className="text-brand-blue-600 hover:text-brand-blue-800 text-sm"
                    >
                      View Profile →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-black">
              No tax preparers found. Add your first preparer above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
