import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeDbError, safeError } from '@/lib/api/safe-error';
import { provisionPartnerFromBarberApplication } from '@/lib/partners/provision-barber-partner';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type StatusPayload = {
  id?: string;
  status?: 'approved' | 'denied';
  notes?: string | null;
};

async function updateStatus(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { id, status, notes } = (await request.json()) as StatusPayload;
  if (!id || !status) return safeError('id and status required', 400);
  if (!['approved', 'denied'].includes(status)) return safeError('Invalid status', 400);

  const db = await requireAdminClient();

  const { data: application, error: fetchError } = await db
    .from('barbershop_partner_applications')
    .select(
      'id, status, contact_email, contact_name, contact_phone, owner_name, shop_legal_name, shop_dba_name, shop_address_line1, shop_address_line2, shop_city, shop_state, shop_zip, shop_physical_address, indiana_shop_license_number, supervisor_name, supervisor_license_number, supervisor_years_licensed, compensation_model, workers_comp_status, can_supervise_and_verify, mou_signed_at, mou_signature_data',
    )
    .eq('id', id)
    .maybeSingle();

  if (fetchError) return safeDbError(fetchError, 'Failed to load barbershop application');
  if (!application) return safeError('Application not found', 404);

  const { error } = await db
    .from('barbershop_partner_applications')
    .update({
      status,
      internal_notes: notes ?? null,
      reviewed_by: auth.userId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return safeDbError(error, 'Failed to update barbershop application');

  let partnerId: string | null = null;
  if (status === 'approved') {
    let linkUserId: string | undefined;
    try {
      const { data: byEmail } = await db.auth.admin.getUserByEmail(
        application.contact_email.toLowerCase(),
      );
      linkUserId = byEmail.user?.id;
    } catch {
      // Applicant may claim the account later; provisioning still creates/updates the partner row.
    }

    const provisioned = await provisionPartnerFromBarberApplication(db, application, {
      approvedBy: auth.userId,
      linkUserId,
    });
    partnerId = provisioned?.partnerId ?? null;
    if (!partnerId) {
      logger.warn('[barber-shop-status] partner provisioning failed after approval', { id });
    }
  }

  return NextResponse.json({ ok: true, status, partnerId });
}

export const PATCH = updateStatus;
export const POST = updateStatus;
