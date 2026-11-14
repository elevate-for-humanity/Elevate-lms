'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const config = require('./phone-config.cjs');

test('public contact comes from shared organization configuration', () => {
  assert.equal(config.publicPhone, require('../elevate.config.json').org.phone);
  assert.equal(config.publicPhone, '+14632401404');
});
test('alerts require a configured recipient and do not default to public contact', () => {
  assert.equal(config.getAlertPhone(''), '');
  assert.throws(() => config.requireAlertPhone(''), /must be configured/);
  assert.equal(config.requireAlertPhone('(317) 956-2748'), '+13179562748');
});
test('both retired numbers are rejected in every supported US representation', () => {
  for (const digits of ['3179999620', '3177607908']) {
    for (const value of [digits, '1' + digits, '+' + '1' + digits,
      '(' + digits.slice(0,3) + ') ' + digits.slice(3,6) + '-' + digits.slice(6)]) {
      assert.throws(() => config.requireAlertPhone(value), /Retired/);
    }
  }
});
test('malformed recipient is rejected', () => {
  for (const value of ['abc3179562748', '123', '+01234567890', '3179562748;exit']) {
    assert.throws(() => config.requireAlertPhone(value), /invalid|valid E.164/);
  }
});
test('SMS transport receives normalized configured recipient and refuses retired recipients', async () => {
  let sent;
  const context = {
    module: { exports: {} }, __dirname, process: { env: { SMS_ALERT_PHONE: '+13179562748',
      TWILIO_ACCOUNT_SID: 'test-only', TWILIO_AUTH_TOKEN: 'test-only' } },
    console, setInterval: () => 0, setTimeout: () => 0, Date,
    require: name => name === './phone-config.cjs' ? config :
      name === 'twilio' ? () => ({ messages: { create: async data => {
        sent = data; return { sid: 'TEST' }; } } }) :
      name === 'fs' ? { existsSync: () => true, appendFileSync: () => {} } :
      name === 'path' ? path : (() => { throw new Error('Unexpected dependency'); })()
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'sms-alert-handler.js'),'utf8'), context);
  const handler = context.module.exports;
  handler.phoneNumber = '(317) 956-2748';
  handler.logAlert = () => {};
  assert.equal((await handler.sendAlert('Test')).success, true);
  assert.equal(sent.to, '+13179562748');
  for (const target of ['', '+13177607908', '+13179999620']) {
    sent = undefined;
    handler.phoneNumber = target;
    assert.equal((await handler.sendAlert('Test')).success, false);
    assert.equal(sent, undefined);
  }
});
test('retired carrier entry point fails without network requests', () => {
  for (const name of ['reconcile-telnyx.ts', 'audit-telnyx.ts', 'audit-telnyx-account-level.ts', 'register-telnyx-failover.ts']) {
  const entry = path.resolve(__dirname, '../northflank/' + name);
  const script = 'global.fetch = () => { throw new Error("NETWORK_REQUEST"); }; require(' + JSON.stringify(entry) + ');';
  const result = spawnSync(process.execPath, ['-e', script], { encoding:'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /retired/i);
  assert.doesNotMatch(result.stderr, /NETWORK_REQUEST/);
  }
});
