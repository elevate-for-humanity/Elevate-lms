import { describe, expect, it, vi } from 'vitest';
import policy from '@/config/google-runtime-policy.json';
import {
  payloadChecksum,
  saveGoogleRuntimeConfiguration,
  validateRuntimeEntries,
} from '@/lib/google/runtime-configuration';

const component = 'admin';
const key = 'XAI_API_KEY';
const secret = 'elevate-admin-xai-api-key';
const path = `projects/${policy.project}/locations/${policy.region}/services/${policy.components.admin.service}`;
function harness(
  options: {
    wrongScope?: boolean;
    publicAccess?: boolean;
    staleHealth?: boolean;
    conflict?: boolean;
    wrongBinding?: boolean;
  } = {},
) {
  let patched = false;
  let saved: any;
  const request = vi.fn(async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = String(input);
    if (url.includes('metadata.google.internal'))
      return url.includes('/identity?')
        ? new Response('identity-token', { headers: { 'Metadata-Flavor': 'Google' } })
        : Response.json(
            { access_token: 'test-token' },
            { headers: { 'Metadata-Flavor': 'Google' } },
          );
    if (url.includes(':getIamPolicy'))
      return Response.json({
        bindings: [
          {
            role: `projects/${policy.project}/roles/elevateRuntimeSecretWriterV1`,
            members: [`serviceAccount:${policy.components.admin.identity}`],
          },
          {
            role: 'roles/secretmanager.secretAccessor',
            members: [
              options.publicAccess
                ? 'allUsers'
                : `serviceAccount:${policy.components.admin.identity}`,
            ],
          },
        ],
      });
    if (url.includes(':addVersion'))
      return Response.json({
        name: `projects/${policy.project}/secrets/${secret}/versions/2`,
        state: 'ENABLED',
        clientSpecifiedPayloadChecksum: true,
      });
    if (url.includes('secretmanager.googleapis.com'))
      return Response.json({
        labels: {
          elevate_component: options.wrongScope ? 'marketing' : 'admin',
          elevate_key: 'xai_api_key',
        },
      });
    if (url.endsWith('/api/health'))
      return Response.json({
        ready: true,
        healthy: true,
        revision: options.staleHealth ? 'old' : 'new',
      });
    if (init.method === 'PATCH') {
      if (options.conflict)
        return new Response('private diagnostic must not escape', { status: 412 });
      patched = true;
      saved = JSON.parse(String(init.body));
      return Response.json({});
    }
    const revision = `${path}/revisions/${patched ? 'new' : 'old'}`;
    return Response.json({
      name: path,
      etag: 'original-etag',
      generation: '2',
      observedGeneration: '2',
      terminalCondition: { state: 'CONDITION_SUCCEEDED' },
      latestReadyRevision: revision,
      latestCreatedRevision: revision,
      uri: 'https://admin-test.run.app',
      trafficStatuses: [{ revision, percent: 100 }],
      template: {
        serviceAccount: policy.components.admin.identity,
        containers:
          patched && !options.wrongBinding
            ? saved.template.containers
            : [
                {
                  image: `image@sha256:${'a'.repeat(64)}`,
                  env: [{ name: 'UNRELATED_SETTING', value: 'preserve-me' }],
                },
              ],
      },
    });
  });
  return {
    request,
    saved: () => saved,
    writes: () =>
      request.mock.calls.filter(([, init]) => ['POST', 'PATCH'].includes(init?.method || '')),
  };
}

describe('Google scoped runtime configuration', () => {
  it('verifies numeric secret bindings on the serving revision and preserves unrelated settings', async () => {
    const h = harness();
    const result = await saveGoogleRuntimeConfiguration(
      component,
      [{ key, value: 'private-key' }],
      { request: h.request },
    );
    expect(result).toMatchObject({
      runtimeSynced: true,
      configurationVerified: true,
      revision: `${path}/revisions/new`,
    });
    expect(h.saved().etag).toBe('original-etag');
    expect(h.saved().template.containers[0].env).toEqual([
      { name: 'UNRELATED_SETTING', value: 'preserve-me' },
      { name: key, valueSource: { secretKeyRef: { secret, version: '2' } } },
    ]);
    expect(JSON.stringify(result)).not.toContain('private-key');
    expect(
      h.request.mock.calls.every(
        ([, init]) => init?.redirect === 'error' && init?.cache === 'no-store',
      ),
    ).toBe(true);
  });
  it.each([{ wrongScope: true }, { publicAccess: true }])(
    'refuses an incorrectly scoped destination before any write: %j',
    async (options) => {
      const h = harness(options);
      await expect(
        saveGoogleRuntimeConfiguration(component, [{ key, value: 'private-key' }], {
          request: h.request,
        }),
      ).rejects.toThrow(/scope_mismatch/);
      expect(h.writes()).toHaveLength(0);
    },
  );
  it.each([{ staleHealth: true }, { wrongBinding: true }, { conflict: true }])(
    'does not claim success after failed runtime verification: %j',
    async (options) => {
      const h = harness(options);
      await expect(
        saveGoogleRuntimeConfiguration(component, [{ key, value: 'private-key' }], {
          request: h.request,
        }),
      ).rejects.toThrow(/health_revision_mismatch|runtime_binding_mismatch|concurrent_update/);
    },
  );
  it('rejects cross-service keys, masked credentials and duplicate updates', () => {
    expect(() => validateRuntimeEntries('marketing', [{ key, value: 'private-key' }])).toThrow(
      /key_not_allowed/,
    );
    expect(() => validateRuntimeEntries(component, [{ key, value: '••••••••' }])).toThrow(
      /invalid_or_masked/,
    );
    expect(() =>
      validateRuntimeEntries(component, [
        { key, value: 'one' },
        { key, value: 'two' },
      ]),
    ).toThrow(/invalid_or_masked/);
  });
  it('uses the known CRC32C vector for integrity checks', () => {
    expect(payloadChecksum(Buffer.from('123456789'))).toBe('3808858755');
  });
});
