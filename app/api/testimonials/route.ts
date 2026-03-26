import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

/**
 * GET /api/testimonials
 * 
 * Returns published testimonials.
 * Query params:
 * - featured: boolean - only featured testimonials
 * - limit: number - max results
 * 
 * Strict: Returns empty array if no data (never fake data).
 */
async function _GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    let query = supabase
      .from('testimonials')
      .select('id, quote, name, role, program')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (featured) {
      query = query.eq('featured', true);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Testimonials fetch error:', error);
      return NextResponse.json({ testimonials: [] });
    }

    return NextResponse.json({ testimonials: data || [] });
  } catch (error) {
    logger.error('Testimonials API error:', error);
    return NextResponse.json({ testimonials: [] });
  }
}
export const GET = withApiAudit('/api/testimonials', _GET);
