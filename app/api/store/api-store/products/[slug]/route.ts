// PUBLIC ROUTE: public store product page
// AUTH: Intentionally public — no authentication required
import { NextRequest, NextResponse } from 'next/server';
import { getCatalogProduct } from '@/lib/store/db';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/store/products/:slug
 * Returns a single product from the DB catalog.
 * Used by checkout pages to look up product details.
 * Falls back to hardcoded catalog if DB returns null (migration not yet run).
 */
async function _GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug || slug.length > 100) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  // Try DB first; fall back to hardcoded on error OR null result
  let product = null;
  const source = 'database';
  try {
    product = await getCatalogProduct(slug);
  } catch {
    // DB unavailable — fall through to hardcoded
  }

  if (!product) {
    const { getProductBySlug } = await import('@/app/data/store-products');
    const hardcoded = getProductBySlug(slug);
    if (hardcoded) {
      return NextResponse.json({
        product: {
          id: hardcoded.id,
          slug: hardcoded.slug,
          name: hardcoded.name,
          description: hardcoded.description,
          price: hardcoded.price,
          billingType: hardcoded.billingType,
          licenseType: hardcoded.licenseType,
          features: hardcoded.features,
          setupFeeCents: 0,
          isActive: true,
        },
        source: 'hardcoded',
      });
    }
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  return NextResponse.json({ product, source });
}
export const GET = withApiAudit('/api/store/products/[slug]', _GET);
