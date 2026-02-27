import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { z } from 'zod';
import { createStoreProduct } from '@/lib/store/stripe-products';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/authGuards';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';

const createProductSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  price: z.union([z.string(), z.number()]).transform(Number).pipe(z.number().positive()),
  repo: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
});
import { requireActiveLicense, LicenseError, licenseErrorResponse } from '@/lib/license/requireActiveLicense';
import { TenantContextError } from '@/lib/tenant';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const auth = await apiRequireAdmin();
    if (auth instanceof NextResponse) return auth;

    // STEP 5B: Require active license for paid features
    await requireActiveLicense();
    
    const body = await req.json();
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`) },
        { status: 400 }
      );
    }
    const { title, price, repo, description } = parsed.data;

    // Create product in Stripe
    const { product, price: priceObj } = await createStoreProduct(
      title,
      Number(price),
      repo,
      description
    );

    // Store in Supabase
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const { data, error }: any = await db
      .from('products')
      .insert({
        title,
        description,
        price: Number(price),
        repo,
        stripe_product_id: product.id,
        stripe_price_id: priceObj.id,
      })
      .select()
      .single();

    if (error) {
      logger.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save product', details: toErrorMessage(error) },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      productId: data.id,
      stripeProductId: product.id,
    });
  } catch (error) {
    // Handle license errors with proper status codes
    if (error instanceof LicenseError) {
      return licenseErrorResponse(error);
    }
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: 'Internal server error' }, { status: error.statusCode });
    }
    
    logger.error(
      'Create product error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      {
        error: 'Failed to create product',
        message: toErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/store/create-product', _POST);
