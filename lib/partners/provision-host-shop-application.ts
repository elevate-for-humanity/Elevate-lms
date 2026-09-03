import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { normalizeHostShopProgram } from '@/lib/partners/host-shop-onboarding';
import { ensureCanonicalHostShopInfrastructure } from '@/lib/partners/ensure-canonical-host-shop';

export type HostShopUploadedDocuments = { shopLicense: string; insurance: string; workersComp: string; supervisorLicense: string; ein: string; localBusiness?: string | null };
export type ProvisionHostShopApplicationInput = { db: SupabaseClient; applicationId: string; businessName: string; legalBusinessName: string; ownerName: string; contactName: string; email: string; phone: string; address1: string; address2?: string | null; city: string; state: string; zip: string; businessType: string; licenseNumber: string; supervisorName: string; supervisorLicenseNumber: string; supervisorYearsLicensed?: string | number | null; workersCompStatus: string; compensationModel: string; numberOfEmployees?: string | number | null; programs: string[]; documents: HostShopUploadedDocuments };
export type ProvisionHostShopApplicationResult = { partnerId: string; userId: string | null; isNewUser: boolean; accessLink: string | null; portalUrl: string; onboardingUrl: string };
type AuthUserSummary = { id: string; email?: string | null };

function numericOrNull(value: string | number | null | undefined) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }
function fileName(path: string) { return path.split('/').pop() || path; }
function normalizedPrograms(programs: string[]) { return [...new Set(programs.map((program) => normalizeHostShopProgram(program)).filter(Boolean))] as string[]; }

async function resolveOrCreateUser(db: SupabaseClient, email: string, contactName: string): Promise<{ userId: string | null; isNewUser: boolean }> {
  const normalizedEmail = email.toLowerCase().trim();
  const { data: profile } = await db.from('profiles').select('id, role').eq('email', normalizedEmail).maybeSingle();
  if (profile?.id) return { userId: profile.id as string, isNewUser: false };
  try {
    const { data: users } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = ((users?.users ?? []) as AuthUserSummary[]).find((user) => user.email?.toLowerCase() === normalizedEmail);
    if (existing?.id) return { userId: existing.id, isNewUser: false };
  } catch (error) { logger.warn('[host-shop/provision] auth user lookup failed', { email: normalizedEmail, error: error instanceof Error ? error.message : String(error) }); }
  const tempPassword = `${crypto.randomUUID().replace(/-/g, '')}Aa1!`;
  const { data, error } = await db.auth.admin.createUser({ email: normalizedEmail, password: tempPassword, email_confirm: true, user_metadata: { full_name: contactName, role: 'partner', portal: 'host_shop' } });
  if (error || !data.user?.id) { logger.error('[host-shop/provision] auth user creation failed', undefined, { email: normalizedEmail, error: error?.message }); return { userId: null, isNewUser: false }; }
  return { userId: data.user.id, isNewUser: true };
}

/**
 * Canonical owner-access contract used by every Host Shop intake path.
 * Creating a partner row without this identity/profile/membership chain leaves
 * a shop approved in Admin but unable to sign in to its portal.
 */
export async function ensureHostShopOwnerAccess(input: {
  db: SupabaseClient;
  partnerId: string;
  email: string;
  contactName: string;
  phone?: string | null;
}) {
  const email = input.email.toLowerCase().trim();
  const identity = await resolveOrCreateUser(input.db, email, input.contactName);
  if (!identity.userId) throw new Error('HOST_SHOP_OWNER_IDENTITY_NOT_CREATED');

  const parts = input.contactName.trim().split(/\s+/);
  const firstName = parts.shift() || input.contactName;
  const lastName = parts.join(' ') || null;
  const { data: existingProfile } = await input.db
    .from('profiles')
    .select('id, role')
    .eq('id', identity.userId)
    .maybeSingle();

  if (!existingProfile) {
    const { error } = await input.db.from('profiles').insert({
      id: identity.userId,
      email,
      full_name: input.contactName,
      first_name: firstName,
      last_name: lastName,
      phone: input.phone || null,
      role: 'partner',
    });
    if (error) throw error;
  } else if (!['admin', 'super_admin', 'org_admin', 'staff'].includes(String(existingProfile.role || ''))) {
    const { error } = await input.db
      .from('profiles')
      .update({ role: 'partner', full_name: input.contactName, phone: input.phone || null })
      .eq('id', identity.userId);
    if (error) throw error;
  }

  const { error: membershipError } = await input.db.from('partner_users').upsert(
    {
      user_id: identity.userId,
      partner_id: input.partnerId,
      role: 'partner_admin',
      status: 'active',
    },
    { onConflict: 'user_id,partner_id' },
  );
  if (membershipError) throw membershipError;

  return identity;
}

async function createSecureAccessLink(db: SupabaseClient, email: string, isNewUser: boolean, onboardingUrl: string): Promise<string | null> {
  try {
    const { data, error } = await db.auth.admin.generateLink({ type: isNewUser ? 'recovery' : 'magiclink', email: email.toLowerCase().trim(), options: { redirectTo: onboardingUrl } });
    if (error) return null;
    return data?.properties?.action_link || null;
  } catch { return null; }
}

export async function provisionHostShopApplication(input: ProvisionHostShopApplicationInput): Promise<ProvisionHostShopApplicationResult> {
  const { db } = input;
  const email = input.email.toLowerCase().trim();
  const programs = normalizedPrograms(input.programs);
  const primaryProgram = programs[0] || 'barber';
  const now = new Date().toISOString();
  const appUrl = (process.env.NEXT_PUBLIC_LMS_URL || 'https://app.elevateforhumanity.org').replace(/\/$/, '');
  const portalUrl = `${appUrl}/host-shop/login`;
  const onboardingUrl = `${appUrl}/auth/callback?redirect=${encodeURIComponent('/host-shop/onboarding')}`;

  const { data: existingPartner, error: existingPartnerError } = await db.from('partners').select('id, approval_status, status, account_status, programs').eq('contact_email', email).maybeSingle();
  if (existingPartnerError) throw existingPartnerError;
  const existingPrograms = Array.isArray(existingPartner?.programs) ? existingPartner.programs.map(String) : [];
  const mergedPrograms = [...new Set([...existingPrograms, ...programs])];
  const alreadyApproved = existingPartner?.approval_status === 'approved';
  const partnerPayload = { name: input.businessName, legal_name: input.legalBusinessName, shop_name: input.businessName, owner_name: input.ownerName, contact_name: input.contactName, contact_email: email, phone: input.phone, contact_phone: input.phone, address_line1: input.address1, address_line2: input.address2 || null, city: input.city, state: input.state || 'Indiana', zip: input.zip, license_number: input.licenseNumber, supervisor_name: input.supervisorName, supervisor_license_number: input.supervisorLicenseNumber, supervisor_years_licensed: numericOrNull(input.supervisorYearsLicensed), compensation_model: input.compensationModel, number_of_employees: numericOrNull(input.numberOfEmployees), workers_comp_status: input.workersCompStatus, has_general_liability: true, can_supervise_and_verify: true, partner_type: input.businessType || 'host_shop', program_type: primaryProgram, programs: mergedPrograms, status: 'active', approval_status: alreadyApproved ? 'approved' : 'pending', account_status: alreadyApproved || existingPartner?.account_status === 'active' ? 'active' : 'conditional_access', documents_verified: false, onboarding_completed: alreadyApproved ? undefined : false, mou_acknowledged: true, updated_at: now };

  let partnerId = existingPartner?.id as string | undefined;
  if (partnerId) { const { error } = await db.from('partners').update(partnerPayload).eq('id', partnerId); if (error) throw error; }
  else { const { data, error } = await db.from('partners').insert({ ...partnerPayload, onboarding_completed: false, applied_at: now }).select('id').single(); if (error || !data?.id) throw error || new Error('Host Shop partner insert returned no id.'); partnerId = data.id; }

  const identity = await ensureHostShopOwnerAccess({
    db,
    partnerId,
    email,
    contactName: input.contactName,
    phone: input.phone,
  });

  for (const programId of programs) { const { error } = await db.from('partner_program_access').upsert({ partner_id: partnerId, program_id: programId, can_view_apprentices: true, can_enter_progress: true, can_view_reports: true, revoked_at: null }, { onConflict: 'partner_id,program_id' }); if (error) throw error; }

  const canonical = await ensureCanonicalHostShopInfrastructure({ db, partnerId, ownerId: identity.userId, businessName: input.businessName, businessType: input.businessType, contactName: input.contactName, contactEmail: email, contactPhone: input.phone, address1: input.address1, address2: input.address2, city: input.city, state: input.state, zip: input.zip, licenseNumber: input.licenseNumber });

  const programSpecificLicense = primaryProgram === 'barber' ? 'barbershop_license' : 'salon_license';
  const docs = [[programSpecificLicense,input.documents.shopLicense],['liability_insurance',input.documents.insurance],['workers_comp',input.documents.workersComp],['supervisor_license',input.documents.supervisorLicense],['ein_letter',input.documents.ein],...(input.documents.localBusiness ? [['business_license',input.documents.localBusiness]] : [])] as Array<[string,string]>;
  for (const [documentType,path] of docs) {
    const { error: deleteError } = await db.from('partner_documents').delete().eq('partner_id', partnerId).eq('document_type', documentType).eq('program_id', primaryProgram); if (deleteError) throw deleteError;
    const { error } = await db.from('partner_documents').insert({ partner_id: partnerId, document_type: documentType, program_id: primaryProgram, state: input.state || 'Indiana', display_name: fileName(path), file_name: fileName(path), file_url: path, status: alreadyApproved ? 'accepted' : 'pending', storage_bucket: 'documents' }); if (error) throw error;
  }

  const { error: partnershipError } = await db.from('host_shop_partnerships').update({ application_id: input.applicationId, shop_id: canonical.shopId, status: alreadyApproved ? 'active' : 'pending', metadata: { programs, source: 'host_shop_application', application_id: input.applicationId, conditional_access: !alreadyApproved }, updated_at: now }).eq('partner_id', partnerId);
  if (partnershipError) throw partnershipError;

  // Finalize the canonical verification state only after partner, documents, and partnership all exist.
  // The RPC is service-role only and is idempotent.
  const { error: verificationError } = await db.rpc('evaluate_host_shop_verification', { p_partner_id: partnerId });
  if (verificationError) throw new Error(`HOST_SHOP_VERIFICATION_FINALIZE_FAILED:${verificationError.message}`);

  const accessLink = identity.userId ? await createSecureAccessLink(db, email, identity.isNewUser, onboardingUrl) : null;
  logger.info('[host-shop/provision] Host Shop application provisioned and verification evaluated', { applicationId: input.applicationId, partnerId, userId: identity.userId, programs });
  return { partnerId, userId: identity.userId, isNewUser: identity.isNewUser, accessLink, portalUrl, onboardingUrl };
}
