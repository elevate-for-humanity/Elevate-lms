import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import SettingsForm from './SettingsForm';

export const dynamic = 'force-dynamic';

export default async function ProviderSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/provider/settings');

  const db = createAdminClient()!;
  const { data: profile } = await db.from('profiles').select('tenant_id, full_name, email').eq('id', user.id).single();
  if (!profile?.tenant_id) redirect('/unauthorized');

  const { data: tenant } = await db
    .from('tenants')
    .select('id, name, slug')
    .eq('id', profile.tenant_id)
    .single();

  // Fetch organization record linked to this tenant
  const { data: org } = await db
    .from('organizations')
    .select('id, name, slug, logo_url, tagline, support_email, website, phone, address_line1, city, state, zip')
    .eq('tenant_id', profile.tenant_id)
    .maybeSingle();

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Update your organization profile. Changes are visible in the public provider directory.
        </p>
      </div>

      <SettingsForm
        tenantId={profile.tenant_id}
        orgId={org?.id ?? null}
        initial={{
          name: org?.name ?? tenant?.name ?? '',
          tagline: org?.tagline ?? '',
          supportEmail: org?.support_email ?? profile.email ?? '',
          website: org?.website ?? '',
          phone: org?.phone ?? '',
          addressLine1: org?.address_line1 ?? '',
          city: org?.city ?? '',
          state: org?.state ?? 'IN',
          zip: org?.zip ?? '',
          logoUrl: org?.logo_url ?? '',
        }}
      />
    </div>
  );
}
