import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getRecommendations, getAvatarSalesMessage } from '@/lib/store/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
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
