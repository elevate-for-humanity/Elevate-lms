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
  it('permits Twilio credentials only in Admin and LMS and rejects malformed account credentials', () => {
    const entries = [{key:'TWILIO_ACCOUNT_SID',value:'AC'+'a'.repeat(32)}, {key:'TWILIO_AUTH_TOKEN',value:'b'.repeat(32)}];
    expect(()=>validateRuntimeEntries('admin',entries)).not.toThrow();
    expect(()=>validateRuntimeEntries('lms',entries)).not.toThrow();
    expect(()=>validateRuntimeEntries('marketing',entries)).toThrow(/key_not_allowed/);
    expect(()=>validateRuntimeEntries('admin',[{key:'TWILIO_AUTH_TOKEN',value:'placeholder'}])).toThrow(/invalid_twilio_credential/);
    expect(()=>validateRuntimeEntries('admin',[{key:'TWILIO_API_KEY_SID',value:entries[0].value}])).toThrow(/invalid_twilio_api_key_sid/);
  });
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
  it('validates tax runtime identifiers and encryption keys before storing them', () => {
    expect(() =>
      validateRuntimeEntries('marketing', [{ key: 'TAX_DATA_ENCRYPTION_KEY', value: 'short' }]),
    ).toThrow('invalid_tax_encryption_key');
    expect(() =>
      validateRuntimeEntries('marketing', [{ key: 'IRS_SOFTWARE_ID', value: '00000000' }]),
    ).toThrow('invalid_irs_software_id');
    expect(() => validateRuntimeEntries('marketing', [{ key: 'IRS_EFIN', value: '123' }])).toThrow(
      'invalid_irs_efin',
    );
    expect(() =>
      validateRuntimeEntries('marketing', [
        { key: 'TAX_DATA_ENCRYPTION_KEY', value: 'ab'.repeat(32) },
        { key: 'IRS_SOFTWARE_ID', value: '12345678' },
        { key: 'IRS_EFIN', value: '123456' },
      ]),
    ).not.toThrow();
  });
  it('uses the known CRC32C vector for integrity checks', () => {
    expect(payloadChecksum(Buffer.from('123456789'))).toBe('3808858755');
  });
});

// GitHub dispatch belongs only to the administrative runtime. Saving a token
// must sync to its bound Google secret rather than silently updating only SQL.
describe('administrative GitHub runtime binding', () => {
  it('allows the Admin token and rejects learner and public bindings', () => {
    expect(() => validateRuntimeEntries('admin', [{ key: 'GITHUB_TOKEN', value: 'test-github-credential' }])).not.toThrow();
    for (const component of ['lms', 'marketing', 'store'] as const) {
      expect(() => validateRuntimeEntries(component, [{ key: 'GITHUB_TOKEN', value: 'test-github-credential' }])).toThrow();
    }
  });
});

describe('phone runtime ownership', () => {
  it('binds device provisioning and relay configuration to the two owning services', () => {
    for (const key of ['PBX_CONTROL_URL', 'PBX_PROVISIONING_TOKEN', 'PBX_STUN_URLS', 'PBX_TURN_URLS', 'PBX_TURN_SHARED_SECRET', 'TWILIO_PHONE_NUMBER']) {
      for (const component of ['admin', 'lms'] as const) {
        expect(policy.components[component].keys).toContain(key);
      }
      for (const component of ['marketing', 'store'] as const) {
        expect(policy.components[component].keys).not.toContain(key);
      }
    }
  });
});

describe('independent commerce configuration', () => {
  it.each(['admin', 'lms', 'marketing', 'store'] as const)('allows %s to own the exact PayPal settings used by billing and webhook verification', component => {
    expect(() => validateRuntimeEntries(component, [
      { key: 'PAYPAL_ENVIRONMENT', value: 'production' },
      { key: 'PAYPAL_BILLING_WEBHOOK_ID', value: 'billing-webhook-fixture' },
      { key: 'PAYPAL_PAYOUT_WEBHOOK_ID', value: 'payout-webhook-fixture' },
    ])).not.toThrow();
  });
});


describe('Google structured authorization errors', () => {
  it.each([
    ['BILLING_DISABLED', 'billing_disabled'],
    ['SERVICE_DISABLED', 'api_disabled'],
    ['ACCESS_TOKEN_SCOPE_INSUFFICIENT', 'insufficient_oauth_scope'],
    ['IAM_PERMISSION_DENIED', 'permission_denied'],
  ])('reports %s without exposing the upstream error', async (reason, code) => {
    const request = vi.fn(async (input: string | URL | Request) => {
      if (String(input).includes('metadata.google.internal')) return Response.json(
        { access_token: 'fixture' }, { headers: { 'Metadata-Flavor': 'Google' } });
      return Response.json({ error: { message: 'private-token-fixture', details: [
        { '@type': 'type.googleapis.com/google.rpc.ErrorInfo', reason },
      ] } }, { status: 403 });
    });
    await expect(saveGoogleRuntimeConfiguration('admin', [{ key: 'GITHUB_TOKEN', value: 'github_pat_fixture' }], { request }))
      .rejects.toMatchObject({ code, phase: 'runtime_inventory' });
  });
});
