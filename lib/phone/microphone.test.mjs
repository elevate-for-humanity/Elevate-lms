import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyPhoneMicrophone } from './microphone.mjs';

test('requires a real live audio track and releases the capture device', async () => {
  let stopped = false;
  const track = { readyState: 'live', stop() { stopped = true; } };
  await verifyPhoneMicrophone({ async getUserMedia(constraints) {
    assert.deepEqual(constraints, { audio: true, video: false });
    return { getAudioTracks: () => [track], getTracks: () => [track] };
  } });
  assert.equal(stopped, true);
});
test('does not report capture readiness when no audio track is available', async () => {
  await assert.rejects(verifyPhoneMicrophone({ async getUserMedia() {
    return { getAudioTracks: () => [], getTracks: () => [] };
  } }), /No working microphone/);
});
for (const [name, message] of [['NotFoundError', /No microphone is connected/], ['NotAllowedError', /Microphone access is blocked/], ['NotReadableError', /cannot be opened/]]) {
  test(`explains ${name} without claiming the phone is connected`, async () => {
    await assert.rejects(verifyPhoneMicrophone({ async getUserMedia() {
      throw Object.assign(new Error('capture failed'), { name });
    } }), message);
  });
}
