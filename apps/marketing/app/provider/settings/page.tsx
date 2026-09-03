import { redirect } from 'next/navigation';
import SettingsForm from './SettingsForm';
import { requireProviderPortal } from '@/lib/auth/provider-access';

export const metadata = { robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function ProviderSettingsPage({ searchParams }: { searchParams: Promise<{ tenant?: string }> }) {
  const { tenant: requestedTenant } = await searchParams;
  const access = await requireProviderPortal(requestedTenant);
  if (access.isPlatformAdmin && access.platformWide) redirect('/provider/dashboard');
  const tenantId = access.tenantId!;

  const [{ data: tenant }, { data: org }] = await Promise.all([
    access.db.from('tenants').select('id, name, slug').eq('id', tenantId).maybeSingle(),
    access.db.from('organizations').select('id, name, slug, logo_url, tagline, support_email, website, phone, address, city, state, zip').eq('tenant_id', tenantId).maybeSingle(),
  ]);

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Update the organization profile. Changes are visible in the public provider directory.</p>
        {access.isPlatformAdmin ? <p className="mt-2 text-xs font-bold text-amber-700">Admin oversight mode · Provider tenant {tenantId}</p> : null}
      </div>
      <SettingsForm
        tenantId={tenantId}
        orgId={org?.id ?? null}
        initial={{
          name: org?.name ?? tenant?.name ?? '',
          tagline: org?.tagline ?? '',
          supportEmail: org?.support_email ?? access.profile.email ?? '',
          website: org?.website ?? '',
          phone: org?.phone ?? '',
          addressLine1: org?.address ?? '',
          city: org?.city ?? '',
          state: org?.state ?? 'IN',
          zip: org?.zip ?? '',
          logoUrl: org?.logo_url ?? '',
        }}
      />
    </div>
  );
}
