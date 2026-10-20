import test from 'node:test';
import assert from 'node:assert/strict';
import {probeRedirect} from './verify-public-edge.mjs';

const origin = 'https://app.elevateforhumanity.org';
function redirect(requested, change = value => value) {
  const target = new URL('/login', origin);
  const source = new URL(requested);
  target.searchParams.set('redirect', change(source.pathname + source.search));
  return new Response(null, {status:307, headers:{location:target.href}});
}
test('anonymous portal verification accepts the exact requested path and audit query preserved by login', async () => {
  const result = await probeRedirect(origin, {request:async url => redirect(url)});
  assert.equal(result.state, 'passed');
  assert.equal(result.status, 307);
});
for (const [name, change] of [
  ['another portal', () => '/student/dashboard'],
  ['an external destination', () => 'https://outside.example/dashboard'],
  ['a modified audit query', () => '/program-holder/dashboard?_edge_audit=wrong'],
]) test('anonymous portal verification rejects ' + name, async () => {
  assert.equal((await probeRedirect(origin, {request:async url => redirect(url, change)})).state, 'failed');
});
test('anonymous portal verification rejects external login and unprotected content', async () => {
  for (const response of [new Response(null,{status:307,headers:{location:'https://outside.example/login'}}), new Response('private content')]) {
    assert.equal((await probeRedirect(origin,{request:async()=>response})).state,'failed');
  }
});
