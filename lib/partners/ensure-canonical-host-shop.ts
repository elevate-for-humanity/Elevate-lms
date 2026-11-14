import type { SupabaseClient } from '@supabase/supabase-js';

type CanonicalHostShopInput = {
  db: SupabaseClient;
  partnerId: string;
  ownerId?: string | null;
  businessName: string;
  businessType?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  ein?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  website?: string | null;
  licenseNumber?: string | null;
};

function partnershipBusinessType(value: string | null | undefined) {
  const normalized = String(value || '').toLowerCase();
  if (normalized.includes('nail')) return 'nail_studio';
  if (normalized.includes('esthetic') || normalized.includes('spa')) return 'esthetics_studio';
  if (normalized.includes('salon') || normalized.includes('cosmet')) return 'salon';
  if (normalized.includes('barber')) return 'barbershop';
  return 'other';
}

/**
 * Idempotently creates the operational records every approved Host Shop needs.
 * This keeps all approval entry points on the same partner -> shop -> portal
 * structure instead of allowing partial dashboard records.
 */
export async function ensureCanonicalHostShopInfrastructure(input: CanonicalHostShopInput) {
  const { db } = input;
  const { data: tenant, error: tenantError } = await db
    .from('tenants')
    .select('id')
    .eq('name', 'Elevate for Humanity')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (tenantError || !tenant?.id) throw tenantError || new Error('ELEVATE_TENANT_NOT_FOUND');

  const shopPayload = {
    name: input.businessName,
    ein: input.ein || null,
    address1: input.address1 || null,
    address2: input.address2 || null,
    city: input.city || null,
    state: String(input.state || 'IN').toUpperCase() === 'INDIANA' ? 'IN' : input.state || 'IN',
    zip: input.zip || null,
    phone: input.contactPhone || null,
    email: input.contactEmail?.toLowerCase().trim() || null,
    active: true,
    tenant_id: tenant.id,
    owner_id: input.ownerId || null,
    partner_id: input.partnerId,
    updated_at: new Date().toISOString(),
  };
  const { data: existingShop, error: shopLookupError } = await db
    .from('shops')
    .select('id')
    .eq('partner_id', input.partnerId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (shopLookupError) throw shopLookupError;

  let shopId = existingShop?.id as string | undefined;
  if (shopId) {
    const { error } = await db.from('shops').update(shopPayload).eq('id', shopId);
    if (error) throw error;
  } else {
    const { data, error } = await db.from('shops').insert(shopPayload).select('id').single();
    if (error || !data?.id) throw error || new Error('HOST_SHOP_RECORD_NOT_CREATED');
    shopId = data.id;
  }

  const partnershipPayload = {
    partner_id: input.partnerId,
    shop_id: shopId,
    owner_id: input.ownerId || null,
    business_name: input.businessName,
    business_type: partnershipBusinessType(input.businessType),
    license_number: input.licenseNumber || null,
    address: [input.address1, input.address2, input.city, input.state, input.zip].filter(Boolean).join(', '),
    website: input.website || null,
    contact_name: input.contactName || null,
    contact_email: input.contactEmail?.toLowerCase().trim() || null,
    contact_phone: input.contactPhone || null,
    status: 'active',
    partner_tier: 'free',
    portal_access_enabled: true,
    portal_access_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const { data: existingPartnership, error: partnershipLookupError } = await db
    .from('host_shop_partnerships')
    .select('id')
    .eq('partner_id', input.partnerId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (partnershipLookupError) throw partnershipLookupError;
  if (existingPartnership?.id) {
    const { error } = await db.from('host_shop_partnerships').update(partnershipPayload).eq('id', existingPartnership.id);
    if (error) throw error;
  } else {
    const { error } = await db.from('host_shop_partnerships').insert({ ...partnershipPayload, onboarding_completed: false });
    if (error) throw error;
  }

  return { shopId };
}
