import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeRevision, inspectPermissionBoundary, PERMISSION_GROUPS } from './preflight-isolated-workloads.mjs';

test('serving revision summary preserves its own resource limits without exposing credentials', () => {
  const revision = {metadata: {name: 'admin-serving', annotations: {'run.googleapis.com/cpu-throttling': 'false'}}, spec: {serviceAccountName: 'runtime@example.invalid', containers: [{image: 'image@sha256:abc', resources: {limits: {cpu: '4', memory: '8Gi'}}, env: [{name: 'SUPABASE_SERVICE_ROLE_KEY', value: 'private-value'}, {name: 'DISABLE_ADMIN_VIDEO_WORKER', value: 'false'}]}]}};
  const report = summarizeRevision(revision);
  assert.equal(report.revision, 'admin-serving');
  assert.deepEqual(report.resources, {cpu: '4', memory: '8Gi'});
  assert.equal(report.continuousCpu, true);
  assert.equal(report.videoWorkerDisabled, false);
  assert(!JSON.stringify(report).includes('private-value'));
});

test('missing permissions remain blockers instead of being treated as absent resources', async () => {
  const result = await inspectPermissionBoundary('opaque-token', 'project', ['compute.instances.create', 'compute.disks.create'], async (url, init) => {
    assert.equal(init.method, 'POST');
    assert(url.endsWith(':testIamPermissions'));
    assert.equal(init.headers.authorization, 'Bearer opaque-token');
    assert.deepEqual(JSON.parse(init.body), {permissions: ['compute.instances.create', 'compute.disks.create']});
    return {ok: true, status: 200, json: async () => ({permissions: ['compute.instances.create']})};
  });
  assert.equal(result.checked, true);
  assert.equal(result.allowed, false);
  assert.deepEqual(result.missing, ['compute.disks.create']);
  assert(!JSON.stringify(result).includes('opaque-token'));
});

test('denied and unavailable permission checks fail closed and do not echo API bodies', async () => {
  for (const request of [async () => ({ok: false, status: 403, json: async () => ({error: {message: 'private-response'}})}), async () => {throw Error('secret-token');}]) {
    const result = await inspectPermissionBoundary('secret-token', 'project', ['compute.instances.create'], request);
    assert.equal(result.checked, false);
    assert.equal(result.allowed, false);
    assert(!/private-response|secret-token/.test(JSON.stringify(result)));
  }
});

test('permission response must be well formed before access is confirmed', async () => {
  const result = await inspectPermissionBoundary('token', 'project', ['compute.instances.create'], async () => ({ok: true, status: 200, json: async () => ({permissions: 'compute.instances.create'})}));
  assert.equal(result.allowed, false);
  assert.equal(result.checked, false);
});

test('VM preparation includes resource creation and runtime identity attachment', () => {
  assert(PERMISSION_GROUPS.vm.includes('compute.instances.create'));
  assert(PERMISSION_GROUPS.vm.includes('compute.instances.setServiceAccount'));
  assert(PERMISSION_GROUPS.vm.includes('compute.disks.create'));
  assert(!Object.values(PERMISSION_GROUPS).flat().includes('resourcemanager.projects.setIamPolicy'));
});

test('secret permissions are checked at the existing resource without reading its payload', async () => {
  const r = await inspectPermissionBoundary('token', 'secret:elevate-studio-browser-runtime-config', ['secretmanager.secrets.setIamPolicy'], async (url, init) => {
    assert.equal(url, 'https://secretmanager.googleapis.com/v1/projects/elegant-racer-299721/secrets/elevate-studio-browser-runtime-config:testIamPermissions');
    assert.equal(init.method, 'POST');
    assert(!url.includes('versions'));
    return {ok: true, status: 200, json: async () => ({permissions: []})};
  });
  assert.equal(r.checked, true);
  assert.equal(r.allowed, false);
});
