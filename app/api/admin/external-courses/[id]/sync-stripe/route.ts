/**
 * POST /api/admin/external-courses/[id]/sync-stripe
 *
 * Creates or updates the Stripe product + price for a program_external_courses row.
 * Also accepts cost_cents and payer_rule in the body so the admin can set pricing
 * and trigger sync in one request.
 *
 * Idempotent: if stripe_product_id already exists, updates the product name/description
 * and creates a new price only when cost_cents has changed.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { getStripe } from '@/lib/stripe/client';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  cost_cents: z.number().int().min(0),
  payer_rule: z.enum(['sponsored', 'always_student', 'always_elevate']),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = await apiRequireAdmin(req);

  const body = await req.json().catch(() => null);
  if (!body) return safeError('Invalid JSON', 400);

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
    return safeError(msg, 422);
  }

  const { cost_cents, payer_rule } = parsed.data;

  const db = await getAdminClient();

  // Fetch the row
  const { data: row, error: fetchErr } = await db
    .from('program_external_courses')
    .select('id, title, description, partner_name, stripe_product_id, stripe_price_id, cost_cents')
    .eq('id', id)
    .single();

  if (fetchErr || !row) return safeError('External course not found', 404);

  const stripe = getStripe();
  if (!stripe) return safeError('Stripe is not configured', 503);

  const productName = `${row.partner_name} — ${row.title}`;
  const description  = row.description ?? undefined;

  let stripeProductId: string = row.stripe_product_id ?? '';
  let stripePriceId:   string = row.stripe_price_id   ?? '';

  try {
    if (stripeProductId) {
      // Update existing product metadata
      await stripe.products.update(stripeProductId, {
        name: productName,
        description,
        metadata: { kind: 'external_course', external_course_id: id },
      });
    } else {
      // Create new product
      const product = await stripe.products.create({
        name: productName,
        description,
        metadata: { kind: 'external_course', external_course_id: id },
      });
      stripeProductId = product.id;
    }

    // Create a new price only when cost_cents changed (prices are immutable in Stripe)
    const priceChanged = cost_cents !== row.cost_cents;
    if (!stripePriceId || priceChanged) {
      if (cost_cents === 0) {
        // Free — no Stripe price needed; clear any stale price id
        stripePriceId = '';
      } else {
        const price = await stripe.prices.create({
          product: stripeProductId,
          unit_amount: cost_cents,
          currency: 'usd',
        });
        stripePriceId = price.id;
      }
    }
  } catch (err) {
    logger.error('Stripe sync error', { id, err });
    return safeInternalError(err, 'Stripe sync failed');
  }

  // Persist back to DB
  const { data: updated, error: updateErr } = await db
    .from('program_external_courses')
    .update({
      cost_cents,
      payer_rule,
      stripe_product_id: stripeProductId || null,
      stripe_price_id:   stripePriceId   || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id, title, cost_cents, payer_rule, stripe_product_id, stripe_price_id')
    .single();

  if (updateErr) {
    logger.error('DB update after Stripe sync failed', updateErr);
    return safeInternalError(updateErr, 'DB update failed');
  }

  logger.info('External course synced to Stripe', { id, stripeProductId, cost_cents });
  return NextResponse.json({ ok: true, item: updated });
}
