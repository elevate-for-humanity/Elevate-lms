import { applyRateLimit } from '@/lib/api/withRateLimit';
import { GoogleSpeechNotConfiguredError } from '@/lib/ai/google-natural-voice';
import { generateSavedGoogleSpeech } from '@/lib/ai/saved-google-speech';
import { hydrateProcessEnv } from '@/lib/secrets';

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
    const result = await generateSavedGoogleSpeech(text, typeof body?.voice === 'string' ? body.voice : 'warm');
    return new Response(new Uint8Array(result.audio), {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, no-store, max-age=0',
        'Content-Disposition': 'inline; filename="elevate-natural-voice.mp3"',
        'X-Elevate-Speech-Cache': result.cache,
      },
    });
  } catch (cause) {
    if (cause instanceof GoogleSpeechNotConfiguredError) {
      // Deployment state, not a transient failure: this deployment has no
      // speech credential, so there is nothing to retry. Answer with a
      // graceful availability response (no error status) so narration
      // clients take their sanctioned no-narration path instead of
      // logging a failed resource load on every narrated page.
      return Response.json(
        {
          error: 'Natural voice is not configured on this deployment.',
          code: 'not_configured',
          available: false,
          retryable: false,
        },
        {
          status: 200,
          headers: { 'Cache-Control': 'no-store' },
        },
      );
    }

    console.error('[natural-voice] Google speech generation failed', cause);

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
