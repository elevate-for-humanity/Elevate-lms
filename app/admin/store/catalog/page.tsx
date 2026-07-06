import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { getCatalogProducts, type CatalogProduct } from '@/lib/store/db';
import { ALL_PRODUCTS } from '@/lib/data/store-products';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Catalog Sanity Check | Admin',
  // MIGRATION TOOL — not a live catalog page.
  // ALL_PRODUCTS (app/data/store-products.ts) is still the active fallback in:
  //   - app/api/licenses/checkout/route.ts
  //   - app/api/stripe/checkout/route.ts
  // Do not delete store-products.ts until those routes are fully migrated to DB.
  description: 'Compare DB catalog against hardcoded products to verify migration.',
};

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

function StatusBadge({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-green-100 text-brand-green-800">
      Match
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-red-100 text-brand-red-800">
      Mismatch
    </span>
  );
}

export default async function CatalogSanityPage() {
  await requireRole(['admin', 'super_admin']);
  const supabase = await createClient();

  const dbProducts = await getCatalogProducts();
  const hardcoded = ALL_PRODUCTS;

  // Build lookup maps
  const dbBySlug = new Map<string, CatalogProduct>();
  dbProducts.forEach((p) => dbBySlug.set(p.slug, p));

  const hardcodedBySlug = new Map<string, (typeof hardcoded)[0]>();
  hardcoded.forEach((p) => hardcodedBySlug.set(p.slug, p));

  // All unique slugs
  const allSlugs = [...new Set([...dbBySlug.keys(), ...hardcodedBySlug.keys()])].sort();

  const rows = allSlugs.map((slug) => {
    const db = dbBySlug.get(slug);
    const hc = hardcodedBySlug.get(slug);
    const priceMatch = db && hc ? db.price === hc.price : false;
    const nameMatch = db && hc ? db.name === hc.name : false;
    return { slug, db, hc, priceMatch, nameMatch, inDb: !!db, inHardcoded: !!hc };
  });

  const allMatch = rows.every((r) => r.inDb && r.inHardcoded && r.priceMatch && r.nameMatch);
  const dbOnly = rows.filter((r) => r.inDb && !r.inHardcoded);
  const hardcodedOnly = rows.filter((r) => !r.inDb && r.inHardcoded);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <nav className="text-sm mb-4">
          <ol className="flex items-center space-x-2 text-slate-700">
            <li>
              <Link href="/admin" className="hover:text-brand-blue-600">
                Admin
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/admin/store" className="hover:text-brand-blue-600">
                Store
              </Link>
            </li>
            <li>/</li>
            <li className="text-slate-900 font-medium">Catalog Sanity Check</li>
          </ol>
        </nav>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">Catalog Sanity Check</h1>
        <p className="text-slate-700 mb-6">
          Compares the <code className="bg-slate-100 px-1 rounded text-sm">products</code> table
          against the hardcoded catalog in{' '}
          <code className="bg-slate-100 px-1 rounded text-sm">store-products.ts</code>.
        </p>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border p-4">
            <div className="text-sm text-slate-700">DB Products</div>
            <div className="text-2xl font-bold">{dbProducts.length}</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-sm text-slate-700">Hardcoded Products</div>
            <div className="text-2xl font-bold">{hardcoded.length}</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-sm text-slate-700">DB-Only</div>
            <div
              className={`text-2xl font-bold ${dbOnly.length > 0 ? 'text-yellow-600' : 'text-slate-900'}`}
            >
              {dbOnly.length}
            </div>
          </div>
          <div
            className={`rounded-lg border p-4 ${allMatch ? 'bg-brand-green-50 border-brand-green-200' : 'bg-brand-red-50 border-brand-red-200'}`}
          >
            <div className="text-sm text-slate-700">Status</div>
            <div
              className={`text-2xl font-bold ${allMatch ? 'text-brand-green-700' : 'text-brand-red-700'}`}
            >
              {allMatch ? 'All Match' : 'Mismatches Found'}
            </div>
          </div>
        </div>

        {/* Missing from DB */}
        {hardcodedOnly.length > 0 && (
          <div className="bg-brand-red-50 border border-brand-red-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-brand-red-800 mb-2">
              Missing from DB ({hardcodedOnly.length})
            </h2>
            <p className="text-sm text-brand-red-700 mb-2">
              These products exist in hardcoded catalog but not in the products table. Run the
              migration SQL.
            </p>
            <ul className="list-disc list-inside text-sm text-brand-red-700">
              {hardcodedOnly.map((r) => (
                <li key={r.slug}>
                  {r.slug} — {r.hc?.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Comparison table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  Slug
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  DB Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  HC Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  Group
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  In DB
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((r) => (
                <tr
                  key={r.slug}
                  className={
                    !r.inDb
                      ? 'bg-brand-red-50'
                      : !r.priceMatch || !r.nameMatch
                        ? 'bg-yellow-50'
                        : ''
                  }
                >
                  <td className="px-4 py-3 text-sm font-mono">{r.slug}</td>
                  <td className="px-4 py-3 text-sm">{r.db?.name || r.hc?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm">{r.db ? fmt(r.db.price) : '—'}</td>
                  <td className="px-4 py-3 text-sm">{r.hc ? fmt(r.hc.price) : '—'}</td>
                  <td className="px-4 py-3 text-sm">
                    {r.inDb && r.inHardcoded ? (
                      <StatusBadge ok={r.priceMatch} />
                    ) : (
                      <span className="text-slate-700">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {r.inDb && r.inHardcoded ? (
                      <StatusBadge ok={r.nameMatch} />
                    ) : (
                      <span className="text-slate-700">—</span>
                    )}
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

        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <strong>Migration incomplete.</strong> <code>ALL_PRODUCTS</code> is still the active
          fallback in <code>app/api/licenses/checkout</code> and{' '}
          <code>app/api/stripe/checkout</code>. Do not delete{' '}
          <code>app/data/store-products.ts</code> until those routes query the DB directly. Once all
          rows show &quot;Match&quot; and API routes are updated, retire this page.
        </div>
      </div>
    </div>
  );
}
