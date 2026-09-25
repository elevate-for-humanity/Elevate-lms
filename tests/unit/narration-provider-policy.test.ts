import { afterEach, describe, expect, it, vi } from 'vitest';

const { edgeTts } = vi.hoisted(() => ({ edgeTts: vi.fn() }));

vi.mock('edge-tts', () => ({ tts: edgeTts }));
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
    edgeTts.mockReset();
  });

  it('routes narration through Cloudflare Workers AI by default', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('AI_NARRATION_PROVIDER', '');
    vi.stubEnv('CLOUDFLARE_ACCOUNT_ID', 'test-account-id');
    vi.stubEnv('CLOUDFLARE_AI_API_TOKEN', 'test-cloudflare-token');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(Buffer.from('test-mp3'), {
        status: 200,
        headers: { 'content-type': 'audio/mpeg' },
      }),
    );

    await expect(generateEdgeTTS('A production narration test.')).resolves.toEqual(
      Buffer.from('test-mp3'),
    );

    expect(DEFAULT_CLOUDFLARE_TTS_MODEL).toBe('@cf/deepgram/aura-1');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(`/ai/run/${DEFAULT_CLOUDFLARE_TTS_MODEL}`),
      expect.objectContaining({
        headers: expect.objectContaining({ 'cf-aig-gateway-id': 'default' }),
      }),
    );
    expect(edgeTts).not.toHaveBeenCalled();
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
    expect(edgeTts).not.toHaveBeenCalled();
  });

  it('rejects diagnostic narration routes in production', () => {
    expect(() => assertNarrationProviderConfigured({
      NODE_ENV: 'production',
      AI_NARRATION_PROVIDER: 'edge',
    })).toThrow(/diagnostic-only/);
    expect(configuredNarrationProvider({ NODE_ENV: 'production' })).toBe('cloudflare');
    expect(configuredNarrationProvider({ NODE_ENV: 'test' })).toBe('local');
  });

  it('keeps Gemini available only when explicitly selected', () => {
    expect(DEFAULT_GEMINI_TTS_MODEL).toBe('gemini-2.5-flash-preview-tts');
    expect(configuredNarrationProvider({ AI_NARRATION_PROVIDER: 'gemini' })).toBe('gemini');
  });
});
