// PUBLIC ROUTE: public reviews feed
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    
    const { data: reviews, error } = await supabase
      .from('curvature_reviews')
      .select('id, name, rating, text, date, service')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      logger.error('Failed to fetch curvature reviews:', error);
      return NextResponse.json({ reviews: [] });
    }

    return NextResponse.json({ reviews: reviews || [] });
  } catch (error) {
    logger.error('Error fetching curvature reviews:', error);
    return NextResponse.json({ reviews: [] });
  }
}
export const GET = withApiAudit('/api/curvature/reviews', _GET);
