import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';

/**
 * AI Music Generation API
 *
 * Generates background music for videos
 * Options:
 * 1. Use stock music from Pixabay (free)
 * 2. Generate with AI (future: Suno, MusicGen)
 */

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    const { prompt, duration = 60, style = 'upbeat' } = await request.json();

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // For now, search stock music that matches the prompt
    const audioUrl = await findMatchingMusic(prompt, style, duration);

    return NextResponse.json({
      success: true,
      audioUrl,
      duration,
      style,
      prompt,
    });
  } catch (error) {
    logger.error(
      'Music generation error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to generate music' },
      { status: 500 }
    );
  }
}

async function findMatchingMusic(
  prompt: string,
  style: string,
  duration: number
): Promise<string> {
  const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;

  if (PIXABAY_API_KEY) {
    try {
      // Search for music matching the style
      const response = await fetch(
        `https://pixabay.com/api/music/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(style)}&per_page=5`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.hits && data.hits.length > 0) {
          // Return the first matching track
          return data.hits[0].audio;
        }
      }
    } catch (error) {
      logger.error(
        'Pixabay music search error:',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  // No music found from any provider
  return '/audio/default-background.mp3';
}

/**
 * Future AI Music Generation Integration Examples
 */

// async function generateWithSuno(prompt: string, duration: number): Promise<string> {
//   const SUNO_API_KEY = process.env.SUNO_API_KEY;
//
//   if (!SUNO_API_KEY) {
//     throw new Error('Suno API key not configured');
//   }
//
//   const response = await fetch('https://api.suno.ai/v1/generate', {
//     method: 'POST',
//     headers: {
//       'Authorization': `Bearer ${SUNO_API_KEY}`,
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({
//       prompt,
//       duration,
//     }),
//   });
//
//   const data = await response.json();
//   return data.audio_url;
// }

// async function generateWithMusicGen(prompt: string, duration: number): Promise<string> {
//   // MusicGen by Meta - can be self-hosted
//   const response = await fetch('http://localhost:8000/generate', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({
//       prompt,
//       duration,
//       model: 'facebook/musicgen-medium',
//     }),
//   });
//
//   const data = await response.json();
//   return data.audio_url;
// }
export const POST = withApiAudit('/api/ai-studio/generate-music', _POST);
