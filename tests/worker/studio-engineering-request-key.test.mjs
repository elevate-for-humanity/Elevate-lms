import test from 'node:test';
import assert from 'node:assert/strict';
import {engineeringRequestKey} from '../../lib/ai/tools/engineering-request-key.mjs';

test('orchestrator plan step key becomes a stable accepted engineering UUID',()=>{
  const input='plan-1794884375273:s1';
  const one=engineeringRequestKey('owner-a',input);
  assert.match(one,/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
  assert.equal(one,engineeringRequestKey('owner-a',input));
  assert.notEqual(one,engineeringRequestKey('owner-a','plan-1794884375273:s2'));
  assert.notEqual(one,engineeringRequestKey('owner-b',input));
});
test('existing UUID clients retain their request identity',()=>{
  const original='12345678-1234-4123-8123-123456789abc';
  assert.equal(engineeringRequestKey('owner-a',original),original);
  assert.equal(engineeringRequestKey('owner-a',original.toUpperCase()),original);
});
test('empty authorization identity or idempotency input fails closed',()=>{
  assert.throws(()=>engineeringRequestKey('','plan:1'),/IDENTITY_REQUIRED/);
  assert.throws(()=>engineeringRequestKey('owner',''),/IDENTITY_REQUIRED/);
});
test('executor preserves other tools and normalizes only Studio engineering',async()=>{
  const {readFileSync}=await import('node:fs');
  const source=readFileSync(new URL('../../lib/ai/tools/executor.ts',import.meta.url),'utf8');
  assert.match(source,/tool\.name === 'studio\.engineering\.execute'\s*\? engineeringRequestKey/);
  assert.match(source,/: context\.idempotencyKey\);/);
});
