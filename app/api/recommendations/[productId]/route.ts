import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getRecommendations, getAvatarSalesMessage } from '@/lib/store/db';
import { applyRateLimit } from '@/lib/api/withRateLimit';
// AUTH: Intentionally public — no authentication required

export async function GET(
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
