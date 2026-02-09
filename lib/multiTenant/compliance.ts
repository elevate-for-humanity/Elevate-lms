// lib/multiTenant/compliance.ts
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase configuration missing');
  }
  return createClient(url, key);
}

export type TenantCompliance = {
  wioa: boolean;
  ferpa: boolean;
  hipaa: boolean;
};

export async function getTenantCompliance(tenantId: string): Promise<TenantCompliance> {
  const supabase = getSupabaseAdmin();
  const { data: tenant } = await supabase
    .from('tenants')
    .select('compliance_wioa, compliance_ferpa, compliance_hipaa')
    .eq('id', tenantId)
    .single();

  if (!tenant) {
    return { wioa: false, ferpa: false, hipaa: false };
  }

  return {
    wioa: tenant.compliance_wioa || false,
    ferpa: tenant.compliance_ferpa || false,
    hipaa: tenant.compliance_hipaa || false,
  };
}

export async function updateTenantCompliance(
  tenantId: string,
  compliance: Partial<TenantCompliance>
): Promise<void> {
  const updates: Record<string, boolean> = {};

  if (compliance.wioa !== undefined) updates.compliance_wioa = compliance.wioa;
  if (compliance.ferpa !== undefined) updates.compliance_ferpa = compliance.ferpa;
  if (compliance.hipaa !== undefined) updates.compliance_hipaa = compliance.hipaa;

  await supabase
    .from('tenants')
    .update(updates)
    .eq('id', tenantId);
}
