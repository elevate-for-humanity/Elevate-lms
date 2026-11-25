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
  for (const value of ['0', '101', '999']) {
    assert.equal(validPhoneExtension(value), true, value);
    assert.equal(browser.test(value), true, value);
  }
  for (const value of ['', '1', '9', '10', '00', '012', '1000', '999999', '-1', '1234567', '0\n', ' 0', '0 OR 1=1', '1.2']) {
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
      '../supabase/migrations/20261125140000_phone_extension_contract.sql',
      import.meta.url,
    ),
    'utf8',
  );
  assert.ok(sql.includes(`'${'^' + PHONE_EXTENSION_PATTERN + '$'}'`));
});

test('phone directory scopes both tenant and legacy organization profiles', async () => {
  const { scopePhoneProfileQuery } = await import('../lib/phone/profile-scope.ts');
  const calls=[];
  const query={or(filter){calls.push(['or',filter]);return this;},is(column,value){calls.push(['is',column,value]);return this;}};
  scopePhoneProfileQuery(query,null);
  assert.deepEqual(calls,[['is','tenant_id',null],['is','organization_id',null]]);
  calls.length=0;
  scopePhoneProfileQuery(query,'00000000-0000-0000-0000-000000000099');
  assert.deepEqual(calls,[['or','tenant_id.eq.00000000-0000-0000-0000-000000000099,and(tenant_id.is.null,organization_id.eq.00000000-0000-0000-0000-000000000099)']]);
  assert.throws(()=>scopePhoneProfileQuery(query,'bad,or(expression)'));
});

test('form and save apply tenant and phone-system filters on every workspace path', async () => {
  const { findPhoneWorkspace, phoneWorkspaceTenant } = await import('../lib/phone/workspace.ts');
  const tenant='00000000-0000-0000-0000-000000000099';
  const platform={id:'platform',tenant_id:null};
  function dbWith(results) {
    const filters=[];
    return {filters, db:{from(table){const scope=[];filters.push({table,scope});return {
      select(){return this;},limit(){return this;},
      eq(column,value){scope.push(['eq',column,value]);return this;},
      is(column,value){scope.push(['is',column,value]);return this;},
      async maybeSingle(){return {data:results.shift(),error:null};}
    };}}};
  }
  const fallback=dbWith([null,platform]);
  const existing=await findPhoneWorkspace(fallback.db,tenant,true,'system');
  assert.equal(phoneWorkspaceTenant(existing,tenant),null);
  assert.deepEqual(fallback.filters,[
    {table:'communication_workspaces',scope:[['eq','tenant_id',tenant]]},
    {table:'communication_workspaces',scope:[['eq','phone_system_id','system']]},
  ]);
  const missing=dbWith([null,null]);
  assert.equal(phoneWorkspaceTenant(await findPhoneWorkspace(missing.db,tenant,true,'system'),tenant),tenant);
  assert.deepEqual(missing.filters,fallback.filters);
  const own={id:'own',tenant_id:tenant}, owned=dbWith([own]);
  assert.equal(await findPhoneWorkspace(owned.db,tenant,true,'system'),own);
  assert.deepEqual(owned.filters,[{table:'communication_workspaces',scope:[['eq','tenant_id',tenant]]}]);
  const member=dbWith([null]);
  assert.equal(await findPhoneWorkspace(member.db,tenant,false,'system'),null);
  assert.deepEqual(member.filters,owned.filters);
  const root=dbWith([platform]);
  assert.equal(await findPhoneWorkspace(root.db,null,true,'system'),platform);
  assert.deepEqual(root.filters,[{table:'communication_workspaces',scope:[['is','tenant_id',null]]}]);
});

test('extension-only number edits preserve saved platform assignees under tenant workspace fallback', async () => {
  const {phoneNumberProfileChoices}=await import('../lib/phone/profile-scope.ts');
  const workspaceProfiles=[{id:'tenant-staff',email:'tenant@example.test'}];
  const systemProfiles=[{id:'platform-owner',email:'owner@example.test'}];
  assert.equal(phoneNumberProfileChoices(systemProfiles,'platform-owner').find(p=>p.id==='platform-owner').id,'platform-owner');
  const options=phoneNumberProfileChoices(workspaceProfiles,'platform-owner');
  assert.equal(options.find(p=>p.id==='platform-owner').full_name,'Current assigned account');
  assert.equal(options.find(p=>p.id==='platform-owner').email,undefined);
  assert.equal(phoneNumberProfileChoices(systemProfiles,null).length,1);
});

