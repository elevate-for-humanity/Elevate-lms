import test from 'node:test';
import assert from 'node:assert/strict';
import { completedRenderEvidence } from './finite-video-render.mjs';
const complete = { status: 'complete', video_url: 'https://media.example/video.mp4', completed_at: '2026-10-08T18:00:00Z', quality_evidence: { gateVersion: 'media-quality-v7', videoStreams: 1, audioStreams: 1, bytes: 200000, actualDurationSeconds: 180, captionUrl: 'https://media.example/captions.vtt', transcriptUrl: 'https://media.example/transcript.txt' } };
test('requires complete audiovisual media with captions and transcript evidence', () => assert.equal(completedRenderEvidence(complete), true));
test('rejects pending work and legacy completion without evidence', () => {
  assert.equal(completedRenderEvidence({ ...complete, status: 'rendering' }), false);
  assert.equal(completedRenderEvidence({ ...complete, quality_evidence: null }), false);
  assert.equal(completedRenderEvidence({ ...complete, quality_evidence: { ...complete.quality_evidence, captionUrl: null } }), false);
  assert.equal(completedRenderEvidence({ ...complete, quality_evidence: { ...complete.quality_evidence, audioStreams: 0 } }), false);
});
