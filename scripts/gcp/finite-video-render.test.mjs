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
