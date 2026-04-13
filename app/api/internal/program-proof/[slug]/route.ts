// CRON ROUTE: internal-key gated — server-to-server verification only
/**
 * Internal proof route — verifies canonical DB state for a program slug.
 *
 * Protected by INTERNAL_API_KEY header. Server-side only.
 * Uses the same getPublishedProgramBySlug path the public page uses.
 * No fallbacks. No static imports. Throws on missing canonical data.
 *
 * Usage:
 *   curl -H "x-internal-key: $INTERNAL_API_KEY" \
 *     https://www.elevateforhumanity.org/api/internal/program-proof/hvac-technician
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // Auth check — must match INTERNAL_API_KEY env var
  const key = request.headers.get('x-internal-key');
  const expected = process.env.INTERNAL_API_KEY;

  if (!expected) {
    return NextResponse.json(
      { error: 'INTERNAL_API_KEY not configured on this environment' },
      { status: 503 }
    );
  }

  if (!key || key !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;

  const startMs = Date.now();

  try {
    const supabase = await getAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Admin client unavailable' }, { status: 503 });
    }

    const { data, error } = await supabase
      .from('programs')
      .select(`
        id, slug, title, published, delivery_model, length_weeks, certificate_title,
        program_media ( id, media_type, url, sort_order ),
        program_ctas ( id, cta_type, label, href, sort_order ),
        program_tracks ( id, track_code, title, funding_type, available, sort_order ),
        program_modules (
          id, module_number, title, sort_order,
          program_lessons ( id, lesson_number, title, sort_order )
        )
      `)
      .eq('slug', slug)
      .eq('published', true)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: `Published program not found for slug: ${slug}`, slug, query_ms: Date.now() - startMs },
        { status: 404 }
      );
    }

    const heroMedia = (data.program_media ?? []).filter(
      (m: { media_type: string }) => m.media_type === 'hero_image' || m.media_type === 'hero_video'
    );
    const totalLessons = (data.program_modules ?? []).reduce(
      (sum: number, mod: { program_lessons?: unknown[] }) => sum + (mod.program_lessons?.length ?? 0),
      0
    );
    const fundedTracks = (data.program_tracks ?? []).filter(
      (t: { funding_type: string }) => t.funding_type === 'funded'
    );

    return NextResponse.json({
      proof: {
        slug: data.slug,
        title: data.title,
        published: data.published,
        source: 'programs + program_media + program_ctas + program_tracks + program_modules + program_lessons (admin client)',
        counts: {
          media: (data.program_media ?? []).length,
          hero_media: heroMedia.length,
          ctas: (data.program_ctas ?? []).length,
          tracks: (data.program_tracks ?? []).length,
          funded_tracks: fundedTracks.length,
          modules: (data.program_modules ?? []).length,
          lessons: totalLessons,
        },
        hero_media_present: heroMedia.length > 0,
        cta_hrefs: (data.program_ctas ?? []).map((c: { cta_type: string; href: string; label: string }) => ({
          type: c.cta_type, href: c.href, label: c.label,
        })),
        track_titles: (data.program_tracks ?? []).map((t: { title: string; funding_type: string; available: boolean }) => ({
          title: t.title, funding_type: t.funding_type, available: t.available,
        })),
        module_titles: (data.program_modules ?? []).map((m: { title: string }) => m.title),
        delivery_model: data.delivery_model,
        length_weeks: data.length_weeks,
        certificate_title: data.certificate_title,
        queried_at: new Date().toISOString(),
        query_ms: Date.now() - startMs,
      },
    });
  } catch (err) {
    logger.error('[program-proof] unexpected error', { slug, err });
    return NextResponse.json(
      { error: 'Internal server error', slug, queried_at: new Date().toISOString(), query_ms: Date.now() - startMs },
      { status: 500 }
    );
  }
}
