import { applyRateLimit } from '@/lib/api/withRateLimit';
import { getOpenAIClient, isOpenAIConfigured } from '@/lib/ai/openai-client';
import { hydrateProcessEnv } from '@/lib/secrets';

const ALLOWED_VOICES = new Set([
  'alloy',
  'ash',
  'ballad',
  'coral',
  'echo',
  'fable',
  'nova',
  'onyx',
  'sage',
  'shimmer',
]);

const STYLE_INSTRUCTIONS: Record<string, string> = {
  assistant:
    'Speak like a capable, friendly virtual assistant. Sound human, conversational, confident, and natural. Use clear phrasing and natural pauses. Never sound robotic, overly theatrical, or like an automated phone tree.',
  instructor:
    'Speak like an experienced instructor helping one learner. Use a clear, patient, natural conversational delivery with useful emphasis and natural pauses. Never sound robotic.',
  commercial:
    'Deliver this as a polished, persuasive commercial narrator. Sound modern, warm, energetic, and human. Use natural pauses and emphasis without sounding like a radio announcer or a synthetic voice.',
  default:
    'Use a warm, natural, conversational speaking style. Sound human and clear with natural pauses and emphasis. Never sound robotic or monotone.',
};

function classifyVoiceProviderError(cause: unknown): {
  code: 'billing_inactive' | 'rate_limited' | 'provider_unavailable';
  retryable: boolean;
} {
  const message = cause instanceof Error ? cause.message : String(cause ?? '');
  const normalized = message.toLowerCase();

  if (
    normalized.includes('account is not active') ||
    normalized.includes('billing') ||
    normalized.includes('insufficient_quota')
  ) {
    return { code: 'billing_inactive', retryable: false };
  }

  if (normalized.includes('429') || normalized.includes('rate limit')) {
    return { code: 'rate_limited', retryable: true };
  }

  return { code: 'provider_unavailable', retryable: true };
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

  const requestedVoice = typeof body?.voice === 'string' ? body.voice.trim().toLowerCase() : 'coral';
  const voice = ALLOWED_VOICES.has(requestedVoice) ? requestedVoice : 'coral';
  const style = typeof body?.style === 'string' ? body.style.trim().toLowerCase() : 'default';
  const instructions = STYLE_INSTRUCTIONS[style] ?? STYLE_INSTRUCTIONS.default;

  await hydrateProcessEnv();
  if (!isOpenAIConfigured()) {
    return Response.json(
      { error: 'Natural voice service is not configured.', code: 'not_configured', retryable: false },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  try {
    const openai = getOpenAIClient();
    const speech = await openai.audio.speech.create({
      model: 'gpt-4o-mini-tts',
      voice: voice as any,
      input: text,
      instructions,
      response_format: 'mp3',
    });

    const audio = await speech.arrayBuffer();
    return new Response(audio, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, no-store, max-age=0',
        'Content-Disposition': 'inline; filename="elevate-natural-voice.mp3"',
      },
    });
  } catch (cause) {
    const classification = classifyVoiceProviderError(cause);
    console.error(
      '[natural-voice] Speech generation failed',
      classification.code,
      cause instanceof Error ? cause.message : 'unknown provider error',
    );

    return Response.json(
      {
        error:
          classification.code === 'billing_inactive'
            ? 'Natural voice is unavailable because the voice provider account requires billing activation.'
            : 'Natural voice is temporarily unavailable.',
        code: classification.code,
        retryable: classification.retryable,
      },
      {
        status: classification.code === 'billing_inactive' ? 503 : 503,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  }
}
