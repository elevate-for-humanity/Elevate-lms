import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCatalogProducts, type CatalogProduct } from '@/lib/store/db';
import { ALL_PRODUCTS } from '@/app/data/store-products';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Catalog Sanity Check | Admin',
  description: 'Compare DB catalog against hardcoded products to verify migration.',
};

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

function StatusBadge({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-green-100 text-brand-green-800">Match</span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-red-100 text-brand-red-800">Mismatch</span>
  );
}

export default async function CatalogSanityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  const dbProducts = await getCatalogProducts();
  const hardcoded = ALL_PRODUCTS;

  // Build lookup maps
  const dbBySlug = new Map<string, CatalogProduct>();
  dbProducts.forEach(p => dbBySlug.set(p.slug, p));

  const hardcodedBySlug = new Map<string, typeof hardcoded[0]>();
  hardcoded.forEach(p => hardcodedBySlug.set(p.slug, p));

  // All unique slugs
  const allSlugs = [...new Set([...dbBySlug.keys(), ...hardcodedBySlug.keys()])].sort();

  const rows = allSlugs.map(slug => {
    const db = dbBySlug.get(slug);
    const hc = hardcodedBySlug.get(slug);
    const priceMatch = db && hc ? db.price === hc.price : false;
    const nameMatch = db && hc ? db.name === hc.name : false;
    return { slug, db, hc, priceMatch, nameMatch, inDb: !!db, inHardcoded: !!hc };
  });

  const allMatch = rows.every(r => r.inDb && r.inHardcoded && r.priceMatch && r.nameMatch);
  const dbOnly = rows.filter(r => r.inDb && !r.inHardcoded);
  const hardcodedOnly = rows.filter(r => !r.inDb && r.inHardcoded);

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <nav className="text-sm mb-4">
          <ol className="flex items-center space-x-2 text-gray-500">
            <li><Link href="/admin" className="hover:text-brand-blue-600">Admin</Link></li>
            <li>/</li>
            <li><Link href="/admin/store" className="hover:text-brand-blue-600">Store</Link></li>
            <li>/</li>
            <li className="text-gray-900 font-medium">Catalog Sanity Check</li>
          </ol>
        </nav>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Catalog Sanity Check</h1>
        <p className="text-gray-600 mb-6">
          Compares the <code className="bg-gray-100 px-1 rounded text-sm">products</code> table against the hardcoded catalog in <code className="bg-gray-100 px-1 rounded text-sm">store-products.ts</code>.
        </p>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border p-4">
            <div className="text-sm text-gray-500">DB Products</div>
            <div className="text-2xl font-bold">{dbProducts.length}</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-sm text-gray-500">Hardcoded Products</div>
            <div className="text-2xl font-bold">{hardcoded.length}</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-sm text-gray-500">DB-Only</div>
            <div className={`text-2xl font-bold ${dbOnly.length > 0 ? 'text-yellow-600' : 'text-gray-900'}`}>{dbOnly.length}</div>
          </div>
          <div className={`rounded-lg border p-4 ${allMatch ? 'bg-brand-green-50 border-brand-green-200' : 'bg-brand-red-50 border-brand-red-200'}`}>
            <div className="text-sm text-gray-500">Status</div>
            <div className={`text-2xl font-bold ${allMatch ? 'text-brand-green-700' : 'text-brand-red-700'}`}>
              {allMatch ? 'All Match' : 'Mismatches Found'}
            </div>
          </div>
        </div>

        {/* Missing from DB */}
        {hardcodedOnly.length > 0 && (
          <div className="bg-brand-red-50 border border-brand-red-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-brand-red-800 mb-2">Missing from DB ({hardcodedOnly.length})</h2>
            <p className="text-sm text-brand-red-700 mb-2">These products exist in hardcoded catalog but not in the products table. Run the migration SQL.</p>
            <ul className="list-disc list-inside text-sm text-brand-red-700">
              {hardcodedOnly.map(r => <li key={r.slug}>{r.slug} — {r.hc?.name}</li>)}
            </ul>
          </div>
        )}

        {/* Comparison table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">DB Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">HC Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">In DB</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map(r => (
                <tr key={r.slug} className={!r.inDb ? 'bg-brand-red-50' : !r.priceMatch || !r.nameMatch ? 'bg-yellow-50' : ''}>
                  <td className="px-4 py-3 text-sm font-mono">{r.slug}</td>
                  <td className="px-4 py-3 text-sm">{r.db?.name || r.hc?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm">{r.db ? fmt(r.db.price) : '—'}</td>
                  <td className="px-4 py-3 text-sm">{r.hc ? fmt(r.hc.price) : '—'}</td>
                  <td className="px-4 py-3 text-sm">
                    {r.inDb && r.inHardcoded ? <StatusBadge ok={r.priceMatch} /> : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {r.inDb && r.inHardcoded ? <StatusBadge ok={r.nameMatch} /> : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm">{r.db?.catalogGroup || '—'}</td>
                  <td className="px-4 py-3 text-sm">
                    {r.inDb ? (
                      <span className="text-brand-green-600 font-medium">Yes</span>
                    ) : (
                      <span className="text-brand-red-600 font-medium">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-400 mt-4">
          Once the migration is run and all rows show &quot;Match&quot;, the hardcoded fallback in API routes can be removed.
        </p>
      </div>
    </div>
  );
}
