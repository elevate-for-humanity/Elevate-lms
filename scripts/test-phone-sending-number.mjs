import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
const source = stripTypeScriptTypes(await readFile(new URL('../lib/phone/sending-number.ts', import.meta.url), 'utf8'));
const { resolveSendingNumber } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
function fixture({ system = { id: 'platform' }, number = { e164: '+15555550123' }, error = null } = {}) {
  const filters = [];
  const db = { from(table) {
    const q = { select: () => q, is: (...args) => { filters.push([table, ...args]); return q; }, eq: (...args) => { filters.push([table, ...args]); return q; }, maybeSingle: async () => ({ data: table === 'phone_systems' ? system : number, error }) };
    return q;
  } };
  return { db, filters };
}
test('uses the existing active provider primary line when runtime sender is omitted', async () => {
  const f = fixture();
  assert.equal(await resolveSendingNumber(f.db, {}), '+15555550123');
  assert.deepEqual(f.filters, [['phone_systems', 'tenant_id', null], ['phone_numbers', 'phone_system_id', 'platform'], ['phone_numbers', 'provider', 'twilio'], ['phone_numbers', 'source', 'provider'], ['phone_numbers', 'is_primary', true], ['phone_numbers', 'status', 'active']]);
});
test('retains an explicit valid runtime sender without querying unrelated lines', async () => {
  assert.equal(await resolveSendingNumber(null, { TWILIO_PHONE_NUMBER: ' +15555550124 ' }), '+15555550124');
});
test('rejects malformed explicit configuration instead of silently replacing it', async () => {
  assert.equal(await resolveSendingNumber(null, { TWILIO_PHONE_NUMBER: 'contact us' }), null);
});
test('ambiguous database results and missing provider records fail closed', async () => {
  for (const data of [{ error: { message: 'multiple rows' } }, { system: null }, { number: null }, { number: { e164: '317' } }]) {
    assert.equal(await resolveSendingNumber(fixture(data).db, {}), null);
  }
});
