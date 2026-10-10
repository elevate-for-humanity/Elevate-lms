import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { completedRenderEvidence, startLocalRender } from './finite-video-render.mjs';
const complete = { status: 'complete', video_url: 'https://media.example/video.mp4', completed_at: '2026-10-08T18:00:00Z', quality_evidence: { gateVersion: 'media-quality-v7', videoStreams: 1, audioStreams: 1, bytes: 200000, actualDurationSeconds: 180, captionUrl: 'https://media.example/captions.vtt', transcriptUrl: 'https://media.example/transcript.txt' } };
test('requires complete audiovisual media with captions and transcript evidence', () => assert.equal(completedRenderEvidence(complete), true));
test('rejects pending work and legacy completion without evidence', () => {
  assert.equal(completedRenderEvidence({ ...complete, status: 'rendering' }), false);
  assert.equal(completedRenderEvidence({ ...complete, quality_evidence: null }), false);
  assert.equal(completedRenderEvidence({ ...complete, quality_evidence: { ...complete.quality_evidence, captionUrl: null } }), false);
  assert.equal(completedRenderEvidence({ ...complete, quality_evidence: { ...complete.quality_evidence, audioStreams: 0 } }), false);
});
test('starts the exact video using a fresh local authenticated HTTP connection', async () => {
  let received;
  const server = createServer((req, res) => {
    assert.equal(req.method, 'POST');
    assert.equal(req.url, '/api/internal/videos/process-queue');
    assert.equal(req.headers.authorization, 'Bearer test-secret');
    assert.equal(req.headers.connection, 'close');
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => { received = JSON.parse(body); res.end(JSON.stringify({ started: 1 })); });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const options = { courseId: 'course', jobId: 'job', queueOneDraft: true, maxJobs: 1 };
    assert.deepEqual(await startLocalRender(server.address().port, 'test-secret', options), { started: 1 });
    assert.deepEqual(received, options);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
test('validation verifies a failed exact job without starting Admin or mutating the video queue', async () => {
  const events = [], requests = [];
  const api = createServer((req, res) => {
    requests.push([req.method, req.url]);
    let body = ''; req.on('data', x => { body += x; });
    req.on('end', () => {
      res.setHeader('content-type', 'application/json');
      if (req.method === 'POST') { events.push(JSON.parse(body)); res.end('{}'); }
      else res.end(JSON.stringify([{ id: '11111111-1111-1111-1111-111111111111', status: 'failed' }]));
    });
  });
  await new Promise(resolve => api.listen(0, '127.0.0.1', resolve));
  const directory = mkdtempSync(join(tmpdir(), 'finite-validation-'));
  try {
    mkdirSync(join(directory, 'apps/admin/workers'), { recursive: true });
    writeFileSync(join(directory, 'apps/admin/workers/admin-speech-cache.mjs'), 'process.exit(0);');
    // No Admin launcher exists in this fixture: starting rendering would fail.
    const entry = new URL('./finite-video-render.mjs', import.meta.url).href;
    const child = spawn(process.execPath, ['--input-type=module', '-e', `import {runFiniteVideoRender} from ${JSON.stringify(entry)}; await runFiniteVideoRender();`], {
      cwd: directory, env: { ...process.env, VIDEO_VALIDATE_ONLY: 'true',
        VIDEO_JOB_ID: '11111111-1111-1111-1111-111111111111', VIDEO_COURSE_ID: '22222222-2222-2222-2222-222222222222',
        NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:' + api.address().port,
        SUPABASE_SERVICE_ROLE_KEY: 'test-only-service-key', CRON_SECRET: 'test-only-cron-secret' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = ''; child.stdout.on('data', x => { output += x; });
    let errors = ''; child.stderr.on('data', x => { errors += x; });
    const code = await new Promise(resolve => child.on('exit', resolve));
    assert.equal(code, 0, errors);
    assert.equal(JSON.parse(output).jobStatus, 'failed');
    assert.ok(events.some(e => e.event_type === 'finite_video_runtime_verified'));
    assert.equal(requests.filter(([method]) => method !== 'GET').every(([method, url]) => method === 'POST' && url === '/rest/v1/platform_events'), true);
    assert.equal(events.some(e => e.event_type === 'finite_video_session_started'), false);
  } finally { rmSync(directory, { recursive: true, force: true }); await new Promise(resolve => api.close(resolve)); }
});
