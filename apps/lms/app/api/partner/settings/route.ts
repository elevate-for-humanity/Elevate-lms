import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireCurrentHostShopPartner } from '@/lib/partners/current-host-shop';

const settingsSchema = z.object({
  orgId: z.string().optional().nullable(),
  name: z.string().trim().min(1).max(255),
  address: z.string().trim().max(255),
  city: z.string().trim().max(100),
  state: z.string().trim().regex(/^[a-zA-Z]{2}$/).transform(value => value.toUpperCase()),
  contact_name: z.string().trim().max(255),
  contact_email: z.string().trim().email().max(255),
  contact_phone: z.string().trim().max(50),
  notification_preferences: z.object({
    email: z.boolean(), weekly_digest: z.boolean(), outcome_alerts: z.boolean(), referral_confirmations: z.boolean(),
  }).strict(),
}).strict();

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

  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) return safeError('Provide a valid shop name, contact email, two-letter state and notification preferences.', 400);

  const {
    name,
    address,
    city,
    state,
    contact_name,
    contact_email,
    contact_phone,
    notification_preferences,
  } = parsed.data;

  const orgId = partner.id;

  try {
    const { data: updated, error } = await db
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
      .eq('id', orgId)
      .select('id')
      .maybeSingle();

    if (error || !updated) return safeError('Failed to update settings', 500);

    return NextResponse.json({ success: true });
  } catch (err) {
    return safeInternalError(err, 'Failed to update partner settings');
  }
}
