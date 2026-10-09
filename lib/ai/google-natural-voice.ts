/** Cloud Run uses its attached service identity; local runtimes may use an API key. */
export async function generateGoogleNaturalVoice(text: string): Promise<ArrayBuffer> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (process.env.K_SERVICE) {
    const metadata = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token', {
      headers: { 'Metadata-Flavor': 'Google' },
      redirect: 'error',
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });
    if (!metadata.ok || metadata.headers.get('Metadata-Flavor') !== 'Google')
      throw new Error('Google Cloud speech service identity is unavailable');
    const token = await metadata.json();
    if (typeof token.access_token !== 'string' || !token.access_token)
      throw new Error('Google Cloud speech service identity returned no token');
    headers.Authorization = `Bearer ${token.access_token}`;
  } else {
    const key = process.env.GOOGLE_CLOUD_API_KEY?.trim();
    if (!key) throw new Error('Google Cloud speech is not configured');
    headers['x-goog-api-key'] = key;
  }
  const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: 'en-US', name: 'en-US-Neural2-F' },
      audioConfig: { audioEncoding: 'MP3', speakingRate: 1 },
    }),
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`Google Cloud speech returned HTTP ${response.status}`);
  const body = await response.json();
  if (typeof body.audioContent !== 'string' || !body.audioContent)
    throw new Error('Google Cloud speech returned no audio');
  const audio = Uint8Array.from(Buffer.from(body.audioContent, 'base64'));
  if (!audio.length) throw new Error('Google Cloud speech returned empty audio');
  return audio.buffer;
}
