import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'contact');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    const { text, voiceId = 'EXAVITQu4vr4xnSDxMaL' } = await request.json(); // Default: Bella voice

    // Option 1: ElevenLabs API (Premium, best quality)
    if (process.env.ELEVENLABS_API_KEY) {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            Accept: 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': process.env.ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error('ElevenLabs API error');
      }

      const audioBuffer = await response.arrayBuffer();

      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.byteLength.toString(),
        },
      });
    }

    // Option 2: Google Cloud Text-to-Speech (Good quality, affordable)
    if (process.env.GOOGLE_CLOUD_API_KEY) {
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_CLOUD_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: { text },
            voice: {
              languageCode: 'en-US',
              name: 'en-US-Neural2-F', // Female voice
              ssmlGender: 'FEMALE',
            },
            audioConfig: {
              audioEncoding: 'MP3',
              speakingRate: 0.9,
              pitch: 0,
            },
          }),
        }
      );

      const data = await response.json();

      if (data.audioContent) {
        const audioBuffer = Buffer.from(data.audioContent, 'base64');

        return new NextResponse(audioBuffer, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioBuffer.length.toString(),
          },
        });
      }
    }

    // Option 3: Return error if no API keys configured
    return NextResponse.json(
      {
        error:
          'No TTS API configured. Add ELEVENLABS_API_KEY or GOOGLE_CLOUD_API_KEY to environment variables.',
        fallback: 'Browser speech synthesis will be used instead.',
      },
      { status: 503 }
    );
  } catch (error) { 
    logger.error(
      'Text-to-speech error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
