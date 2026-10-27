import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { domains, evaluateRevision, evaluateApplication } from './verify-cutover-state.mjs';
import { verifyDns, parseAnswer, backendForHost } from './verify-production-dns.mjs';

const sha = 'a'.repeat(40);
const image = `us-central1-docker.pkg.dev/elegant-racer-299721/elevate/admin@sha256:${'b'.repeat(64)}`;
function resources() {
  const service = { metadata: { name: 'elevate-admin-migration', generation: 12 }, status: {
    observedGeneration: 12, conditions: [{ type: 'Ready', status: 'True' }],
    latestCreatedRevisionName: 'elevate-admin-migration-new', latestReadyRevisionName: 'elevate-admin-migration-new',
    traffic: [{ revisionName: 'elevate-admin-migration-new', percent: 100 }],
  } };
  const revision = { metadata: { name: 'elevate-admin-migration-new', generation: 1, labels: { 'serving.knative.dev/service': 'elevate-admin-migration' } },
    spec: { containers: [{ image, startupProbe: { httpGet: { path: '/api/ping' } }, livenessProbe: { httpGet: { path: '/api/ping' } } }] },
    status: { imageDigest: image, observedGeneration: 1, conditions: ['Ready', 'Active', 'ContainerHealthy', 'ResourcesAvailable'].map(type => ({ type, status: 'True' })) } };
  return { service, revision };
}
const statuses = checks => Object.fromEntries(checks.map(c => [c.name, c.status]));
test('independently healthy current revision at full traffic satisfies metadata gates', () => {
  const { service, revision } = resources();
  assert.ok(evaluateRevision('admin', service, revision).every(c => c.status === 'PASS'));
});
test('healthy service cannot hide a failed latest revision while previous serves', () => {
  const { service, revision } = resources();
  service.status.latestReadyRevisionName = 'elevate-admin-migration-old';
  service.status.traffic[0].revisionName = 'elevate-admin-migration-old';
  revision.status.conditions = [{ type: 'Ready', status: 'False' }, { type: 'ContainerHealthy', status: 'False' }];
  const s = statuses(evaluateRevision('admin', service, revision));
  assert.equal(s.SERVICE_READY, 'PASS');
  for (const gate of ['REVISION_READY', 'DEPLOYMENT_CURRENT', 'TRAFFIC_CORRECT', 'STARTUP_HEALTHY']) assert.equal(s[gate], 'FAIL');
});
test('revision readiness is independent of service readiness', () => {
  const { service, revision } = resources(); service.status.conditions = [{ type: 'Ready', status: 'False' }];
  const s = statuses(evaluateRevision('admin', service, revision));
  assert.equal(s.SERVICE_READY, 'FAIL'); assert.equal(s.REVISION_READY, 'PASS');
});
test('retired candidate is ready but not a deployed release', () => {
  const { service, revision } = resources();
  service.status.latestReadyRevisionName = 'old';
  revision.status.conditions.find(c => c.type === 'Active').status = 'False';
  const s = statuses(evaluateRevision('admin', service, revision));
  assert.equal(s.REVISION_READY, 'PASS'); assert.equal(s.DEPLOYMENT_CURRENT, 'FAIL'); assert.equal(s.TRAFFIC_CORRECT, 'FAIL');
});
test('stale observed generation and split traffic fail independently', () => {
  const { service, revision } = resources(); service.status.observedGeneration = 11;
  service.status.traffic[0].percent = 90; service.status.traffic.push({ revisionName: 'old', percent: 10 });
  const s = statuses(evaluateRevision('admin', service, revision)); assert.equal(s.SERVICE_READY, 'FAIL'); assert.equal(s.TRAFFIC_CORRECT, 'FAIL');
});
test('missing revision conditions, mutable image, wrong image owner, and absent probes fail closed', () => {
  for (const change of [r => { delete r.status.conditions; }, r => { r.spec.containers[0].image = 'image:latest'; }, r => { r.spec.containers[0].image = image.replace('/admin@', '/marketing@'); }, r => { delete r.spec.containers[0].livenessProbe; }]) {
    const { service, revision } = resources(); change(revision);
    assert.ok(evaluateRevision('admin', service, revision).some(c => c.status === 'FAIL'));
  }
});
function probes(component = 'admin') {
  return ['google', ...domains[component]].flatMap(surface => ['/api/health', '/api/ready', '/'].map(path => ({ surface, path, status: 200,
    body: { service: component, ready: true, healthy: true, agenticExecutorReady: true, dependencies: { supabase: { ok: true } }, commit: sha } })));
}
test('each service requires its own identity and matching public/revision commit provenance', () => {
  for (const component of ['admin', 'marketing', 'lms', 'store']) {
    const ownImage = image.replace('/admin@', '/' + component + '@');
    assert.ok(evaluateApplication(component, probes(component), ownImage, ownImage, sha).every(c => c.status === 'PASS'));
  }
});
test('healthy previous public deployment does not prove new image deployment', () => {
  const p = probes(); p.find(x => x.surface !== 'google' && x.path === '/api/health').body.commit = 'c'.repeat(40);
  const s = statuses(evaluateApplication('admin', p, image, image));
  assert.equal(s.PUBLIC_HEALTHY, 'PASS'); assert.equal(s.DEPLOYED_COMMIT_VERIFIED, 'FAIL');
});
test('same public/direct commit still fails if it is not the revision image or intended release', () => {
  assert.equal(statuses(evaluateApplication('admin', probes(), image, image.replace('b'.repeat(64), 'c'.repeat(64)))).DEPLOYED_COMMIT_VERIFIED, 'FAIL');
  assert.equal(statuses(evaluateApplication('admin', probes(), image, image, 'd'.repeat(40))).DEPLOYED_COMMIT_VERIFIED, 'FAIL');
});
test('missing Supabase and admin executor readiness cannot be reported healthy', () => {
  const p = probes(); p[0].body.dependencies.supabase.ok = false; p[1].body.agenticExecutorReady = false;
  const s = statuses(evaluateApplication('admin', p, image, image)); assert.equal(s.SUPABASE_CONNECTED, 'FAIL'); assert.equal(s.PUBLIC_HEALTHY, 'FAIL');
});
const host = 'app.elevateforhumanity.org', target = 'www.elevateforhumanity.org';
function lookup(name, type, server) {
  let records = [];
  if (type === 'NS') records = ['ns1.systemdns.com', 'ns2.systemdns.com'].map(data => ({ name, type, data }));
  if (name === host) records = [{ name, type: 'CNAME', data: target }];
  if (name === target && type === 'A') records = [{ name, type, data: '34.110.235.233' }];
  if (!server && name === host && type === 'A') records.push({ name: target, type: 'A', data: '34.110.235.233' });
  return { authoritative: Boolean(server), status: 'NOERROR', records };
}
test('DNS follows same-zone aliases and checks every authoritative server', () => assert.equal(verifyDns(host, ['34.110.235.233'], lookup).passed, true));
test('DNS rejects conflicting authoritative answers or a stale IPv6 route', () => {
  for (const mutation of [r => { r.authoritative = false; }, r => { r.records.push({ name: target, type: 'AAAA', data: '2001:db8::1' }); }]) {
    assert.equal(verifyDns(host, ['34.110.235.233'], (name, type, server) => { const r = lookup(name, type, server); if (server === 'ns2.systemdns.com' && name === target) mutation(r); return r; }).passed, false);
  }
});
test('DNS rejects off-zone/legacy aliases and cyclic records', () => {
  for (const alias of [host, 'old.dns.northflank.app']) assert.equal(verifyDns(host, ['34.110.235.233'], (name, type, server) => {
    const r = lookup(name, type, server); if (name === host) r.records = [{ name, type: 'CNAME', data: alias }]; return r;
  }).passed, false);
});
test('dig parser retains authoritative flag and exact records', () => {
  const r = parseAnswer(';; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 1\n;; flags: qr aa; QUERY: 1\nphone.elevateforhumanity.org. 300 IN A 107.178.216.162\n');
  assert.equal(r.authoritative, true); assert.equal(r.records[0].data, '107.178.216.162');
});
test('Google host routing rejects ambiguous and unreviewed path overrides', () => {
  const map = { defaultService: 'marketing', hostRules: [{ hosts: [host], pathMatcher: 'lms' }], pathMatchers: [{ name: 'lms', defaultService: 'lms' }] };
  assert.equal(backendForHost(map, host), 'lms'); map.pathMatchers[0].pathRules = [{ paths: ['/api/*'], service: 'marketing' }];
  assert.throws(() => backendForHost(map, host), /Unverified/);
});
test('trusted workflow invokes testable verifier and never confuses dispatch with deploy success', () => {
  const yml = readFileSync(new URL('../../.github/workflows/verify-google-cutover.yml', import.meta.url), 'utf8');
  assert.match(yml, /workflow_run.event == 'workflow_dispatch'/);
  assert.match(yml, /Deploy LMS automatically on Google/);
  assert.match(yml, /run: node scripts\/gcp\/verify-google-cutover.mjs/);
  assert.match(yml, /if: always\(\)/);
});
