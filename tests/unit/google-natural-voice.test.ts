import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateGoogleNaturalVoice } from '@/lib/ai/google-natural-voice';
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe('Google website narration', () => {
  it('preserves the failure reason while excluding provider messages and credentials', async () => {
    vi.stubEnv('K_SERVICE', '');
    vi.stubEnv('GOOGLE_CLOUD_API_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: {
      status: 'PERMISSION_DENIED', message: 'private provider detail',
      details: [{ reason: 'SERVICE_DISABLED' }],
    } }, { status: 403 })));
    await expect(generateGoogleNaturalVoice('private narration text')).rejects.toThrow('HTTP 403 (SERVICE_DISABLED)');
  });
  it('uses the attached Cloud Run identity instead of the rejected API key', async () => {
    vi.stubEnv('K_SERVICE', 'elevate-marketing-migration');
    vi.stubEnv('GOOGLE_CLOUD_API_KEY', 'unused-key');
    const request = vi.fn()
      .mockResolvedValueOnce(Response.json({ access_token: 'test-access-token' }, { headers: { 'Metadata-Flavor': 'Google' } }))
      .mockResolvedValueOnce(Response.json({ audioContent: 'SUQz' }));
    vi.stubGlobal('fetch', request);
    expect(Buffer.from(await generateGoogleNaturalVoice('Welcome.')).toString()).toBe('ID3');
    expect(request.mock.calls[0][1].headers['Metadata-Flavor']).toBe('Google');
    expect(request.mock.calls[1][1].headers.Authorization).toBe('Bearer test-access-token');
    expect(request.mock.calls[1][1].headers['x-goog-api-key']).toBeUndefined();
  });
  it('rejects an untrusted metadata response before sending a token to the speech service', async () => {
    vi.stubEnv('K_SERVICE', 'elevate-marketing-migration');
    const request = vi.fn().mockResolvedValue(Response.json({ access_token: 'untrusted' }));
    vi.stubGlobal('fetch', request);
    await expect(generateGoogleNaturalVoice('Welcome.')).rejects.toThrow('identity is unavailable');
    expect(request).toHaveBeenCalledTimes(1);
  });
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
