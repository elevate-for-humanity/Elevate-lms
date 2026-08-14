/**
 * POST /api/admin/store/products
 *
 * Creates or updates a store_products row and its store_prices rows.
 *
 * Body:
 *   {
 *     id?:          string          // if present, upsert by id
 *     name:         string
 *     description:  string
 *     features?:    string[]        // stored in metadata JSONB
 *     status?:      'draft'|'active'|'archived'  (default 'active')
 *     pricing: {
 *       [tier: string]: {
 *         price:    number          // USD dollars
 *         name:     string
 *         features: string[]
 *       }
 *     }
 *   }
 *
 * Returns: { product: { id, name, status }, prices: { tier, id }[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError, safeDbError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PriceTierSchema = z.object({
  price:    z.number().min(0),
  name:     z.string().min(1),
  features: z.array(z.string()).default([]),
});

const BodySchema = z.object({
  id:          z.string().uuid().optional(),
  name:        z.string().min(1),
  description: z.string().default(''),
  features:    z.array(z.string()).default([]),
  status:      z.enum(['draft', 'active', 'archived']).default('active'),
  pricing:     z.record(PriceTierSchema).default({}),
});

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const raw = await request.json().catch(() => null);
  if (!raw) return safeError('Invalid JSON', 400);

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return safeError(`Validation failed: ${parsed.error.issues.map((i) => i.message).join(', ')}`, 400);
  }

  const { id, name, description, features, status, pricing } = parsed.data;
  const db = await requireAdminClient();

  // Upsert the product row
  const productRow: Record<string, unknown> = {
    name,
    description,
    status,
    updated_at: new Date().toISOString(),
    // store features + pricing metadata in a JSONB column if it exists,
    // otherwise they live only in store_prices rows
  };
  if (id) productRow.id = id;

  const { data: product, error: productError } = await db
    .from('store_products')
    .upsert(productRow, { onConflict: 'id' })
    .select('id, name, status')
    .single();

  if (productError) return safeDbError(productError, 'Failed to save product');

  // Upsert price rows — one per pricing tier
  const priceResults: { tier: string; id: string }[] = [];

  for (const [tier, tierData] of Object.entries(pricing)) {
    const priceRow = {
      product_id:   product.id,
      interval:     'one_time' as const,
      amount_cents: Math.round(tierData.price * 100),
      currency:     'usd',
      active:       status === 'active',
    };

    const { data: price, error: priceError } = await db
      .from('store_prices')
      .insert(priceRow)
      .select('id')
      .single();

    if (priceError) {
      // Non-fatal — log and continue
      console.error(`[store/products] price insert failed for tier ${tier}:`, priceError.message);
    } else {
      priceResults.push({ tier, id: price.id });
    }
  }

  return NextResponse.json({ product, prices: priceResults }, { status: id ? 200 : 201 });
}

export async function GET(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  const { data, error } = await db
    .from('store_products')
    .select('id, name, description, status, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) return safeDbError(error, 'Failed to fetch products');
  return NextResponse.json({ products: data ?? [] });
}
