import test from 'node:test';
import assert from 'node:assert/strict';
import {snapshot} from './pbx-container-snapshot.mjs';
const pbx=`/pbx_asterisk_1 ${'a'.repeat(64)} true 2026-10-08T01:02:03.123456789Z`;
const tls=`/elevate-pbx-wss-proxy ${'b'.repeat(64)} true 2026-10-08T01:02:03.123456789Z`;
test('compares Docker identity fields independently of first-use SSH key-generation output',()=>{
  assert.deepEqual(snapshot(`Generating public/private key pair.\n${pbx}\n${tls}\n`),snapshot(`${tls}\n${pbx}`));
});
test('requires both running containers and rejects duplicate or malformed records',()=>{
  for(const output of [pbx,`${pbx}\n${pbx}\n${tls}`,`${pbx.replace(' true ',' false ')}\n${tls}`,`${pbx.replace('a'.repeat(64),'invalid')}\n${tls}`]) {
    assert.throws(()=>snapshot(output));
  }
});
test('does not hide a changed container or restart time',()=>{
  const before=snapshot(`${pbx}\n${tls}`);
  assert.notDeepEqual(snapshot(`${pbx.replace('a'.repeat(64),'c'.repeat(64))}\n${tls}`),before);
  assert.notDeepEqual(snapshot(`${pbx.replace('01:02:03','02:02:03')}\n${tls}`),before);
});
