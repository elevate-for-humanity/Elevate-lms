import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

export type BarberPartnerApplicationRow = {
  id: string;
  shop_legal_name: string;
  shop_dba_name?: string | null;
  owner_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  shop_address_line1: string;
  shop_address_line2?: string | null;
  shop_city: string;
  shop_state?: string | null;
  shop_zip: string;
  indiana_shop_license_number: string;
  supervisor_name: string;
  supervisor_license_number: string;
  supervisor_years_licensed?: number | null;
  compensation_model?: string | null;
  workers_comp_status?: string | null;
  can_supervise_and_verify?: boolean | null;
  mou_signed_at?: string | null;
  mou_signature_data?: string | null;
};

/** Upsert a `partners` row from an approved barbershop_partner_applications record. */
export async function provisionPartnerFromBarberApplication(
  db: SupabaseClient,
  app: BarberPartnerApplicationRow,
  options?: { approvedBy?: string; linkUserId?: string },
): Promise<{ partnerId: string } | null> {
  const email = app.contact_email.toLowerCase().trim();
  const displayName = app.shop_dba_name?.trim() || app.shop_legal_name.trim();

  const { data: existing } = await db
    .from('partners')
    .select('id')
    .eq('contact_email', email)
    .or('program_type.eq.barber,program_type.is.null')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let partnerId = existing?.id as string | undefined;

  const partnerPayload: Record<string, unknown> = {
    name: displayName,
    legal_name: app.shop_legal_name.trim(),
    shop_name: displayName,
    owner_name: app.owner_name.trim(),
    contact_name: app.contact_name.trim(),
    contact_email: email,
    contact_phone: app.contact_phone.trim(),
    address_line1: app.shop_address_line1.trim(),
    address_line2: app.shop_address_line2?.trim() || null,
    city: app.shop_city.trim(),
    state: app.shop_state || 'IN',
    zip: app.shop_zip.trim(),
    license_number: app.indiana_shop_license_number.trim(),
    supervisor_name: app.supervisor_name.trim(),
    supervisor_license_number: app.supervisor_license_number.trim(),
    supervisor_years_licensed: app.supervisor_years_licensed ?? null,
    compensation_model: app.compensation_model ?? null,
    workers_comp_status: app.workers_comp_status ?? null,
    can_supervise_and_verify: app.can_supervise_and_verify ?? true,
    partner_type: 'barber',
    program_type: 'barber',
    approval_status: 'approved',
    status: 'active',
    account_status: 'conditional_access',
    documents_verified: false,
    onboarding_completed: false,
    mou_signed: !!app.mou_signed_at,
    mou_signed_at: app.mou_signed_at ?? null,
    updated_at: new Date().toISOString(),
  };

  if (options?.approvedBy) {
    partnerPayload.approved_at = new Date().toISOString();
    partnerPayload.approved_by = options.approvedBy;
  }

  if (partnerId) {
    const { error } = await db.from('partners').update(partnerPayload).eq('id', partnerId);
    if (error) {
      logger.error('[provision-barber-partner] update failed', undefined, { error: error.message, partnerId });
      return null;
    }
  } else {
    const { data: inserted, error } = await db
      .from('partners')
      .insert({
        ...partnerPayload,
        applied_at: new Date().toISOString(),
      })
      .select('id')
      .maybeSingle();
    if (error || !inserted) {
      logger.error('[provision-barber-partner] insert failed', undefined, { error: error?.message });
      return null;
    }
    partnerId = inserted.id;
  }

  if (options?.linkUserId && partnerId) {
    const { error: linkErr } = await db.from('partner_users').upsert(
      {
        partner_id: partnerId,
        user_id: options.linkUserId,
        role: 'owner',
        status: 'active',
      },
      { onConflict: 'partner_id,user_id' },
    );
    if (linkErr) {
      logger.warn('[provision-barber-partner] partner_users link failed (non-fatal)', {
        error: linkErr.message,
      });
    }

    await db
      .from('profiles')
      .update({ role: 'partner' })
      .eq('id', options.linkUserId)
      .neq('role', 'admin')
      .neq('role', 'admin')
      .then(undefined, () => undefined);
  }

  await db
    .from('barbershop_partner_applications')
    .update({ partner_id: partnerId })
    .eq('id', app.id)
    .then(undefined, () => undefined);

  return partnerId ? { partnerId } : null;
}
