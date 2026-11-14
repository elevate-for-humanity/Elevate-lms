import { NextRequest, NextResponse } from 'next/server';
import { loadOwnedLearnerTest } from '@/lib/ultimate-course-builder/testing/test-run-access';
import { signedLessonPlayback } from '@/lib/storage/lesson-playback';
import { streamLessonMedia } from '@/lib/storage/lesson-stream';
import { renderPlaybackUrl } from '@/lib/ultimate-course-builder/media/playback-source.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Params = { params: Promise<{ runId: string }> };
const privateHeaders = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' };

/** Same-origin delivery for a marked, temporary QA learner. Raw private object
 * URLs stay server-side and every range or caption request rechecks ownership. */
export async function GET(request: NextRequest, { params }: Params) {
  const runId = (await params).runId;
  const access = await loadOwnedLearnerTest(runId);
  if (!access) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: privateHeaders });
  const asset = request.nextUrl.searchParams.get('asset') ?? 'video';
  if (!['video', 'captions'].includes(asset))
    return NextResponse.json({ error: 'Invalid lesson media type' }, { status: 400, headers: privateHeaders });
  const render = access.run.snapshot?.render ?? {};
  const source = asset === 'captions' ? render.captionsUrl : renderPlaybackUrl(render);
  if (typeof source !== 'string' || !source)
    return NextResponse.json({ error: 'Lesson media unavailable' }, { status: 404, headers: privateHeaders });
  try {
    const signed = await signedLessonPlayback(access.db, source);
    return streamLessonMedia(request, signed, asset as 'video' | 'captions');
  } catch {
    return NextResponse.json({ error: 'Lesson media unavailable' }, { status: 503, headers: privateHeaders });
  }
}
