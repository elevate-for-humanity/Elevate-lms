import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Building2, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Providers | Admin',
};

export default async function AdminProvidersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const db = createAdminClient();
  if (!db) return <div className="p-8 text-red-600">Database unavailable</div>;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/unauthorized');
  }

  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, name, slug, status, active, created_at')
    .eq('type', 'partner_provider')
    .order('created_at', { ascending: false });

  // Pending applications count for the badge
  const { count: pendingCount } = await supabase
    .from('provider_applications')
    .select('*', { count: 'exact', head: true })
    .in('status', ['pending', 'under_review']);

  // Ghost tenants: approved but no provider_admin profile linked (D3 fix)
  const tenantIds = (tenants ?? []).map(t => t.id);
  let ghostTenantIds = new Set<string>();
  if (tenantIds.length > 0) {
    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('tenant_id')
      .in('tenant_id', tenantIds)
      .eq('role', 'provider_admin');
    const tenantsWithAdmin = new Set((adminProfiles ?? []).map(p => p.tenant_id));
    ghostTenantIds = new Set(tenantIds.filter(id => !tenantsWithAdmin.has(id)));
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <Breadcrumbs items={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Providers' },
        ]} />
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Providers</h1>
            <p className="text-slate-500 text-sm mt-1">
              All approved training organizations on the hub.
            </p>
          </div>
          <Link
            href="/admin/provider-applications"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition"
          >
            Applications
            {(pendingCount ?? 0) > 0 && (
              <span className="bg-white text-brand-blue-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </Link>
        </div>

        {ghostTenantIds.size > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-3 flex items-start gap-3 mb-4">
            <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              <strong>{ghostTenantIds.size} provider{ghostTenantIds.size > 1 ? 's' : ''}</strong> approved but missing a provider admin account.
              Auth user creation may have failed during approval. Open each and retry the invite.
            </p>
          </div>
        )}

        {(tenants ?? []).length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No approved providers yet.</p>
            <Link
              href="/admin/provider-applications"
              className="mt-4 inline-block text-sm text-brand-blue-600 hover:underline"
            >
              Review pending applications →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {(tenants ?? []).map(tenant => (
              <Link
                key={tenant.id}
                href={`/admin/providers/${tenant.id}`}
                className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-5 py-4 hover:border-brand-blue-300 hover:shadow-sm transition group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-brand-blue-50 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-brand-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 group-hover:text-brand-blue-700 transition">
                      {tenant.name}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      /{tenant.slug} · Joined {new Date(tenant.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {ghostTenantIds.has(tenant.id) && (
                    <span className="flex items-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full" title="No provider admin account linked">
                      <AlertTriangle className="w-3 h-3" /> No admin
                    </span>
                  )}
                  {tenant.status === 'active' ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" /> Active
                    </span>
                  ) : tenant.status === 'suspended' ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3" /> Suspended
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" /> {tenant.status}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
