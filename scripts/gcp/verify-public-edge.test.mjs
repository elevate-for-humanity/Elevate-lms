import test from 'node:test';
import assert from 'node:assert/strict';
import {probeRedirect, probeEndpoint, auditEdge} from './verify-public-edge.mjs';

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

const expectedSha = 'a'.repeat(40);
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {'content-type':'application/json', 'cache-control':'no-store'},
});
test('version HTTP 200 requires a complete commit SHA', async () => {
  for (const body of [{}, {commitSha:'unknown'}, {commit:'aabbcc'}, {commitSha:null}]) {
    const result = await probeEndpoint(origin, '/api/version', {
      sha:expectedSha,
      request:async () => json(body),
    });
    assert.equal(result.state,'failed');
    assert.equal(result.reason,'invalid_commit_sha');
    assert.equal(result.commit,null);
  }
});
test('version must match the exact expected commit', async () => {
  const mismatch = await probeEndpoint(origin,'/api/version',{
    sha:expectedSha,request:async () => json({service:'lms',commitSha:'b'.repeat(40)}),
  });
  assert.equal(mismatch.state,'failed');
  assert.equal(mismatch.reason,'commit_mismatch');
  const matching = await probeEndpoint(origin,'/api/version',{
    sha:expectedSha,request:async () => json({service:'lms',commitSha:expectedSha}),
  });
  assert.equal(matching.state,'passed');
  assert.equal(matching.commit,expectedSha);
});
test('version HTML success and HTTP server errors cannot pass',async () => {
  const html = await probeEndpoint(origin,'/api/version',{
    sha:expectedSha,request:async () => new Response('<html>OK</html>',{status:200,headers:{'content-type':'text/html'}}),
  });
  assert.equal(html.state,'failed');
  assert.equal(html.reason,'invalid_commit_sha');
  const error = await probeEndpoint(origin,'/api/version',{
    sha:expectedSha,request:async () => json({commitSha:expectedSha},503),
  });
  assert.equal(error.state,'failed');
  assert.equal(error.reason,'http_status');
});
test('full public-edge certification requires an authoritative expected main SHA',async () => {
  const request = async url => {
    if (new URL(url).pathname === '/program-holder/dashboard') return redirect(url);
    return json({service:new URL(url).hostname.includes('admin')?'admin':'lms',commitSha:expectedSha});
  };
  const checks = {
    request,
    dns:async () => ({state:'passed'}),
    tlsCheck:async () => ({state:'passed'}),
  };
  assert.equal((await auditEdge({...checks,sha:null})).allVerified,false);
  assert.equal((await auditEdge({...checks,sha:'invalid'})).allVerified,false);
  assert.equal((await auditEdge({...checks,sha:expectedSha})).allVerified,true);
});
