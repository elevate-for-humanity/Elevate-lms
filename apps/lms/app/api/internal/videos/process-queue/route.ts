import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.elevateforhumanity.org';

/**
 * Compatibility shim only. Rendering belongs to the Admin/Course Factory runtime.
 * Keeping this lightweight endpoint preserves existing scheduler callers without
 * pulling Remotion, esbuild/Rspack, or edge-tts into the learner application.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const upstream = await fetch(`${ADMIN_URL}/api/internal/videos/process-queue`, {
      method: 'POST',
      headers: { authorization },
      cache: 'no-store',
    });
    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Video processing service unavailable' },
      { status: 502, headers: { 'cache-control': 'no-store' } },
    );
  }
}
