import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Admin Shops | Elevate For Humanity',
  description: 'Elevate For Humanity - Career training and workforce development',
};

import { createClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Users,
} from 'lucide-react';

export default async function AdminShopsPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Shops" }]} />
        </div>
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

  if (!user) {
    redirect('/login?next=/admin/shops');
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/');
  }

  // Get all shops with their onboarding status
  const { data: shops } = await supabase
    .from('shops')
    .select(
      `
      *,
      shop_onboarding(*),
      shop_staff(count),
      apprentice_placements(count)
    `
    )
    .order('created_at', { ascending: false });

  // Get shop applications
  const { data: applications } = await supabase
    .from('shop_applications')
    .select('*')
    .eq('status', 'submitted')
    .order('created_at', { ascending: false });

  // Get document status for each shop
  const shopsWithDocs = await Promise.all(
    (shops || []).map(async (shop) => {
      const { data: docs } = await supabase
        .from('shop_required_docs_status')
        .select('required, approved')
        .eq('shop_id', shop.id);

      const requiredDocs = docs?.filter((d) => d.required) || [];
      const approvedDocs = requiredDocs.filter((d) => d.approved);

      return {
        ...shop,
        docsRequired: requiredDocs.length,
        docsApproved: approvedDocs.length,
        docsComplete:
          requiredDocs.length > 0 &&
          approvedDocs.length === requiredDocs.length,
      };
    })
  );

  function getShopStatus(shop: any) {
    if (!shop.active) return { color: 'red', label: 'Inactive', icon: XCircle };
    if (shop.docsComplete && shop.shop_onboarding?.[0]?.completed_at) {
      return { color: 'green', label: 'Complete', icon: CheckCircle };
    }
    if (shop.docsApproved > 0) {
      return { color: 'yellow', label: 'In Progress', icon: Clock };
    }
    return { color: 'red', label: 'Pending', icon: Clock };
  }

  return (
    <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Shops" }]} />
        </div>
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black">
                Shop Management
              </h1>
              <p className="mt-1 text-black">
                Manage shop partners and onboarding
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/dashboard"
                className="px-4 py-2 text-black hover:bg-slate-100 rounded-lg transition"
              >
                ← Back to Admin
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-brand-blue-600" />
              <div>
                <div className="text-2xl font-bold text-black">
                  {shops?.length || 0}
                </div>
                <div className="text-sm text-black">Total Shops</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-brand-green-600" />
              <div>
                <div className="text-2xl font-bold text-black">
                  {shopsWithDocs.filter((s) => s.docsComplete).length}
                </div>
                <div className="text-sm text-black">Fully Approved</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-black">
                  {applications?.length || 0}
                </div>
                <div className="text-sm text-black">
                  Pending Applications
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-black">
                  {shopsWithDocs.reduce(
                    (sum, s) =>
                      sum + (s.apprentice_placements?.[0]?.count || 0),
                    0
                  )}
                </div>
                <div className="text-sm text-black">Active Placements</div>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Applications */}
        {applications && applications.length > 0 && (
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-black mb-4">
              Pending Applications
            </h2>
            <div className="space-y-3">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="border border-slate-200 rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-black">
                      {app.shop_name}
                    </div>
                    <div className="text-sm text-black">
                      {app.owner_name} • {app.email}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Applied: {new Date(app.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/shops/applications/${app.id}`}
                      className="px-4 py-2 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition text-sm"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Shops */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-black mb-4">All Shops</h2>

          <div className="space-y-3">
            {shopsWithDocs.map((shop) => {
              const status = getShopStatus(shop);
              const StatusIcon = status.icon;

              return (
                <div
                  key={shop.id}
                  className="border border-slate-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="font-bold text-black">
                          {shop.name}
                        </div>
                        <div
                          className={`flex items-center gap-1 px-2 py-2 rounded-full text-xs font-semibold ${
                            status.color === 'green'
                              ? 'bg-brand-green-100 text-green-800'
                              : status.color === 'yellow'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </div>
                      </div>

                      <div className="text-sm text-black space-y-1">
                        <div>
                          {shop.address1}
                          {shop.city && `, ${shop.city}`}
                          {shop.state && `, ${shop.state}`}
                          {shop.zip && ` ${shop.zip}`}
                        </div>
                        {shop.email && <div>Email: {shop.email}</div>}
                        {shop.phone && <div>Phone: {shop.phone}</div>}
                      </div>

                      <div className="mt-3 flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span className="text-black">
                            Docs: {shop.docsApproved}/{shop.docsRequired}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span className="text-black">
                            Apprentices:{' '}
                            {shop.apprentice_placements?.[0]?.count || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/admin/shops/${shop.id}`}
                        className="px-4 py-2 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition text-sm text-center"
                      >
                        Manage
                      </Link>
                      <Link
                        href={`/admin/shops/${shop.id}/documents`}
                        className="px-4 py-2 border border-slate-300 text-black font-semibold rounded-lg hover:bg-slate-50 transition text-sm text-center"
                      >
                        Documents
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}

            {shopsWithDocs.length === 0 && (
              <div className="text-center py-12 text-black">
                No shops yet. Applications will appear here.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
