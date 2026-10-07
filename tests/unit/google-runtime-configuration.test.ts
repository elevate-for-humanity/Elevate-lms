// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { getGoogleRuntimeConfiguration, payloadChecksum, saveGoogleRuntimeConfiguration } from '@/lib/google/runtime-configuration';

const project = 'elegant-racer-299721';
const prefix = `projects/${project}/locations/us-central1/services/elevate-admin-migration`;
const oldRevision = `${prefix.replace('/services/', '/revisions/')}-00001`;
const newRevision = `${prefix.replace('/services/', '/revisions/')}-00002`;
const secret = 'elevate-admin-sendgrid-api-key';
const value = 'synthetic-private-value';
function harness(options: { deny?: string; checksum?: boolean; failed?: boolean; health?: boolean; wrongRevision?: boolean; conflict?: boolean; identity?: string; stale?: boolean; scope?: string; extraAccessor?: boolean } = {}) {
  const calls: Array<{ url: string; method: string; body?: Record<string, unknown> }> = [];
  let patched = false;
  let time = 0;
  let containers = [{ image: `us-central1-docker.pkg.dev/${project}/elevate/admin@sha256:${'a'.repeat(64)}`, env: [{ name: 'UNCHANGED', value: 'kept' }, { name: 'SENDGRID_API_KEY', value: 'old-private-value' }], resources: { limits: { cpu: '4', memory: '8Gi' } } }];
  const request = async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
    calls.push({ url, method, body });
    if (options.deny && url.includes(options.deny)) return Response.json({ error: { message: `must not leak ${value}` } }, { status: 403 });
    if (url.includes('metadata.google.internal')) {
      return url.includes('/identity?') ? new Response('synthetic-identity', { headers: { 'Metadata-Flavor': 'Google' } })
        : Response.json({ access_token: 'synthetic-access-token' }, { headers: { 'Metadata-Flavor': 'Google' } });
    }
    if (url.endsWith('/api/health')) return Response.json({ ready: true, healthy: options.health !== false, revision: options.wrongRevision ? 'wrong-revision' : newRevision.split('/').at(-1) });
    if (url.includes('secretmanager.googleapis.com')) {
      if (url.endsWith(':getIamPolicy')) return Response.json({ bindings: [
        { role: `projects/${project}/roles/elevateRuntimeSecretWriterV1`, members: [`serviceAccount:elevate-admin-runtime@${project}.iam.gserviceaccount.com`] },
        { role: 'roles/secretmanager.secretAccessor', members: [`serviceAccount:elevate-admin-runtime@${project}.iam.gserviceaccount.com`, ...(options.extraAccessor ? ['serviceAccount:elevate-marketing-runtime@example.test'] : [])] },
      ] });
      if (url.endsWith(':addVersion')) return Response.json({ name: `projects/484736877039/secrets/${secret}/versions/7`, state: 'ENABLED', clientSpecifiedPayloadChecksum: options.checksum !== false });
      if (url.includes('/versions/')) return Response.json({ name: `projects/${project}/secrets/${secret}/versions/7`, state: 'ENABLED', clientSpecifiedPayloadChecksum: true });
      return Response.json({ labels: { elevate_component: options.scope ?? 'admin', elevate_key: 'sendgrid_api_key' } });
    }
    if (method === 'PATCH') {
      if (options.conflict) return Response.json({}, { status: 409 });
      containers = body.template.containers;
      patched = true;
      return Response.json({ name: `projects/${project}/locations/us-central1/operations/operation-a` });
    }
    const ready = patched && !options.stale;
    const revision = ready ? newRevision : oldRevision;
    return Response.json({ name: prefix, etag: ready ? 'new-etag' : 'original-etag', generation: ready ? '2' : '1', observedGeneration: ready ? '2' : '1', terminalCondition: { state: options.failed && patched ? 'CONDITION_FAILED' : 'CONDITION_SUCCEEDED' }, latestReadyRevision: revision, latestCreatedRevision: revision,
      uri: 'https://elevate-admin-migration-example-uc.a.run.app', trafficStatuses: [{ revision, percent: 100 }], template: { serviceAccount: options.identity ?? `elevate-admin-runtime@${project}.iam.gserviceaccount.com`, containers } });
  };
  return { calls, dependencies: { request: request as typeof fetch, now: () => time, wait: async (ms: number) => { time += ms; } } };
}
describe('Google configuration delivery', () => {
  it('uses the independently known Castagnoli check vector', () => {
    expect(payloadChecksum(Buffer.from('123456789'))).toBe(String(0xe3069283));
  });
  it('writes checksum-protected bytes to a service-specific secret and verifies its exact serving revision', async () => {
    const h = harness();
    const result = await saveGoogleRuntimeConfiguration('admin', [{ key: 'SENDGRID_API_KEY', value }], h.dependencies);
    expect(result).toMatchObject({ runtimeSynced: true, configurationVerified: true, revision: newRevision, previousRevision: oldRevision });
    expect(JSON.stringify(result)).not.toContain(value);
    const write = h.calls.find(call => call.url.endsWith(':addVersion'))!;
    expect(write.body).toEqual({ payload: { data: Buffer.from(value).toString('base64'), dataCrc32c: payloadChecksum(Buffer.from(value)) } });
    const update = h.calls.find(call => call.method === 'PATCH')!;
    expect(update.body).toMatchObject({ etag: 'original-etag', template: { containers: [{ resources: { limits: { cpu: '4', memory: '8Gi' } }, env: [{ name: 'UNCHANGED', value: 'kept' }, { name: 'SENDGRID_API_KEY', valueSource: { secretKeyRef: { secret, version: '7' } } }] }] } });
    expect(h.calls.some(call => call.url.includes(':access'))).toBe(false);
    expect(h.calls.some(call => call.url.includes('supabase') || call.url.includes('northflank'))).toBe(false);
  });
  it.each(['NORTHFLANK_API_TOKEN', 'STRIPE_SECRET_KEY', 'OPENAI_API_KEY', 'NEXT_PUBLIC_SUPABASE_URL'])('blocks retired, optional or build-time keys before identity access (%s)', async key => {
    const h = harness();
    await expect(saveGoogleRuntimeConfiguration('admin', [{ key, value }], h.dependencies)).rejects.toMatchObject({ code: 'key_not_allowed_for_service' });
    expect(h.calls).toEqual([]);
  });
  it('does not grant Store the communications credential scope', async () => {
    const h = harness();
    await expect(saveGoogleRuntimeConfiguration('store', [{ key: 'TELNYX_API_KEY', value }], h.dependencies)).rejects.toMatchObject({ code: 'key_not_allowed_for_service' });
    expect(h.calls).toEqual([]);
  });
  it.each([
    [{ deny: '/secrets/' }, 'permission_denied'],
    [{ scope: 'lms' }, 'secret_scope_mismatch'],
    [{ identity: 'wrong-account@example.test' }, 'unexpected_runtime_identity_or_shape'],
    [{ extraAccessor: true }, 'secret_iam_scope_mismatch'],
  ])('preflights all ownership boundaries before payload writes (%j)', async (options, code) => {
    const h = harness(options);
    await expect(saveGoogleRuntimeConfiguration('admin', [{ key: 'SENDGRID_API_KEY', value }], h.dependencies)).rejects.toMatchObject({ code });
    expect(h.calls.some(call => call.method !== 'GET')).toBe(false);
  });
  it('refuses a write without Google checksum acknowledgement before runtime mutation', async () => {
    const h = harness({ checksum: false });
    await expect(saveGoogleRuntimeConfiguration('admin', [{ key: 'SENDGRID_API_KEY', value }], h.dependencies)).rejects.toMatchObject({ code: 'secret_write_not_verified' });
    expect(h.calls.some(call => call.method === 'PATCH')).toBe(false);
  });
  it.each([
    [{ conflict: true }, 'concurrent_update'],
    [{ failed: true }, 'revision_failed'],
    [{ health: false }, 'service_unhealthy'],
    [{ wrongRevision: true }, 'health_revision_mismatch'],
    [{ stale: true }, 'verification_timeout'],
  ])('never declares incomplete delivery verified (%j)', async (options, code) => {
    const h = harness(options);
    await expect(saveGoogleRuntimeConfiguration('admin', [{ key: 'SENDGRID_API_KEY', value }], h.dependencies)).rejects.toMatchObject({ code });
  });
  it('keeps raw inline credentials out of the operational inventory', async () => {
    const h = harness();
    // An unhealthy/stale runtime cannot be mislabeled as verified.
    h.dependencies.request = (async (input, init) => {
      if (String(input).endsWith('/api/health')) return Response.json({ ready: true, healthy: true, revision: oldRevision.split('/').at(-1) });
      return await harnessRequest(input, init);
    }) as typeof fetch;
    const harnessRequest = harness().dependencies.request;
    const result = await getGoogleRuntimeConfiguration('admin', h.dependencies);
    expect(JSON.stringify(result)).not.toContain('old-private-value');
    expect(result.settings.find(item => item.key === 'SENDGRID_API_KEY')).toMatchObject({ value: '••••••••', verification_status: 'unverified', migration_status: 'legacy-inline' });
  });
});
