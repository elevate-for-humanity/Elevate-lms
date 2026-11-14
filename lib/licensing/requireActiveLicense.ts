import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { checkLicenseAccess } from '@/lib/licensing/billing-authority';

async function loadLicense(tenantId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('licenses')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle();
  return error ? null : data;
}

function permitsFeature(license: any, feature: string): boolean {
  if (!license || !checkLicenseAccess(license).hasAccess) return false;
  return Array.isArray(license.features)
    ? license.features.includes(feature)
    : license.features?.[feature] === true;
}

export async function requireActiveLicense(tenantId: string): Promise<void> {
  const license = await loadLicense(tenantId);
  if (!license) redirect('/account?error=no_license');
  const access = checkLicenseAccess(license);
  if (!access.hasAccess) redirect(`/account?error=${encodeURIComponent(access.reason)}`);
}

export async function requireFeatureAccess(tenantId: string, feature: string): Promise<void> {
  const license = await loadLicense(tenantId);
  if (!permitsFeature(license, feature))
    redirect(`/account/upgrade?feature=${encodeURIComponent(feature)}`);
}

export async function checkLicenseStatus(
  tenantId: string,
): Promise<'active' | 'trial' | 'suspended' | 'cancelled' | 'expired' | 'none'> {
  const license = await loadLicense(tenantId);
  if (!license) return 'none';
  if (license.status === 'suspended') return 'suspended';
  if (license.status === 'canceled' || license.status === 'cancelled') return 'cancelled';
  if (!checkLicenseAccess(license).hasAccess) return 'expired';
  return license.status === 'trial' ? 'trial' : 'active';
}

export async function checkFeatureAccess(tenantId: string, feature: string): Promise<boolean> {
  return permitsFeature(await loadLicense(tenantId), feature);
}
