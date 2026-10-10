import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeRevision, inspectPermissionBoundary, inspectRunQuotaOptions, PERMISSION_GROUPS } from './preflight-isolated-workloads.mjs';

test('quota audit follows read-only pages without exposing contact information or credentials', async () => {
  let calls = 0;
  const result = await inspectRunQuotaOptions('private-token', async (url, init) => {
    assert.equal(init.method, undefined);
    calls++;
    const body = url.pathname.endsWith('/quotaInfos')
      ? {quotaInfos: [{service: 'run.googleapis.com', quotaId: 'CpuAllocPerProjectRegion', metric: 'run.googleapis.com/cpu_allocation', isFixed: false}], ...(calls === 1 ? {nextPageToken: 'next'} : {})}
      : {quotaPreferences: [{service: 'run.googleapis.com', quotaId: 'CpuAllocPerProjectRegion', contactEmail: 'private@example.invalid', justification: 'private-context', quotaConfig: {preferredValue: '32000', grantedValue: '20000'}, reconciling: true}]};
    return {ok: true, status: 200, json: async () => body};
  });
  assert.equal(calls, 3);
  assert.equal(result.preferences[0].preferredValue, '32000');
  assert(!JSON.stringify(result).includes('private'));
});

test('quota API denial stays visible without leaking the error body', async () => {
  const result = await inspectRunQuotaOptions('token', async () => ({ok: false, status: 403,
    json: async () => ({error: {status: 'PERMISSION_DENIED', message: 'private-response', details: [{reason: 'SERVICE_DISABLED'}]}})}));
  assert.equal(result.reads.length, 2);
  assert.equal(result.reads[0].errorReasons[0], 'SERVICE_DISABLED');
  assert(!JSON.stringify(result).includes('private-response'));
});

test('quota audit retains CPU and memory preferences when the API omits metric', async () => {
  const result = await inspectRunQuotaOptions('token', async url => ({ok: true, status: 200,
    json: async () => url.pathname.endsWith('/quotaInfos') ? {quotaInfos: []} : {quotaPreferences: [
      {service: 'run.googleapis.com', quotaId: 'CpuAllocPerProjectRegion', quotaConfig: {preferredValue: '32000', grantedValue: '20000'}},
      {service: 'run.googleapis.com', quotaId: 'MemAllocPerProjectRegion', quotaConfig: {preferredValue: '68719476736', grantedValue: '42949672960'}},
      {service: 'run.googleapis.com', quotaId: 'NvidiaL4GpuAllocPerProjectRegion', quotaConfig: {preferredValue: '1'}},
    ]}}));
  assert.deepEqual(result.preferences.map(x => [x.quotaId, x.preferredValue, x.grantedValue]), [
    ['CpuAllocPerProjectRegion', '32000', '20000'],
    ['MemAllocPerProjectRegion', '68719476736', '42949672960'],
  ]);
});

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
