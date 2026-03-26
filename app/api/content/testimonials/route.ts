import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const searchParams = request.nextUrl.searchParams;
  const serviceType = searchParams.get('serviceType');
  const programSlug = searchParams.get('programSlug');
  const featured = searchParams.get('featured') === 'true';
  const limit = parseInt(searchParams.get('limit') || '10');

  try {
    const supabase = await createClient();

    let query = supabase
      .from('testimonials')
      .select('*')
      .eq('approved', true)
      .order('display_order', { ascending: true });

    if (serviceType) {
      query = query.eq('service_type', serviceType);
    }
    if (programSlug) {
      query = query.eq('program_slug', programSlug);
    }
    if (featured) {
      query = query.eq('featured', true);
    }
    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching testimonials:', error);
      return NextResponse.json({ testimonials: [] });
    }

    return NextResponse.json({ testimonials: data || [] });
  } catch (error) {
    logger.error('Error in testimonials API:', error);
    return NextResponse.json({ testimonials: [] });
  }
}
export const GET = withApiAudit('/api/content/testimonials', _GET);
