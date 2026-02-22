import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

    // Fetch testimonials
    const { data: testimonials } = await db
      .from('testimonials')
      .select('name, role, quote')
      .eq('approved', true)
      .eq('service_type', 'training')
      .order('display_order')
      .limit(5);

    // Fetch partners
    const { data: partners } = await db
      .from('partners')
      .select('name, logo_url')
      .eq('is_active', true)
      .eq('featured', true)
      .order('display_order')
      .limit(6);

    // Fetch FAQs
    const { data: faqs } = await db
      .from('faqs')
      .select('question, answer')
      .eq('is_active', true)
      .eq('category', 'general')
      .order('display_order')
      .limit(5);

    return NextResponse.json({
      testimonials: testimonials || [],
      partners: partners || [],
      faqs: faqs || [],
    });
  } catch (error) {
    logger.error('Error fetching homepage content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}
