import { NextRequest, NextResponse } from 'next/server';
import { getMarketingPageBySlug } from '@/lib/api/marketing';
import { applyRateLimit } from '@/lib/api/withRateLimit';
// AUTH: Intentionally public — no authentication required

/**
 * GET /api/marketing/[slug]
 * 
 * Returns marketing page with sections.
 * Strict: 404 if not published or missing required fields.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const { slug } = await params;

  if (!slug || typeof slug !== 'string') {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  const page = await getMarketingPageBySlug(slug);

  if (!page) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  return NextResponse.json({ page });
}
