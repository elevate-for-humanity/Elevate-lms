import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifiedGoogleNaturalVoiceChain} from '../../scripts/integrity/natural-voice-provider-contract.mjs';

const source=(path)=>readFileSync(new URL('../../'+path,import.meta.url),'utf8');
const route=source('lib/ai/natural-voice-route.ts');
const saved=source('lib/ai/saved-google-speech.ts');
const google=source('lib/ai/google-natural-voice.ts');

test('production cached voice route retains private bucket and canonical Google TTS',()=>{
  assert.equal(verifiedGoogleNaturalVoiceChain({route,saved,google}),true);
});
test('renamed or disconnected speech handler never counts as Google natural voice',()=>{
  assert.equal(verifiedGoogleNaturalVoiceChain({
    route:route.replace('generateSavedGoogleSpeech','generateUnverifiedSpeech'),saved,google,
  }),false);
  assert.equal(verifiedGoogleNaturalVoiceChain({
    route:route.replace("from '@/lib/ai/saved-google-speech'","from '@/lib/ai/unverified-speech'"),saved,google,
  }),false);
});
test('cached provider must still call real Google and fail closed on a public bucket',()=>{
  assert.equal(verifiedGoogleNaturalVoiceChain({
    route,saved:saved.replace('SPEECH_CACHE_PRIVATE_BUCKET_REQUIRED','CACHE_ALLOW_PUBLIC'),google,
  }),false);
  assert.equal(verifiedGoogleNaturalVoiceChain({
    route,saved:saved.replace('generateGoogleNaturalVoice(text,speaker)','generateLocalAudio(text,speaker)'),google,
  }),false);
  assert.equal(verifiedGoogleNaturalVoiceChain({
    route,saved,google:google.replace('https://texttospeech.googleapis.com/v1/text:synthesize','https://example.invalid/speech'),
  }),false);
});
test('direct canonical Google route remains eligible when explicitly imported and awaited',()=>{
  const direct="import {generateGoogleNaturalVoice} from '@/lib/ai/google-natural-voice';\nawait generateGoogleNaturalVoice(text);";
  assert.equal(verifiedGoogleNaturalVoiceChain({route:direct,google}),true);
});
