import type { SupabaseClient } from '@supabase/supabase-js';
import { ensureCanonicalHostShopInfrastructure } from '@/lib/partners/ensure-canonical-host-shop';
import { ensureHostShopOwnerAccess } from '@/lib/partners/provision-host-shop-application';

export type HostShopDraftInput = {
  db: SupabaseClient;
  applicationId: string;
  legalBusinessName: string;
  businessName: string;
  ownerName: string;
  contactName: string;
  email: string;
  phone: string;
  address1: string;
  address2?: string | null;
  city: string;
  state: string;
  zip: string;
  businessType: string;
  programs: string[];
};

export type HostShopDraftResult = {
  partnerId: string;
  userId: string;
  accessLink: string | null;
  portalUrl: string;
};

function normalizeProgram(program: string): string {
  const value = program.trim().toLowerCase();
  if (value.includes('cosmet')) return 'cosmetology';
  if (value.includes('esthetic')) return 'esthetician';
  if (value.includes('nail') || value.includes('manicur')) return 'nail';
  if (value.includes('barber')) return 'barber';
  return value;
}

/**
 * Creates the conditional portal identity for a saved Host Shop draft.
 * Approval, apprentice assignment, and operational dashboard access remain
 * blocked until compliance review is complete.
 */
export async function provisionHostShopDraft(
  input: HostShopDraftInput,
): Promise<HostShopDraftResult> {
  const email = input.email.toLowerCase().trim();
  const programs = [...new Set(input.programs.map(normalizeProgram).filter(Boolean))];
  const primaryProgram = programs[0] || 'cosmetology';
  const now = new Date().toISOString();

  const { data: existingPartner, error: partnerLookupError } = await input.db
    .from('partners')
    .select('id,programs')
    .eq('contact_email', email)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (partnerLookupError) throw partnerLookupError;

  const existingPrograms = Array.isArray(existingPartner?.programs)
    ? existingPartner.programs.map(String)
    : [];
  const partnerPayload = {
    name: input.businessName,
    legal_name: input.legalBusinessName,
    shop_name: input.businessName,
    owner_name: input.ownerName,
    contact_name: input.contactName,
    contact_email: email,
    phone: input.phone,
    contact_phone: input.phone,
    address_line1: input.address1,
    address_line2: input.address2 || null,
    city: input.city,
    state: input.state || 'Indiana',
    zip: input.zip,
    partner_type: input.businessType || 'salon',
    program_type: primaryProgram,
    programs: [...new Set([...existingPrograms, ...programs])],
    status: 'active',
    approval_status: 'pending',
    account_status: 'conditional_access',
    documents_verified: false,
    onboarding_completed: false,
    mou_signed: false,
    is_active: true,
    partner_application_id: input.applicationId,
    applied_at: now,
    updated_at: now,
  };

  let partnerId = existingPartner?.id as string | undefined;
  if (partnerId) {
    const { error } = await input.db.from('partners').update(partnerPayload).eq('id', partnerId);
    if (error) throw error;
  } else {
    const { data, error } = await input.db
      .from('partners')
      .insert(partnerPayload)
      .select('id')
      .single();
    if (error || !data?.id) throw error || new Error('HOST_SHOP_DRAFT_PARTNER_NOT_CREATED');
    partnerId = data.id;
  }

  const identity = await ensureHostShopOwnerAccess({
    db: input.db,
    partnerId,
    email,
    contactName: input.contactName,
    phone: input.phone,
  });

  for (const programId of programs) {
    const { error } = await input.db.from('partner_program_access').upsert(
      {
        partner_id: partnerId,
        program_id: programId,
        can_view_apprentices: true,
        can_enter_progress: true,
        can_view_reports: true,
        revoked_at: null,
      },
      { onConflict: 'partner_id,program_id' },
    );
    if (error) throw error;
  }

  const canonical = await ensureCanonicalHostShopInfrastructure({
    db: input.db,
    partnerId,
    ownerId: identity.userId,
    businessName: input.businessName,
    businessType: input.businessType,
    contactName: input.contactName,
    contactEmail: email,
    contactPhone: input.phone,
    address1: input.address1,
    address2: input.address2 || null,
    city: input.city,
    state: input.state,
    zip: input.zip,
  });

  const { error: partnershipError } = await input.db
    .from('host_shop_partnerships')
    .update({
      application_id: input.applicationId,
      shop_id: canonical.shopId,
      status: 'pending',
      metadata: {
        programs,
        source: 'host_shop_application_draft',
        application_id: input.applicationId,
        conditional_access: true,
      },
      updated_at: now,
    })
    .eq('partner_id', partnerId);
  if (partnershipError) throw partnershipError;

  const appUrl = (process.env.NEXT_PUBLIC_LMS_URL || 'https://app.elevateforhumanity.org').replace(
    /\/$/,
    '',
  );
  const portalUrl = `${appUrl}/host-shop/login`;
  const onboardingUrl = `${appUrl}/auth/callback?redirect=${encodeURIComponent('/host-shop/onboarding')}`;
  let accessLink: string | null = null;
  try {
    const { data, error } = await input.db.auth.admin.generateLink({
      type: identity.isNewUser ? 'recovery' : 'magiclink',
      email,
      options: { redirectTo: onboardingUrl },
    });
    if (!error) accessLink = data?.properties?.action_link || null;
  } catch {
    accessLink = null;
  }

  return { partnerId, userId: identity.userId, accessLink, portalUrl };
}
