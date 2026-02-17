import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getProduct, getRecommendations, getAvatarSalesMessage } from '@/lib/store/db';
import { applyRateLimit } from '@/lib/api/withRateLimit';
// AUTH: Intentionally public — no authentication required

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const { slug } = await params;

  try {
    const product = await getProduct(slug);
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Also fetch recommendations and sales message
    const [recommendations, salesMessage] = await Promise.all([
      getRecommendations(product.id),
      getAvatarSalesMessage(product.id),
    ]);

    return NextResponse.json({ 
      product,
      recommendations,
      salesMessage,
    });
  } catch (error) {
    logger.error('Product API error:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}
