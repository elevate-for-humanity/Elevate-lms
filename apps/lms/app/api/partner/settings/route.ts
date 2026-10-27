import { NextRequest, NextResponse } from 'next/server';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireCurrentHostShopPartner } from '@/lib/partners/current-host-shop';

export async function PATCH(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  let context;
  try {
    context = await requireCurrentHostShopPartner();
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    if (code === 'HOST_SHOP_UNAUTHENTICATED') return safeError('Unauthorized', 401);
    return safeError('Forbidden', 403);
  }
  const { db, partner } = context;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return safeError('Invalid request body', 400);
  }

  const {
    name,
    address,
    city,
    state,
    contact_name,
    contact_email,
    contact_phone,
    notification_preferences,
  } = body;

  const orgId = partner.id;

  try {
    const { error } = await db
      .from('partners')
      .update({
        name,
        address_line1: address,
        city,
        state,
        contact_name,
        contact_email,
        contact_phone,
        notification_preferences,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orgId);

    if (error) return safeError('Failed to update settings', 500);

    return NextResponse.json({ success: true });
  } catch (err) {
    return safeInternalError(err, 'Failed to update partner settings');
  }
}
