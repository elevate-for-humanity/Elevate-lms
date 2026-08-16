import test from 'node:test';
import assert from 'node:assert/strict';
import { isPrivateAddress } from './server.mjs';

test('blocks private IPv4 networks', () => {
  for (const address of ['127.0.0.1', '10.0.0.4', '172.16.1.2', '192.168.1.2', '169.254.1.1']) {
    assert.equal(isPrivateAddress(address), true, address);
  }
});

test('allows public IPv4 networks', () => {
  assert.equal(isPrivateAddress('1.1.1.1'), false);
  assert.equal(isPrivateAddress('8.8.8.8'), false);
});

test('blocks loopback and private IPv6 networks', () => {
  assert.equal(isPrivateAddress('::1'), true);
  assert.equal(isPrivateAddress('fd00::1'), true);
  assert.equal(isPrivateAddress('fe80::1'), true);
});
