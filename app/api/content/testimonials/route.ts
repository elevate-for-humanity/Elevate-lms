import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
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
