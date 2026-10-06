import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/ai/openai-client', () => ({
  getOpenAIClient: vi.fn(),
  isOpenAIConfigured: () => false,
}));
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn() },
}));

import {
  assertNarrationProviderConfigured,
  configuredNarrationProvider,
  DEFAULT_CLOUDFLARE_TTS_MODEL,
  DEFAULT_GEMINI_TTS_MODEL,
  generateEdgeTTS,
} from '@/lib/video/edge-tts';

describe('publication narration provider policy', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('routes production narration through self-hosted Kokoro by default', () => {
    expect(configuredNarrationProvider({ NODE_ENV: 'production' })).toBe('kokoro');
    expect(configuredNarrationProvider({
      NODE_ENV: 'production',
      CLOUDFLARE_ACCOUNT_ID: 'present-but-not-authoritative',
      CLOUDFLARE_AI_API_TOKEN: 'present-but-not-authoritative',
    })).toBe('kokoro');
  });

  it('does not silently bypass a failed configured route', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('AI_NARRATION_PROVIDER', 'cloudflare');
    vi.stubEnv('CLOUDFLARE_ACCOUNT_ID', 'test-account-id');
    vi.stubEnv('CLOUDFLARE_AI_API_TOKEN', 'test-cloudflare-token');
    vi.stubEnv('ELEVENLABS_API_KEY', 'would-have-worked');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{"error":"unavailable"}', { status: 503 }),
    );

    await expect(generateEdgeTTS('A production narration test.')).rejects.toThrow(
      /route "cloudflare" failed; no provider bypass was attempted.*503/,
    );
  });

  it('rejects diagnostic or unconfigured narration routes in production', () => {
    expect(() =>
      assertNarrationProviderConfigured({
        NODE_ENV: 'production',
        AI_NARRATION_PROVIDER: 'local',
      }),
    ).toThrow(/diagnostic-only/);
    expect(configuredNarrationProvider({ NODE_ENV: 'production' })).toBe('kokoro');
    expect(configuredNarrationProvider({ NODE_ENV: 'test' })).toBe('local');
  });

  it('accepts the configured local neural production provider', () => {
    expect(() =>
      assertNarrationProviderConfigured({
        NODE_ENV: 'production',
        AI_NARRATION_PROVIDER: 'kokoro',
      }),
    ).not.toThrow();
    expect(configuredNarrationProvider({ AI_NARRATION_PROVIDER: 'kokoro' })).toBe('kokoro');
  });

  it('selects the configured production provider before the request starts', () => {
    expect(DEFAULT_GEMINI_TTS_MODEL).toBe('gemini-2.5-flash-preview-tts');
    expect(configuredNarrationProvider({ AI_NARRATION_PROVIDER: 'gemini' })).toBe('gemini');
    expect(
      configuredNarrationProvider({ NODE_ENV: 'production', GEMINI_API_KEY: 'configured' }),
    ).toBe('kokoro');
  });
});
