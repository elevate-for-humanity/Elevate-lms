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
import { getPublishedProgramBySlug } from '@/lib/programs/getProgramBySlug';

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
    const program = await getPublishedProgramBySlug(slug);

    const heroMedia = program.program_media.filter(
      (m) => m.media_type === 'hero_image' || m.media_type === 'hero_video'
    );

    const totalLessons = program.program_modules.reduce(
      (sum, mod) => sum + (mod.program_lessons?.length ?? 0),
      0
    );

    const fundedTracks = program.program_tracks.filter(
      (t) => t.funding_type === 'funded'
    );

    return NextResponse.json({
      proof: {
        slug: program.slug,
        title: program.title,
        published: program.published,
        source: 'programs + program_media + program_ctas + program_tracks + program_modules + program_lessons',
        counts: {
          media: program.program_media.length,
          hero_media: heroMedia.length,
          ctas: program.program_ctas.length,
          tracks: program.program_tracks.length,
          funded_tracks: fundedTracks.length,
          modules: program.program_modules.length,
          lessons: totalLessons,
        },
        hero_media_present: heroMedia.length > 0,
        cta_hrefs: program.program_ctas.map((c) => ({ type: c.cta_type, href: c.href, label: c.label })),
        track_titles: program.program_tracks.map((t) => ({ title: t.title, funding_type: t.funding_type, available: t.available })),
        module_titles: program.program_modules.map((m) => m.title),
        delivery_model: program.delivery_model,
        length_weeks: program.length_weeks,
        certificate_title: program.certificate_title,
        queried_at: new Date().toISOString(),
        query_ms: Date.now() - startMs,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        error: message,
        slug,
        queried_at: new Date().toISOString(),
        query_ms: Date.now() - startMs,
      },
      { status: 404 }
    );
  }
}
