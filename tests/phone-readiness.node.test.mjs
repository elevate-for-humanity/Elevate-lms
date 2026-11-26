import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  evaluatePhoneReadiness,
  readinessCheck,
  readinessIsFresh,
  summarizePhoneReadiness,
  READINESS_FRESH_MS,
} from '../lib/phone/readiness.ts';

const NOW = new Date('2026-11-23T15:00:00.000Z');
const fresh = NOW.toISOString();
const stale = new Date(NOW.getTime() - READINESS_FRESH_MS - 1000).toISOString();

function allPassChecks(observedAt = fresh) {
  return [
    readinessCheck('twilio_account', 'pass', 'Twilio account authentication succeeded.', observedAt),
    readinessCheck('twilio_number', 'pass', 'Active primary Twilio number has voice capability.', observedAt),
    readinessCheck('pbx_config', 'pass', 'PBX control-plane configuration is present.', observedAt),
    readinessCheck('pbx_registrations', 'pass', '1 Asterisk device(s) with PBX-verified SIP registration in the last 120 seconds.', observedAt),
    readinessCheck('call_history', 'pass', '3 call(s) recorded.', observedAt),
    readinessCheck('call_test', 'unknown', 'No real-call audio acceptance test has been recorded.', observedAt),
    readinessCheck('webrtc_meetings', 'unknown', 'The self-hosted WebRTC meetings service must be provisioned.', observedAt),
    readinessCheck('voice_webhook', 'not_configured', 'No Twilio voice webhook route exists.', observedAt),
  ];
}

test('ready requires every carrier and PBX check to pass with fresh evidence', () => {
  const readiness = evaluatePhoneReadiness(allPassChecks(), NOW);
  assert.equal(readiness.ready, true);
  assert.equal(readiness.carrierReady, true);
  assert.equal(readiness.pbxReady, true);
  // Inbound PSTN voice is a separate flag: no voice webhook exists, so
  // voiceReady must stay false even when the PWA phone path is ready.
  assert.equal(readiness.voiceReady, false);
  assert.equal(readinessIsFresh(readiness, NOW), true);
});

test('stale evidence never counts as ready', () => {
  const readiness = evaluatePhoneReadiness(allPassChecks(stale), NOW);
  assert.equal(readiness.ready, false);
  assert.match(summarizePhoneReadiness(readiness, NOW), /not verified/);
  // The evaluation itself ran just now, so it is fresh — it correctly
  // reports not-ready. An evaluation made long ago is what goes stale.
  assert.equal(readinessIsFresh(readiness, NOW), true);
  const old = evaluatePhoneReadiness(allPassChecks(), new Date(NOW.getTime() - READINESS_FRESH_MS - 1000));
  assert.equal(readinessIsFresh(old, NOW), false);
  assert.match(summarizePhoneReadiness(old, NOW), /unverified/);
});

test('one failed required check fails readiness and names the carrier gap', () => {
  const checks = allPassChecks();
  checks[1] = readinessCheck('twilio_number', 'fail', 'Active primary Twilio number does not have voice capability enabled.', fresh);
  const readiness = evaluatePhoneReadiness(checks, NOW);
  assert.equal(readiness.ready, false);
  assert.equal(readiness.carrierReady, false);
  assert.equal(readiness.pbxReady, true);
  assert.match(summarizePhoneReadiness(readiness, NOW), /Primary Twilio number/);
});

test('voiceReady only when the voice webhook check also passes fresh', () => {
  const checks = allPassChecks();
  checks[7] = readinessCheck('voice_webhook', 'pass', 'Twilio voice webhook verified.', fresh);
  const readiness = evaluatePhoneReadiness(checks, NOW);
  assert.equal(readiness.voiceReady, true);
});

test('call test is never inferred: ready without it says so in plain language', () => {
  const readiness = evaluatePhoneReadiness(allPassChecks(), NOW);
  assert.match(
    summarizePhoneReadiness(readiness, NOW),
    /real-call audio acceptance test has not been recorded/,
  );
  const withCallTest = allPassChecks();
  withCallTest[5] = readinessCheck('call_test', 'pass', 'Test call 2026-11-23: two-way audio confirmed.', fresh);
  assert.match(
    summarizePhoneReadiness(evaluatePhoneReadiness(withCallTest, NOW), NOW),
    /real-call audio test all passed/,
  );
});

test('no readiness at all reads as unverified, never as ready', () => {
  assert.match(summarizePhoneReadiness(null), /unverified/);
  assert.equal(evaluatePhoneReadiness([], NOW).ready, false);
});
