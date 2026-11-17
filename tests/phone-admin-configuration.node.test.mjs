import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import {
  PHONE_EXTENSION_PATTERN,
  validPhoneExtension,
  phoneProfileLabel,
} from '../lib/phone/config.ts';

test('operator zero and existing staff extensions pass both browser and server contracts', () => {
  const browser = new RegExp(`^(?:${PHONE_EXTENSION_PATTERN})$`, 'v');
  for (const value of ['0', '10', '101', '999999']) {
    assert.equal(validPhoneExtension(value), true, value);
    assert.equal(browser.test(value), true, value);
  }
  for (const value of ['', '1', '9', '-1', '1234567', '0\n', ' 0', '0 OR 1=1', '1.2']) {
    assert.equal(validPhoneExtension(value), false, value);
    assert.equal(browser.test(value), false, value);
  }
});

test('same-name login accounts have distinguishable labels without merging identities', () => {
  assert.notEqual(
    phoneProfileLabel({
      full_name: 'Elizabeth Greene',
      email: 'one@example.org',
    }),
    phoneProfileLabel({
      full_name: 'Elizabeth Greene',
      email: 'two@example.org',
    }),
  );
  assert.equal(phoneProfileLabel({ email: 'one@example.org' }), 'one@example.org');
  assert.equal(phoneProfileLabel({ full_name: ' Elizabeth Greene ' }), 'Elizabeth Greene');
});

test('database and browser enforce the same extension contract', () => {
  const sql = readFileSync(
    new URL(
      '../supabase/migrations/20261117090957_phone_number_operator_zero_assignment.sql',
      import.meta.url,
    ),
    'utf8',
  );
  assert.ok(sql.includes(`'${'^' + PHONE_EXTENSION_PATTERN + '$'}'`));
});
