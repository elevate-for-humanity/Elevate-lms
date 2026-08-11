import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { normalizeHostShopProgram } from '@/lib/partners/host-shop-onboarding';

export type HostShopUploadedDocuments = {
  shopLicense: string;
  insurance: string;
  workersComp: string;
  supervisorLicense: string;
  ein: string;
  localBusiness?: string | null;
};

export type ProvisionHostShopApplicationInput = {
  db: SupabaseClient;
  applicationId: string;
  businessName: string;
  legalBusinessName: string;
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
  licenseNumber: string;
  supervisorName: string;
  supervisorLicenseNumber: string;
  supervisorYearsLicensed?: string | number | null;
  workersCompStatus: string;
  compensationModel: string;
  numberOfEmployees?: string | number | null;
  programs: string[];
  documents: HostShopUploadedDocuments;
};

export type ProvisionHostShopApplicationResult = {
  partnerId: string;
  userId: string | null;
  isNewUser: boolean;
  accessLink: string | null;
  portalUrl: string;
  onboardingUrl: string;
};

function numericOrNull(value: string | number | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function fileName(path: string) {
  return path.split('/').pop() || path;
}

function normalizedPrograms(programs: string[]) {
  return [...new Set(programs.map((program) => normalizeHostShopProgram(program)).filter(Boolean))] as string[];
}

async function resolveOrCreateUser(
  db: SupabaseClient,
  email: string,
  contactName: string,
): Promise<{ userId: string | null; isNewUser: boolean }> {
  const normalizedEmail = email.toLowerCase().trim();
  const { data: profile } = await db
    .from('profiles')
    .select('id, role')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (profile?.id) {
    return { userId: profile.id as string, isNewUser: false };
  }

  try {
    const { data: users } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = users?.users?.find(
      (user) => user.email?.toLowerCase() === normalizedEmail,
    );
    if (existing?.id) return { userId: existing.id, isNewUser: false };
  } catch (error) {
    logger.warn('[host-shop/provision] auth user lookup failed', {
      email: normalizedEmail,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const tempPassword = `${crypto.randomUUID().replace(/-/g, '')}Aa1!`;
  const { data, error } = await db.auth.admin.createUser({
    email: normalizedEmail,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      full_name: contactName,
      role: 'partner',
      portal: 'host_shop',
    },
  });

  if (error || !data.user?.id) {
    logger.error('[host-shop/provision] auth user creation failed', undefined, {
      email: normalizedEmail,
      error: error?.message,
    });
    return { userId: null, isNewUser: false };
  }

  return { userId: data.user.id, isNewUser: true };
}

async function createSecureAccessLink(
  db: SupabaseClient,
  email: string,
  isNewUser: boolean,
  onboardingUrl: string,
): Promise<string | null> {
  try {
    const { data, error } = await db.auth.admin.generateLink({
      type: isNewUser ? 'recovery' : 'magiclink',
      email: email.toLowerCase().trim(),
      options: { redirectTo: onboardingUrl },
    });
    if (error) {
      logger.warn('[host-shop/provision] secure access link generation failed', {
        email,
        error: error.message,
      });
      return null;
    }
    return data?.properties?.action_link || null;
  } catch (error) {
    logger.warn('[host-shop/provision] secure access link generation threw', {
      email,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Provision conditional Host Shop portal access once the public application has
 * successfully saved all required compliance documents.
 *
 * This does NOT compliance-approve the shop. It creates the partner identity,
 * portal linkage and document records so the applicant can complete onboarding
 * while Elevate reviews the submitted evidence.
 */
export async function provisionHostShopApplication(
  input: ProvisionHostShopApplicationInput,
): Promise<ProvisionHostShopApplicationResult> {
  const { db } = input;
  const email = input.email.toLowerCase().trim();
  const programs = normalizedPrograms(input.programs);
  const primaryProgram = programs[0] || 'barber';
  const now = new Date().toISOString();
  const appUrl = (process.env.NEXT_PUBLIC_LMS_URL || 'https://app.elevateforhumanity.org').replace(/\/$/, '');
  const portalUrl = `${appUrl}/host-shop/login`;
  const onboardingUrl = `${appUrl}/auth/callback?redirect=${encodeURIComponent('/host-shop/onboarding')}`;

  const { data: existingPartner, error: existingPartnerError } = await db
    .from('partners')
    .select('id, approval_status, status, account_status, programs')
    .eq('contact_email', email)
    .maybeSingle();
  if (existingPartnerError) throw existingPartnerError;

  const existingPrograms = Array.isArray(existingPartner?.programs)
    ? existingPartner.programs.map(String)
    : [];
  const mergedPrograms = [...new Set([...existingPrograms, ...programs])];

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
    license_number: input.licenseNumber,
    supervisor_name: input.supervisorName,
    supervisor_license_number: input.supervisorLicenseNumber,
    supervisor_years_licensed: numericOrNull(input.supervisorYearsLicensed),
    compensation_model: input.compensationModel,
    number_of_employees: numericOrNull(input.numberOfEmployees),
    workers_comp_status: input.workersCompStatus,
    has_general_liability: true,
    can_supervise_and_verify: true,
    partner_type: input.businessType || 'host_shop',
    program_type: primaryProgram,
    programs: mergedPrograms,
    status: existingPartner?.status === 'active' ? 'active' : 'active',
    approval_status: existingPartner?.approval_status === 'approved' ? 'approved' : 'pending',
    account_status:
      existingPartner?.approval_status === 'approved' || existingPartner?.account_status === 'active'
        ? 'active'
        : 'conditional_access',
    documents_verified: existingPartner?.approval_status === 'approved' ? true : false,
    onboarding_completed: false,
    mou_acknowledged: true,
    updated_at: now,
  };

  let partnerId = existingPartner?.id as string | undefined;
  if (partnerId) {
    const { error } = await db.from('partners').update(partnerPayload).eq('id', partnerId);
    if (error) throw error;
  } else {
    const { data, error } = await db
      .from('partners')
      .insert({ ...partnerPayload, applied_at: now })
      .select('id')
      .single();
    if (error || !data?.id) throw error || new Error('Host Shop partner insert returned no id.');
    partnerId = data.id;
  }

  const identity = await resolveOrCreateUser(db, email, input.contactName);
  if (identity.userId) {
    const nameParts = input.contactName.trim().split(/\s+/);
    const firstName = nameParts.shift() || input.contactName;
    const lastName = nameParts.join(' ') || null;
    const { data: existingProfile } = await db
      .from('profiles')
      .select('id, role')
      .eq('id', identity.userId)
      .maybeSingle();

    if (!existingProfile) {
      await db.from('profiles').insert({
        id: identity.userId,
        email,
        full_name: input.contactName,
        first_name: firstName,
        last_name: lastName,
        phone: input.phone,
        role: 'partner',
      });
    } else if (!['admin', 'super_admin', 'org_admin', 'staff'].includes(String(existingProfile.role || ''))) {
      await db.from('profiles').update({ role: 'partner' }).eq('id', identity.userId);
    }

    const { error: userLinkError } = await db.from('partner_users').upsert(
      {
        user_id: identity.userId,
        partner_id: partnerId,
        role: 'partner_admin',
        status: 'active',
      },
      { onConflict: 'user_id,partner_id' },
    );
    if (userLinkError) throw userLinkError;
  }

  for (const programId of programs) {
    const { error } = await db.from('partner_program_access').upsert(
      { partner_id: partnerId, program_id: programId, revoked_at: null },
      { onConflict: 'partner_id,program_id' },
    );
    if (error) throw error;
  }

  const programSpecificLicense = primaryProgram === 'barber' ? 'barbershop_license' : 'salon_license';
  const docs = [
    [programSpecificLicense, input.documents.shopLicense],
    ['liability_insurance', input.documents.insurance],
    ['workers_comp', input.documents.workersComp],
    ['supervisor_license', input.documents.supervisorLicense],
    ['ein_letter', input.documents.ein],
    ...(input.documents.localBusiness ? [['business_license', input.documents.localBusiness]] : []),
  ] as Array<[string, string]>;

  for (const [documentType, path] of docs) {
    await db
      .from('partner_documents')
      .delete()
      .eq('partner_id', partnerId)
      .eq('document_type', documentType)
      .eq('program_id', primaryProgram);
    const { error } = await db.from('partner_documents').insert({
      partner_id: partnerId,
      document_type: documentType,
      program_id: primaryProgram,
      state: input.state || 'Indiana',
      display_name: fileName(path),
      file_name: fileName(path),
      file_url: path,
      status: 'pending',
      storage_bucket: 'documents',
    });
    if (error) throw error;
  }

  const partnershipPayload = {
    application_id: input.applicationId,
    partner_id: partnerId,
    business_name: input.businessName,
    business_type: input.businessType || 'other',
    license_number: input.licenseNumber,
    address: [input.address1, input.address2, input.city, input.state, input.zip].filter(Boolean).join(', '),
    contact_name: input.contactName,
    contact_email: email,
    contact_phone: input.phone,
    status: existingPartner?.approval_status === 'approved' ? 'active' : 'pending',
    partner_tier: 'free',
    portal_access_enabled: true,
    portal_access_at: now,
    onboarding_completed: false,
    metadata: {
      programs,
      source: 'host_shop_application',
      application_id: input.applicationId,
      conditional_access: existingPartner?.approval_status !== 'approved',
    },
    updated_at: now,
  };

  const { data: existingPartnership } = await db
    .from('host_shop_partnerships')
    .select('id')
    .or(`application_id.eq.${input.applicationId},partner_id.eq.${partnerId}`)
    .limit(1)
    .maybeSingle();

  if (existingPartnership?.id) {
    const { error } = await db
      .from('host_shop_partnerships')
      .update(partnershipPayload)
      .eq('id', existingPartnership.id);
    if (error) throw error;
  } else {
    const { error } = await db.from('host_shop_partnerships').insert(partnershipPayload);
    if (error) throw error;
  }

  await db
    .from('host_shop_applications')
    .update({
      intake: db.rpc ? undefined : undefined,
    })
    .eq('id', input.applicationId)
    .then(undefined, () => undefined);

  const accessLink = identity.userId
    ? await createSecureAccessLink(db, email, identity.isNewUser, onboardingUrl)
    : null;

  logger.info('[host-shop/provision] conditional Host Shop access provisioned', {
    applicationId: input.applicationId,
    partnerId,
    userId: identity.userId,
    programs,
  });

  return {
    partnerId,
    userId: identity.userId,
    isNewUser: identity.isNewUser,
    accessLink,
    portalUrl,
    onboardingUrl,
  };
}
