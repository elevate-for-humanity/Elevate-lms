import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyPhoneMicrophone } from './microphone.mjs';

test('an unanswered permission prompt expires and a late capture is released', async () => {
  let release;
  let stops = 0;
  const capture = new Promise(resolve => { release = resolve; });
  const track = { readyState: 'live', stop() { stops++; } };
  const verification = verifyPhoneMicrophone({ getUserMedia: () => capture }, { timeoutMs: 5 });
  try {
    const outcome = await Promise.race([
      verification.then(() => 'ready', error => error.message),
      new Promise(resolve => setTimeout(() => resolve('still waiting'), 50)),
    ]);
    assert.match(outcome, /Microphone permission was not confirmed/);
  } finally {
    release({ getAudioTracks: () => [track], getTracks: () => [track] });
    await verification.catch(() => undefined);
    await new Promise(resolve => setImmediate(resolve));
  }
  assert.equal(stops, 1);
});

test('cancellation stops waiting and releases a capture granted afterward', async () => {
  let release;
  let stopped = false;
  const controller = new AbortController();
  const capture = new Promise(resolve => { release = resolve; });
  const verification = verifyPhoneMicrophone({ getUserMedia: () => capture }, { signal: controller.signal });
  await Promise.resolve();
  controller.abort();
  try {
    const outcome = await Promise.race([
      verification.then(() => 'ready', error => error.name),
      new Promise(resolve => setTimeout(() => resolve('still waiting'), 50)),
    ]);
    assert.equal(outcome, 'AbortError');
  } finally {
    const track = { readyState: 'live', stop() { stopped = true; } };
    release({ getAudioTracks: () => [track], getTracks: () => [track] });
    await verification.catch(() => undefined);
    await new Promise(resolve => setImmediate(resolve));
  }
  assert.equal(stopped, true);
});

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
    const cause = Object.assign(new Error('capture failed'), { name });
    await assert.rejects(verifyPhoneMicrophone({ async getUserMedia() {
      throw cause;
    } }), error => {
      assert.match(error.message, message);
      assert.equal(error.cause, cause);
      return true;
    });
  });
}
