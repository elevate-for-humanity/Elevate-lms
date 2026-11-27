import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  generateGoogleNaturalVoice,
  GoogleSpeechNotConfiguredError,
} from '@/lib/ai/google-natural-voice';

const mocks = vi.hoisted(() => ({ generateSavedGoogleSpeech: vi.fn() }));

vi.mock('@/lib/api/withRateLimit', () => ({
  applyRateLimit: vi.fn(async () => null),
}));
vi.mock('@/lib/secrets', () => ({
  hydrateProcessEnv: vi.fn(async () => undefined),
}));
vi.mock('@/lib/ai/saved-google-speech', () => ({
  generateSavedGoogleSpeech: mocks.generateSavedGoogleSpeech,
}));

import { handleNaturalVoiceRequest } from '@/lib/ai/natural-voice-route';

function narrationRequest() {
  return new Request('http://localhost/api/voice/natural', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'Welcome to Elevate.' }),
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
  mocks.generateSavedGoogleSpeech.mockReset();
});

describe('natural voice route availability contract', () => {
  it('answers a graceful availability response when speech is not configured on the deployment', async () => {
    mocks.generateSavedGoogleSpeech.mockRejectedValue(new GoogleSpeechNotConfiguredError());

    const response = await handleNaturalVoiceRequest(narrationRequest());

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.code).toBe('not_configured');
    expect(body.available).toBe(false);
    expect(body.retryable).toBe(false);
  });

  it('keeps the honest retryable 503 when speech is configured but the provider fails', async () => {
    mocks.generateSavedGoogleSpeech.mockRejectedValue(
      new Error('Google Cloud speech returned HTTP 500 (UNKNOWN)'),
    );

    const response = await handleNaturalVoiceRequest(narrationRequest());

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.code).toBe('provider_unavailable');
    expect(body.retryable).toBe(true);
  });

  it('still serves generated audio on the success path', async () => {
    const audio = Buffer.from('ID3-fake-audio-bytes');
    mocks.generateSavedGoogleSpeech.mockResolvedValue({ audio, cache: 'stored' });

    const response = await handleNaturalVoiceRequest(narrationRequest());

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('audio/mpeg');
    expect(response.headers.get('X-Elevate-Speech-Cache')).toBe('stored');
    expect(Buffer.from(await response.arrayBuffer()).equals(audio)).toBe(true);
  });
});

describe('Google speech not-configured signal', () => {
  it('is a typed error carrying the established message when no credential exists', async () => {
    vi.stubEnv('K_SERVICE', '');
    vi.stubEnv('GOOGLE_CLOUD_API_KEY', '');

    const failure = await generateGoogleNaturalVoice('Welcome.').catch((cause) => cause);

    expect(failure).toBeInstanceOf(GoogleSpeechNotConfiguredError);
    expect(failure.message).toBe('Google Cloud speech is not configured');
  });
});
