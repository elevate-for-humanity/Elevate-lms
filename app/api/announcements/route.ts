import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

/**
 * GET /api/announcements
 * 
 * Fetches published announcements for the specified audience.
 * Returns empty array if no announcements (strict - no fake data).
 * 
 * Query params:
 * - audience: 'student' | 'staff' | 'partner' | 'admin' | 'all'
 * - limit: number (default 10)
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    if (!supabase) {
      return NextResponse.json({ announcements: [] });
    }

    const { searchParams } = new URL(request.url);
    const audience = searchParams.get('audience') || 'all';
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Query published announcements for this audience
    const { data, error } = await db
      .from('announcements')
      .select('id, title, body, severity, published_at')
      .eq('published', true)
      .or(`audience.eq.all,audience.eq.${audience}`)
      .or('expires_at.is.null,expires_at.gt.now()')
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Announcements fetch error:', error);
      return NextResponse.json({ announcements: [] });
    }

    return NextResponse.json({ announcements: data || [] });
  } catch (error) {
    logger.error('Announcements API error:', error);
    return NextResponse.json({ announcements: [] });
  }
}
