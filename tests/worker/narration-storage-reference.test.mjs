import test, {beforeEach, afterEach, mock} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {stripTypeScriptTypes} from 'node:module';

// Stub only storage credentials/signing. Exercise the production analyzer's
// URL validation and download boundary without a live bucket or credentials.
const storage = {signed: [], result: null};
globalThis.__narrationStorageTest = storage;
let source = readFileSync(new URL('../../lib/ultimate-course-builder/quality/narration-audio-analysis.ts', import.meta.url), 'utf8');
source = source.replace(/import\s*\{[^}]+\}\s*from ['"]\.\.\/\.\.\/storage\/elevate-media-storage['"];?/, `
const getElevateMediaStorageConfig = () => ({endpoint:process.env.ELEVATE_MEDIA_ENDPOINT, bucket:process.env.ELEVATE_MEDIA_BUCKET, publicUrl:process.env.ELEVATE_MEDIA_PUBLIC_URL || ''});
const getSignedElevateMediaUrl = async key => {globalThis.__narrationStorageTest.signed.push(key); return globalThis.__narrationStorageTest.result;};
`);
const {analyzeNarrationAudio, deriveNarrationMetrics} = await import('data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(source, {mode:'transform'}) + '\n//# sourceURL=narration-audio-analysis.test-runtime.js').toString('base64'));
const endpoint = 'https://s3.us-east-005.backblazeb2.com';
const bucket = 'elevate-course-media';
const key = 'course-videos/generated-lessons/lesson-test.mp4';
const virtual = `https://${bucket}.s3.us-east-005.backblazeb2.com/${key}`;
const saved = virtual + '?X-Amz-Date=20260101T000000Z&X-Amz-Expires=1&X-Amz-Signature=expired';
const renewed = virtual + '?X-Amz-Signature=fresh';
let previous;
beforeEach(() => {
  previous = {...process.env};
  process.env.ELEVATE_MEDIA_ENDPOINT = endpoint;
  process.env.ELEVATE_MEDIA_BUCKET = bucket;
  process.env.ELEVATE_MEDIA_PUBLIC_URL = '';
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
  storage.signed = []; storage.result = renewed;
});
afterEach(() => {
  mock.restoreAll();
  for (const name of Object.keys(process.env)) if (!(name in previous)) delete process.env[name];
  Object.assign(process.env, previous);
});
const analyze = audioUrl => analyzeNarrationAudio({audioUrl, transcript:'Test narration.', deliveredMp4:true});

test('configured virtual-host B2 checkpoint renews the exact key before download', async () => {
  const requests = [];
  mock.method(globalThis, 'fetch', async (url, options) => {requests.push({url:String(url),options});return new Response('',{status:503});});
  await assert.rejects(analyze(saved), /NARRATION_ANALYSIS_AUDIO_FETCH_FAILED:503/);
  assert.deepEqual(storage.signed, [key]);
  assert.equal(requests[0].url, renewed);
  assert.equal(requests[0].options.redirect, 'error');
});

test('path-style B2 reference renews to the same virtual-host object', async () => {
  mock.method(globalThis, 'fetch', async () => new Response('', {status:503}));
  await assert.rejects(analyze(`${endpoint}/${bucket}/${key}?expired=1`), /NARRATION_ANALYSIS_AUDIO_FETCH_FAILED:503/);
  assert.deepEqual(storage.signed, [key]);
});

test('foreign buckets, lookalike hosts, unsafe paths and credentials never sign or fetch', async () => {
  let requests = 0;
  mock.method(globalThis, 'fetch', async () => {requests++;throw Error('unexpected fetch');});
  for (const value of [
    `https://other.s3.us-east-005.backblazeb2.com/${key}`,
    `https://${bucket}.s3.us-east-005.backblazeb2.com.attacker.example/${key}`,
    `${endpoint}/other/${key}`,
    virtual.replace('course-videos/', 'private/'),
    virtual.replace('lesson-test.mp4', '%2e%2e%2fprivate.mp4'),
    virtual.replace('lesson-test.mp4', 'bad%5cfile.mp4'),
    virtual.replace('lesson-test.mp4', 'bad%00file.mp4'),
    virtual.replace('lesson-test.mp4', 'bad%7ffile.mp4'),
    virtual.replace('https://', 'http://'),
    virtual.replace('https://', 'https://user:password@'),
  ]) await assert.rejects(analyze(value), /NARRATION_ANALYSIS_UNTRUSTED_AUDIO_URL/);
  assert.equal(requests, 0);assert.equal(storage.signed.length, 0);
});

test('signing failure never falls back to the expired checkpoint URL', async () => {
  storage.result = null;
  mock.method(globalThis, 'fetch', async () => {throw Error('unexpected fetch');});
  await assert.rejects(analyze(saved), /NARRATION_ANALYSIS_MEDIA_SIGNING_FAILED/);
});

test('renewed response must match the finished-media checksum', async () => {
  mock.method(globalThis, 'fetch', async () => new Response('different media',{headers:{'content-type':'video/mp4'}}));
  await assert.rejects(analyzeNarrationAudio({audioUrl:saved,transcript:'Test',deliveredMp4:true,expectedMediaSha256:'a'.repeat(64)}), /NARRATION_ANALYSIS_MEDIA_CHECKSUM_MISMATCH/);
});

test('public media delivery prefix renews the configured bucket object', async () => {
  process.env.ELEVATE_MEDIA_PUBLIC_URL = 'https://media.example/lessons';
  mock.method(globalThis, 'fetch', async () => new Response('', {status:503}));
  await assert.rejects(analyze(`https://media.example/lessons/${key}`), /AUDIO_FETCH_FAILED:503/);
  assert.deepEqual(storage.signed, [key]);
  await assert.rejects(analyze(`https://media.example/unrelated/${key}`), /UNTRUSTED_AUDIO_URL/);
});

test('renewed credentials cannot substitute a different stored object', async () => {
  storage.result = renewed.replace('lesson-test.mp4', 'different.mp4');
  mock.method(globalThis, 'fetch', async () => {throw Error('unexpected fetch');});
  await assert.rejects(analyze(saved), /MEDIA_REFERENCE_MISMATCH/);
});

test('configured Supabase public and signed course media remain accepted', async () => {
  mock.method(globalThis, 'fetch', async () => new Response('', {status:503}));
  for (const kind of ['public','sign']) {
    await assert.rejects(analyze(`https://project.supabase.co/storage/v1/object/${kind}/course-videos/lesson.mp4`), /AUDIO_FETCH_FAILED:503/);
  }
  assert.equal(storage.signed.length, 0);
});

test('matching renewed media reaches real ffprobe and ffmpeg analysis', async () => {
  const media = execFileSync('ffmpeg', ['-hide_banner','-loglevel','error','-f','lavfi','-i',
    'sine=frequency=440:duration=2','-c:a','aac','-f','mp4','-movflags','frag_keyframe+empty_moov','pipe:1']);
  mock.method(globalThis, 'fetch', async () => new Response(media, {headers:{'content-type':'video/mp4'}}));
  const metrics = await analyzeNarrationAudio({audioUrl:saved,transcript:'Test waveform.',deliveredMp4:true,
    expectedMediaSha256:createHash('sha256').update(media).digest('hex')});
  assert.equal(metrics.durationSeconds.measured, true);
  assert.ok(metrics.durationSeconds.value >= 2 && metrics.durationSeconds.value < 2.1);
  assert.equal(metrics.clippedWords.value, 0);
  assert.deepEqual(storage.signed, [key]);
});

test('existing measured speech metrics and clipping detection remain unchanged', () => {
  const transcript = Array.from({length:301},(_,i)=>`word${i}`).join(' ');
  const metrics = deriveNarrationMetrics(transcript,{durationSeconds:145.968,maxVolumeDb:-2.1,meanVolumeDb:-25.1,unnaturalPauseCount:0});
  assert.ok(Math.abs(metrics.wordsPerMinute.value - 123.73) < 0.01);
  assert.equal(metrics.clippedWords.value, 0);
  assert.equal(metrics.monotoneScore.value, 0);
  assert.equal(deriveNarrationMetrics('Test',{durationSeconds:2,maxVolumeDb:-0.1,meanVolumeDb:-20,unnaturalPauseCount:0}).clippedWords.value, 1);
});
