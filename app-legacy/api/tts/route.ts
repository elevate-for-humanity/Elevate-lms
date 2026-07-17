// PUBLIC ROUTE: Text-to-speech synthesis for lesson audio. Rate-limited via
// applyRateLimit('public'). No user data is read or written.
import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;


const DEFAULT_VOICE = 'en-US-JennyNeural';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'public');
  if (rateLimited) return rateLimited;

  try {
    const { text, voice = DEFAULT_VOICE } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Limit text length
    const trimmedText = text.slice(0, 1000);

    // Dynamic import with turbopackIgnore — edge-tts ships index.ts which
    // Turbopack cannot bundle. The package is in serverExternalPackages so
    // Node.js resolves it at runtime. The ignore comment prevents Turbopack
    // from tracing into the package during the build.
    const { tts } = await import(/* turbopackIgnore: true */ 'edge-tts');

    // Generate audio buffer
    const audioBuffer = await tts(trimmedText, {
      voice: voice,
      rate: '+0%',
      pitch: '+0Hz',
      volume: '+0%',
    });

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    logger.error('TTS API error:', error);
    return NextResponse.json({ error: 'TTS generation failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'public');
  if (rateLimited) return rateLimited;

  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text');
  const voice = searchParams.get('voice') || DEFAULT_VOICE;

  if (!text) {
    return NextResponse.json({ error: 'Text parameter required' }, { status: 400 });
  }

  const mockRequest = new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ text, voice }),
    headers: { 'Content-Type': 'application/json' },
  });

  return POST(mockRequest);
}
