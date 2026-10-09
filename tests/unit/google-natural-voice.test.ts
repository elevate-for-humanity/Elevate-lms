import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateGoogleNaturalVoice } from '@/lib/ai/google-natural-voice';
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe('Google website narration', () => {
  it('returns decoded MP3 audio using the server-side credential', async () => {
    vi.stubEnv('GOOGLE_CLOUD_API_KEY', 'test-key');
    const request = vi.fn().mockResolvedValue(Response.json({ audioContent: 'SUQz' }));
    vi.stubGlobal('fetch', request);
    expect(Buffer.from(await generateGoogleNaturalVoice('Welcome to Elevate.')).toString()).toBe('ID3');
    const [url, options] = request.mock.calls[0];
    expect(url).not.toContain('test-key');
    expect(options.headers['x-goog-api-key']).toBe('test-key');
    expect(JSON.parse(options.body).input.text).toBe('Welcome to Elevate.');
  });
  it('reports provider failures instead of returning silence as successful audio', async () => {
    vi.stubEnv('GOOGLE_CLOUD_API_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 403 })));
    await expect(generateGoogleNaturalVoice('Welcome.')).rejects.toThrow('HTTP 403');
  });
});
