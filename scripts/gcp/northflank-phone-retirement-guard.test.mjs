import test from 'node:test';
import assert from 'node:assert/strict';
import {assertNotPhoneRetirement} from './northflank-phone-retirement-guard.mjs';

test('refuses direct deletion of the phone hostname', () => {
  assert.throws(() => assertNotPhoneRetirement('phone.elevateforhumanity.org'), /Protected PBX/);
});
test('refuses wildcard deletion that could affect phone', () => {
  assert.throws(() => assertNotPhoneRetirement('*.elevateforhumanity.org'), /Protected PBX/);
});
test('refuses root deletion if phone or wildcard appears in inventory', () => {
  for (const host of ['phone.elevateforhumanity.org', '*.elevateforhumanity.org']) {
    assert.throws(() => assertNotPhoneRetirement('elevateforhumanity.org', [host]), /Protected PBX/);
  }
});
test('allows removal of unrelated legacy domain bindings', () => {
  assert.doesNotThrow(() => assertNotPhoneRetirement('www.elevateforhumanity.org'));
  assert.doesNotThrow(() => assertNotPhoneRetirement('elevateforhumanity.org', ['www.elevateforhumanity.org']));
});
