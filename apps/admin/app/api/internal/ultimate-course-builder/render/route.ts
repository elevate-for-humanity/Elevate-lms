import { NextRequest, NextResponse } from 'next/server';
import { hydrateProcessEnv } from '@/lib/secrets';
import { renderStoryboardVideo } from '@/lib/video/remotion-render';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 1800;

function authorized(request: NextRequest): boolean {
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  const allowed = [
    process.env.ULTIMATE_MEDIA_SERVICE_SECRET,
    process.env.CRON_SECRET,
  ].filter((value): value is string => Boolean(value?.trim()));
  return Boolean(bearer && allowed.some((value) => value.trim() === bearer));
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const lessonId = typeof body?.lessonId === 'string' ? body.lessonId.trim() : '';
  const courseTitle =
    typeof body?.courseTitle === 'string' && body.courseTitle.trim()
      ? body.courseTitle.trim()
      : 'Ultimate Course';
  const storyboard = body?.storyboard;
  const instructorId =
    typeof body?.instructorId === 'string' && body.instructorId.trim()
      ? body.instructorId.trim()
      : undefined;

  if (!lessonId) {
    return NextResponse.json({ error: 'lessonId is required' }, { status: 400 });
  }
  if (!storyboard || !Array.isArray(storyboard.scenes) || storyboard.scenes.length === 0) {
    return NextResponse.json({ error: 'storyboard.scenes is required' }, { status: 400 });
  }

  await hydrateProcessEnv();

  try {
    const result = await renderStoryboardVideo({
      lessonId,
      courseTitle,
      storyboard,
      instructorId,
    } as any);

    if (!result?.success) {
      return NextResponse.json(
        { error: result?.error || 'Ultimate render failed', result },
        { status: 502 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[ultimate-media:render] failed', { lessonId, message });
    return NextResponse.json(
      { error: 'Ultimate render failed', code: message.slice(0, 160) },
      { status: 502 },
    );
  }
}
