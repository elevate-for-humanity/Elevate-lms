import { applyRateLimit } from '@/lib/api/withRateLimit';
import { generateCloudflareNaturalVoice } from '@/lib/ai/cloudflare-natural-voice';
import { hydrateProcessEnv } from '@/lib/secrets';
import { getOpenAIClient } from '@/lib/ai/openai-client';

async function generateOpenAINaturalVoice(text: string): Promise<ArrayBuffer> {
  if (!process.env.OPENAI_API_KEY) throw new Error('OpenAI voice is not configured');
  const response = await getOpenAIClient().audio.speech.create({
    model: 'gpt-4o-mini-tts',
    voice: 'nova',
    input: text,
    speed: 1.08,
    instructions:
      'Speak clearly, confidently, and conversationally at a brisk natural pace. Use crisp diction, short pauses, and no drawn-out or slurred words.',
    response_format: 'mp3',
  });
  return response.arrayBuffer();
}

export async function handleNaturalVoiceRequest(request: Request) {
  const limited = await applyRateLimit(request, 'public');
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  if (!text) return Response.json({ error: 'Text is required.' }, { status: 400 });
  if (text.length > 2400) {
    return Response.json({ error: 'Narration text is too long for one request.' }, { status: 413 });
  }

  await hydrateProcessEnv();

  try {
    const audio = await generateOpenAINaturalVoice(text).catch(() =>
      generateCloudflareNaturalVoice(text),
    );
    return new Response(audio, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, no-store, max-age=0',
        'Content-Disposition': 'inline; filename="elevate-natural-voice.mp3"',
      },
    });
  } catch (cause) {
    console.error('[natural-voice] Cloudflare speech generation failed', cause);

    return Response.json(
      {
        error: 'Natural voice is temporarily unavailable.',
        code: 'provider_unavailable',
        retryable: true,
      },
      {
        status: 503,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  }
}
