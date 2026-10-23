#!/usr/bin/env node
/**
 * Non-destructive production B2 caption acceptance probe.
 * Run only in an authorized environment with the Course Builder's existing
 * ELEVATE_MEDIA_* variables. Writes a unique temporary test object, verifies
 * the exact bytes by authenticated GET, then deletes only that test object.
 * No bucket policy change, no course mutation, no worker job dispatch.
 */
import { randomUUID, createHash } from 'node:crypto';
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

let runtime = {};
if (process.env.COURSE_B2_CONFIG_STDIN === 'true') {
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk;
    if (input.length > 100_000) throw Error('B2_PROBE_CONFIG_INPUT_TOO_LARGE');
  }
  const parsed = JSON.parse(input);
  const names = ['ELEVATE_MEDIA_ENDPOINT','ELEVATE_MEDIA_REGION','ELEVATE_MEDIA_BUCKET',
    'ELEVATE_MEDIA_ACCESS_KEY_ID','ELEVATE_MEDIA_SECRET_ACCESS_KEY'];
  runtime = Object.fromEntries(names.map(name => [name, parsed[name]]));
}
const env = {...process.env, ...runtime};
const required = ['ELEVATE_MEDIA_ENDPOINT', 'ELEVATE_MEDIA_REGION', 'ELEVATE_MEDIA_BUCKET',
  'ELEVATE_MEDIA_ACCESS_KEY_ID', 'ELEVATE_MEDIA_SECRET_ACCESS_KEY'];
const missing = required.filter(key => !env[key]?.trim());
if (missing.length) {
  console.error(JSON.stringify({ok:false,phase:'configuration',missing}));
  process.exit(2);
}
const endpoint = new URL(env.ELEVATE_MEDIA_ENDPOINT);
if (endpoint.protocol !== 'https:' || !/^s3\.[a-z0-9-]+\.backblazeb2\.com$/i.test(endpoint.hostname)
  || endpoint.hostname.split('.')[1] !== env.ELEVATE_MEDIA_REGION) {
  console.error(JSON.stringify({ok:false,phase:'configuration',reason:'B2_ENDPOINT_REGION_MISMATCH'}));
  process.exit(2);
}
const client = new S3Client({endpoint:endpoint.origin, region:env.ELEVATE_MEDIA_REGION,
  forcePathStyle: false, credentials:{accessKeyId:env.ELEVATE_MEDIA_ACCESS_KEY_ID,
    secretAccessKey:env.ELEVATE_MEDIA_SECRET_ACCESS_KEY}});
const key = 'course-videos/acceptance-probes/' + randomUUID() + '.vtt';
const body = Buffer.from('WEBVTT\n\n00:00:00.000 --> 00:00:01.000\nStorage acceptance probe\n');
const sha = value => createHash('sha256').update(value).digest('hex');
let uploaded = false;
try {
  await client.send(new PutObjectCommand({Bucket:env.ELEVATE_MEDIA_BUCKET,Key:key,Body:body,
    ContentType:'text/vtt',CacheControl:'private, max-age=0, no-store'}));
  uploaded = true;
  const head = await client.send(new HeadObjectCommand({Bucket:env.ELEVATE_MEDIA_BUCKET,Key:key}));
  if (head.ContentLength !== body.length) throw new Error('CAPTION_LENGTH_MISMATCH');
  if (head.ContentType?.split(';')[0]?.trim()?.toLowerCase() !== 'text/vtt') throw new Error('CAPTION_MIME_MISMATCH');
  const response = await client.send(new GetObjectCommand({Bucket:env.ELEVATE_MEDIA_BUCKET,Key:key}));
  const readback = Buffer.from(await response.Body.transformToByteArray());
  if (sha(readback) !== sha(body)) throw new Error('CAPTION_SHA256_MISMATCH');
  console.log(JSON.stringify({ok:true,phase:'caption-upload-and-readback',bytes:body.length,
    sha256:sha(body),provider:'backblaze-b2'}));
} catch (error) {
  // Never log provider exceptions: they may contain signed request details.
  console.error(JSON.stringify({ok:false,phase:'caption-upload-and-readback',
    code: /^[A-Z_]+$/.test(error?.message??'') ? error.message : 'B2_PROBE_FAILED',
    httpStatus:error?.$metadata?.httpStatusCode ?? null}));
  process.exitCode = 1;
} finally {
  if (uploaded) {
    try {
      await client.send(new DeleteObjectCommand({Bucket:env.ELEVATE_MEDIA_BUCKET,Key:key}));
    } catch {
      console.error(JSON.stringify({ok:false,phase:'probe-cleanup',reason:'TEST_OBJECT_CLEANUP_FAILED'}));
      process.exitCode = 1;
    }
  }
}
