// AUTH: Enforced inside handler — delegates to /api/lessons/[lessonId]/complete which requires auth
/**
 * Legacy lesson completion endpoint.
 * Delegates to the gated /api/lessons/[lessonId]/complete which enforces
 * enrollment, quiz pass, and minimum seat time requirements.
 */
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  const { lessonId } = await params;

  // Forward to the gated endpoint with all original headers (auth cookies)
  const gatewayUrl = new URL(`/api/lessons/${lessonId}/complete`, request.url);
  const body = await request.text().catch(() => '{}');

  const response = await fetch(gatewayUrl.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: request.headers.get('cookie') || '',
      authorization: request.headers.get('authorization') || '',
    },
    body,
  });

  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data, { status: response.status });
}
