/**
 * Preserve the media integrity gate when natural voice uses a private,
 * immutable speech cache in front of the canonical Google TTS provider.
 * This checks source wiring, not actual Google credentials or live synthesis.
 */
export function verifiedGoogleNaturalVoiceChain({route = '', saved = '', google = ''} = {}) {
  const canonicalProvider = google.includes('https://texttospeech.googleapis.com/v1/text:synthesize') &&
    google.includes('en-US-Neural2-F');
  if (!canonicalProvider) return false;

  const directRoute = /import\s*\{\s*generateGoogleNaturalVoice\s*\}\s*from\s*['"](?:@\/lib\/ai\/google-natural-voice|\.\/google-natural-voice)['"]/.test(route) &&
    /\bawait\s+generateGoogleNaturalVoice\s*\(/.test(route);
  const cachedRoute = /import\s*\{\s*generateSavedGoogleSpeech\s*\}\s*from\s*['"]@\/lib\/ai\/saved-google-speech['"]/.test(route) &&
    /\bawait\s+generateSavedGoogleSpeech\s*\(/.test(route);
  const cachedImplementation = /import\s*\{\s*generateGoogleNaturalVoice\s*\}\s*from\s*['"]\.\/google-natural-voice['"]/.test(saved) &&
    /\bsynthesize:\s*async\s*\(\)\s*=>\s*Buffer\.from\(\s*await\s+generateGoogleNaturalVoice\s*\(/.test(saved) &&
    /\.getBucket\(\s*['"]speech-cache['"]\s*\)/.test(saved) &&
    /\bconfiguration\.public\b/.test(saved) &&
    /SPEECH_CACHE_PRIVATE_BUCKET_REQUIRED/.test(saved);
  return directRoute || (cachedRoute && cachedImplementation);
}
