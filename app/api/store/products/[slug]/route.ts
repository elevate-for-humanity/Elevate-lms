// PUBLIC ROUTE: Store catalog product detail for checkout flow
import { NextRequest, NextResponse } from 'next/server';
import { getCatalogProduct } from '@/lib/store/db';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/store/products/:slug
 * Returns a single product from the DB catalog.
 */
async function _GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const rateLimited = await applyRateLimit(_req, 'api');
  if (rateLimited) return rateLimited;
  const { slug } = await params;

  if (!slug || slug.length > 100) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  let product = null;
  try {
    product = await getCatalogProduct(slug);
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  return NextResponse.json({ product, source: 'database' });
}
export const GET = withApiAudit('/api/store/products/[slug]', _GET);
