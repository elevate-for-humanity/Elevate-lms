// PUBLIC ROUTE: public product recommendations
import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getRecommendations, getAvatarSalesMessage } from '@/lib/store/db';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
// AUTH: Intentionally public — no authentication required

async function _GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const { productId } = await params;

  try {
    const [recommendations, salesMessage] = await Promise.all([
      getRecommendations(productId),
      getAvatarSalesMessage(productId),
    ]);

    return NextResponse.json({ 
      recommendations,
      salesMessage,
    });
  } catch (error) {
    logger.error('Recommendations API error:', error);
    return NextResponse.json({ 
      recommendations: [], 
      salesMessage: null,
      error: 'Failed to fetch recommendations' 
    }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/recommendations/[productId]', _GET);
