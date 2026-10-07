import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import {
  ShoppingBag,
  DollarSign,
  Package,
  Download,
  Key,
  Tag,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Store Management | Elevate For Humanity',
  description: 'Manage store products, licenses, and purchases.',
};

export default async function AdminStorePage() {
  await requireRole(['admin']);
  const supabase = await createClient();

  const [
    { data: rawStoreProducts, count: productCount, error: productError },
    { data: purchases, count: purchaseCount, error: purchaseError },
    { data: licensePurchases, count: licenseCount, error: licenseError },
    { data: recentPurchases, error: recentPurchaseError },
    { data: recentLicenses, error: recentLicenseError },
  ] = await Promise.all([
    supabase
      .from('store_products')
      .select('id, name, status, products(price, is_active, type)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('purchases')
      .select('id, amount_cents, status, created_at', { count: 'exact' })
      .limit(500),
    supabase
      .from('license_purchases')
      .select('id, amount_cents, status, created_at', { count: 'exact' })
      .limit(500),
    supabase
      .from('purchases')
      .select('id, amount_cents, status, created_at, email')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('license_purchases')
      .select('id, amount_cents, status, created_at, contact_name, contact_email')
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const storeProducts = (rawStoreProducts || []).map((row) => {
    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    return {
      ...row,
      price: product?.price ?? null,
      is_active: product?.is_active ?? row.status === 'active',
      product_type: product?.type ?? null,
    };
  });
  const inventoryUnavailable = Boolean(
    productError || purchaseError || licenseError || recentPurchaseError || recentLicenseError,
  );

  const totalRevenue = [...(purchases || []), ...(licensePurchases || [])]
    .filter((p: any) => p.status === 'completed' || p.status === 'succeeded')
    .reduce((sum: number, p: any) => sum + Number(p.amount_cents || 0) / 100, 0);

  const activeProducts = (storeProducts || []).filter((p: any) => p.is_active).length;

  const purchaseStatusBadge: Record<string, string> = {
    completed: 'bg-green-100 text-green-700',
    succeeded: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    failed: 'bg-red-100 text-red-700',
    refunded: 'bg-slate-100 text-slate-700',
  };

  const productTypeBadge: Record<string, string> = {
    course: 'bg-brand-blue-100 text-brand-blue-700',
    license: 'bg-purple-100 text-purple-700',
    addon: 'bg-brand-orange-100 text-brand-orange-700',
    digital: 'bg-green-100 text-green-700',
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Breadcrumbs items={[{ label: 'Admin', href: '/' }, { label: 'Store' }]} />
          <div className="flex justify-between items-center mt-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Store Management</h1>
              <p className="text-slate-700 mt-1">Products, licenses, and purchase history</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="https://www.elevateforhumanity.org/store"
                target="_blank"
                className="flex items-center gap-2 border border-slate-300 text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-50 text-sm"
              >
                <ExternalLink size={14} /> View Store
              </Link>
              <Link
                href="/licenses"
                className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700 text-sm font-medium"
              >
                Manage Licenses
              </Link>
            </div>
          </div>
        </div>

        {inventoryUnavailable ? (
          <p
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"
          >
            Some store records could not be loaded. Counts and revenue are incomplete; refresh after
            resolving the data connection.
          </p>
        ) : null}
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="w-10 h-10 bg-brand-blue-50 rounded-lg flex items-center justify-center mb-3">
              <Package className="w-5 h-5 text-brand-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {productError ? 'Unavailable' : (productCount ?? 0)}
            </p>
            <p className="text-sm text-slate-700 mt-1">Total Products</p>
            <p className="text-xs text-slate-700 mt-0.5">{activeProducts} active</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {purchaseError || licenseError ? 'Unavailable' : `$${totalRevenue.toLocaleString()}`}
            </p>
            <p className="text-sm text-slate-700 mt-1">Total Revenue</p>
            <p className="text-xs text-slate-700 mt-0.5">Completed orders</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="w-10 h-10 bg-brand-orange-50 rounded-lg flex items-center justify-center mb-3">
              <ShoppingBag className="w-5 h-5 text-brand-orange-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {purchaseError ? 'Unavailable' : (purchaseCount ?? 0)}
            </p>
            <p className="text-sm text-slate-700 mt-1">Store Orders</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mb-3">
              <Key className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {licenseError ? 'Unavailable' : (licenseCount ?? 0)}
            </p>
            <p className="text-sm text-slate-700 mt-1">License Sales</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Products */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-5 border-b flex justify-between items-center">
              <h2 className="text-base font-semibold text-slate-900">Products</h2>
              <Link
                href="https://www.elevateforhumanity.org/store"
                className="text-sm text-brand-blue-600 hover:text-brand-blue-800 flex items-center gap-1"
              >
                View store <ArrowRight size={14} />
              </Link>
            </div>
            <div className="divide-y">
              {storeProducts && storeProducts.length > 0 ? (
                storeProducts.map((prod: any) => (
                  <div key={prod.id} className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Tag className="w-4 h-4 text-slate-700" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{prod.name}</p>
                        <p className="text-xs text-slate-700">
                          {prod.price === null
                            ? 'Price not configured'
                            : `$${Number(prod.price).toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full capitalize ${productTypeBadge[prod.product_type] || 'bg-slate-100 text-slate-700'}`}
                      >
                        {prod.product_type || 'product'}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${prod.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}
                      >
                        {prod.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-700 text-sm">No products yet</div>
              )}
            </div>
          </div>

          {/* Recent Purchases */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-5 border-b flex justify-between items-center">
              <h2 className="text-base font-semibold text-slate-900">Recent Orders</h2>
              <Link
                href="/licenses"
                className="text-sm text-brand-blue-600 hover:text-brand-blue-800 flex items-center gap-1"
              >
                Licenses <ArrowRight size={14} />
              </Link>
            </div>
            <div className="divide-y">
              {recentPurchases && recentPurchases.length > 0 ? (
                recentPurchases.map((p: any) => (
                  <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{'Customer'}</p>
                      <p className="text-xs text-slate-700">
                        {p.email || '—'} ·{' '}
                        {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        $
                        {(Number(p.amount_cents || 0) / 100).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full capitalize ${purchaseStatusBadge[p.status] || 'bg-slate-100 text-slate-700'}`}
                      >
                        {p.status || 'pending'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-700 text-sm">No orders yet</div>
              )}
            </div>
          </div>
        </div>

        {/* Recent License Purchases */}
        {recentLicenses && recentLicenses.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-5 border-b flex justify-between items-center">
              <h2 className="text-base font-semibold text-slate-900">Recent License Sales</h2>
              <Link
                href="/licenses"
                className="text-sm text-brand-blue-600 hover:text-brand-blue-800"
              >
                Manage licenses
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-700 uppercase">
                      Customer
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-700 uppercase">
                      Amount
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-700 uppercase">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-700 uppercase">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentLicenses.map((l: any) => (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{l.contact_name || 'Customer'}</p>
                        <p className="text-xs text-slate-700">{l.contact_email || '—'}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        $
                        {(Number(l.amount_cents || 0) / 100).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-1 rounded-full capitalize ${purchaseStatusBadge[l.status] || 'bg-slate-100 text-slate-700'}`}
                        >
                          {l.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 text-xs">
                        {l.created_at ? new Date(l.created_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
