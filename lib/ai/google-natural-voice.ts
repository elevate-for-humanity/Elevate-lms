/** Website speech uses the existing Google Cloud speech credential. */
export async function generateGoogleNaturalVoice(text: string): Promise<ArrayBuffer> {
  const key = process.env.GOOGLE_CLOUD_API_KEY?.trim();
  if (!key) throw new Error('Google Cloud speech is not configured');
  const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
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
