import test from 'node:test';
import assert from 'node:assert/strict';
import {requirePhoneTransport} from './guard-phone-domain-retirement.mjs';

const good = {
  dnsCheck: () => ({passed: true}),
  tlsCheck: async () => ({passed: true, hostnameValid: true}),
  healthCheck: async () => true,
  wsCheck: async () => ({result: 'PASS'}),
};
test('only allows retirement preflight when all phone transport checks pass', async () => {
  const result = await requirePhoneTransport(good);
  assert.equal(result.sipWebSocket, 'PASS');
  assert.equal(result.callAcceptance, 'NOT TESTED');
});
for (const [name, failed] of Object.entries({
  dns: {dnsCheck: () => ({passed: false})},
  tls: {tlsCheck: async () => ({passed: false})},
  hostname: {tlsCheck: async () => ({passed: true, hostnameValid: false})},
  health: {healthCheck: async () => false},
  websocket: {wsCheck: async () => ({result: 'BLOCKED'})},
  probeError: {dnsCheck: () => {throw new Error('unavailable');}},
})) {
  test(`fails closed on ${name}`, async () => {
    await assert.rejects(requirePhoneTransport({...good, ...failed}), /phone_transport_unverified_domain_retirement_blocked/);
  });
}
