import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Renders a single slide frame as PNG for preview.
 * POST { slide, slideIndex, totalSlides, opts }
 * Requires admin role.
 */
export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  try {
    const auth = await apiRequireAdmin(req);
    if (auth.error) return auth.error;
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: msg === 'FORBIDDEN' ? 403 : 401 },
    );
  }

  const body = await req.json();
  const { slide, slideIndex, totalSlides, opts } = body;

  let renderSlideFrameForPreview: (...args: unknown[]) => Promise<Buffer>;
  try {
    const mod = await import('@/server/lesson-video-renderer');
    renderSlideFrameForPreview = mod.renderSlideFrameForPreview;
  } catch {
    return NextResponse.json(
      { error: 'Video renderer unavailable — canvas native library not installed on this server.' },
      { status: 503 },
    );
  }

  const buf: Buffer = await renderSlideFrameForPreview!(slide, slideIndex, totalSlides, opts);

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store',
    },
  });
}
