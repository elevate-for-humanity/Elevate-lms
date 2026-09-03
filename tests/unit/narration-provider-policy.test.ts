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
  DEFAULT_GEMINI_TTS_MODEL,
  generateEdgeTTS,
} from '@/lib/video/edge-tts';

describe('publication narration provider policy', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    edgeTts.mockReset();
  });

  it('uses the documented Gemini Flash TTS model by default', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('GEMINI_API_KEY', 'test-key');
    vi.stubEnv('GEMINI_TTS_MODEL', '');
    vi.stubEnv('ELEVENLABS_API_KEY', '');
    edgeTts.mockRejectedValue(new Error('datacenter endpoint rejected request'));
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{"error":{"message":"model request rejected"}}', { status: 404 }),
    );

    await expect(generateEdgeTTS('A production narration test.')).rejects.toThrow(
      /Gemini: Gemini TTS returned 404.*Edge TTS: datacenter endpoint rejected request/,
    );

    expect(DEFAULT_GEMINI_TTS_MODEL).toBe('gemini-2.5-flash-preview-tts');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(`/models/${DEFAULT_GEMINI_TTS_MODEL}:generateContent`),
      expect.any(Object),
    );
  });
});
