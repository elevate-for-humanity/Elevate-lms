// @vitest-environment node
import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ELEVATE_MEDIA_RUNTIME_KEYS,
  isElevateMediaRuntimeKey,
  syncElevateMediaToNorthflank,
  validateElevateMediaUpdates,
} from '../../lib/northflank/elevate-media-sync';

const changes = {
  ELEVATE_MEDIA_PROVIDER: 'backblaze-b2',
  ELEVATE_MEDIA_ACCESS_KEY_ID: 'fixture-key-id',
  ELEVATE_MEDIA_SECRET_ACCESS_KEY: 'fixture-application-key',
};
const env = { NORTHFLANK_PROJECT_ID: 'fixture-project', NORTHFLANK_API_TOKEN: 'fixture-token' };
const restrictions = {
  restricted: true,
  nfObjects: [{ id: 'elevate-admin', type: 'service' }, { id: 'elevate-lms', type: 'service' }],
  tagMatchCondition: 'or',
};
const initialGroup = () => ({
  type: 'secret', secretType: 'environment', priority: 30, restrictions,
  secrets: { variables: { ELEVATE_MEDIA_BUCKET: 'fixture-bucket' }, files: { '/keep': 'fixture-file' } },
});

type Call = { url: string; init: RequestInit };
function harness(options: {
  missing?: boolean;
  readStatus?: number;
  malformed?: boolean;
  tamper?: boolean;
  wrongScope?: boolean;
  tags?: boolean;
  override?: boolean;
  writeStatus?: number;
  missingServiceValues?: boolean;
  reverseScope?: boolean;
  serviceIds?: string[];
} = {}) {
  let group: any = options.missing ? null : initialGroup();
  if (group && options.malformed) group.secrets = {};
  if (group && options.wrongScope) group.restrictions = { ...restrictions, restricted: false };
  if (group && options.tags) group.restrictions = { ...restrictions, tags: ['public'] };
  if (group && options.reverseScope) group.restrictions = { ...restrictions, nfObjects: [...restrictions.nfObjects].reverse() };
  let written = false;
  const calls: Call[] = [];
  const request = (async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = String(input);
    calls.push({ url, init });
    if (init.method === 'POST' || init.method === 'PATCH') {
      if (options.writeStatus) return new Response('fixture-application-key must not be echoed', { status: options.writeStatus });
      group = JSON.parse(String(init.body));
      written = true;
      return Response.json({ data: group });
    }
    if (url.includes('/services/')) {
      if (options.missingServiceValues) return Response.json({ data: {} });
      return Response.json({ data: { runtimeEnvironment: {
        ...group.secrets.variables,
        ...(options.override ? { ELEVATE_MEDIA_SECRET_ACCESS_KEY: 'overriding-value' } : {}),
      } } });
    }
    if (options.readStatus && !written) return new Response('not returned to caller', { status: options.readStatus });
    if (!group) return new Response('', { status: 404 });
    const readGroup = structuredClone(group);
    if (written && options.tamper) readGroup.secrets.variables.ELEVATE_MEDIA_SECRET_ACCESS_KEY = 'wrong-value';
    return Response.json({ data: readGroup });
  }) as typeof fetch;
  return { calls, request, getGroup: () => group };
}

describe('Elevate Media Northflank configuration sync', () => {
  it('recognizes only the permitted media runtime settings', () => {
    assert.equal(ELEVATE_MEDIA_RUNTIME_KEYS.length, 11);
    assert.equal(isElevateMediaRuntimeKey('ELEVATE_MEDIA_SECRET_ACCESS_KEY'), true);
    assert.equal(isElevateMediaRuntimeKey('NEXT_PUBLIC_ELEVATE_MEDIA_SECRET_ACCESS_KEY'), false);
    assert.throws(() => validateElevateMediaUpdates({ NORTHFLANK_API_TOKEN: 'not-allowed' }), /Unsupported/);
  });

  it('requires both parts when rotating a credential pair', () => {
    assert.throws(() => validateElevateMediaUpdates({ ELEVATE_MEDIA_ACCESS_KEY_ID: 'new-id' }), /together/);
    assert.throws(() => validateElevateMediaUpdates({ ELEVATE_MEDIA_SECRET_ACCESS_KEY: 'new-key' }), /together/);
    assert.doesNotThrow(() => validateElevateMediaUpdates(changes));
  });

  it('does not replace credentials with a masked display value', () => {
    assert.throws(() => validateElevateMediaUpdates({ ...changes, ELEVATE_MEDIA_SECRET_ACCESS_KEY: '••••••••' }), /Masked/);
  });

  it('rejects newline and excessive-size values without echoing them', () => {
    assert.throws(() => validateElevateMediaUpdates({ ELEVATE_MEDIA_BUCKET: 'bad\nvalue' }), /Invalid/);
    assert.throws(() => validateElevateMediaUpdates({ ELEVATE_MEDIA_BUCKET: 'a'.repeat(16_385) }), /Invalid/);
  });

  it('creates one runtime-only group restricted to Admin and LMS and verifies both services', async () => {
    const h = harness({ missing: true });
    const result = await syncElevateMediaToNorthflank(changes, { env, request: h.request });
    assert.deepEqual(result.services, ['admin', 'lms']);
    assert.equal(result.configurationVerified, true);
    assert.equal(result.restartRequired, true);
    assert.equal(result.bucketConnectionTested, false);
    assert.deepEqual(h.getGroup().restrictions, restrictions);
    assert.equal(h.getGroup().secretType, 'environment');
    assert.equal(h.calls.filter(({ init }) => init.method === 'POST').length, 1);
    assert.equal(h.calls.filter(({ url }) => url.includes('/services/')).length, 2);
    assert.ok(!JSON.stringify(result).includes(changes.ELEVATE_MEDIA_SECRET_ACCESS_KEY));
    assert.ok(h.calls.every(({ url }) => url.startsWith('https://api.northflank.com/v1/projects/fixture-project/')));
    assert.ok(h.calls.every(({ init }) => init.redirect === 'error' && init.cache === 'no-store'));
    assert.ok(h.calls.every(({ url }) => !url.includes('backblaze') && !url.includes('/restart') && !url.includes('/build')));
  });

  it('updates in one batch and preserves unrelated saved variables and files', async () => {
    const h = harness();
    await syncElevateMediaToNorthflank(changes, { env, request: h.request });
    assert.equal(h.calls.filter(({ init }) => init.method === 'PATCH').length, 1);
    assert.equal(h.calls.filter(({ init }) => init.method === 'POST').length, 0);
    assert.equal(h.getGroup().secrets.variables.ELEVATE_MEDIA_BUCKET, 'fixture-bucket');
    assert.deepEqual(h.getGroup().secrets.files, { '/keep': 'fixture-file' });
  });

  it('accepts equivalent service restrictions in either order', async () => {
    const h = harness({ reverseScope: true });
    const result = await syncElevateMediaToNorthflank(changes, { env, request: h.request });
    assert.equal(result.configurationVerified, true);
  });

  for (const status of [401, 403, 429, 500]) {
    it(`never treats HTTP ${status} as a missing group or attempts a write`, async () => {
      const h = harness({ readStatus: status });
      await assert.rejects(syncElevateMediaToNorthflank(changes, { env, request: h.request }), new RegExp(`HTTP ${status}`));
      assert.equal(h.calls.length, 1);
    });
  }

  it('does not overwrite a group whose secret values were omitted', async () => {
    const h = harness({ malformed: true });
    await assert.rejects(syncElevateMediaToNorthflank(changes, { env, request: h.request }), /readable/);
    assert.equal(h.calls.length, 1);
  });

  it('refuses unrestricted groups rather than exposing media credentials to Marketing', async () => {
    const h = harness({ wrongScope: true });
    await assert.rejects(syncElevateMediaToNorthflank(changes, { env, request: h.request }), /service-restricted/);
    assert.equal(h.calls.length, 1);
  });

  it('refuses extra tag access selectors', async () => {
    const h = harness({ tags: true });
    await assert.rejects(syncElevateMediaToNorthflank(changes, { env, request: h.request }), /additional access/);
    assert.equal(h.calls.length, 1);
  });

  it('fails when read-back differs from the intended saved values', async () => {
    const h = harness({ tamper: true });
    await assert.rejects(syncElevateMediaToNorthflank(changes, { env, request: h.request }), /did not match/);
  });

  it('detects service-level overrides instead of claiming a working sync', async () => {
    const h = harness({ override: true });
    await assert.rejects(syncElevateMediaToNorthflank(changes, { env, request: h.request }), /overriding/);
  });

  it('fails closed when effective service settings cannot be read', async () => {
    const h = harness({ missingServiceValues: true });
    await assert.rejects(syncElevateMediaToNorthflank(changes, { env, request: h.request }), /readable/);
  });

  it('never returns a failed API response body containing credentials', async () => {
    const h = harness({ writeStatus: 400 });
    await assert.rejects(syncElevateMediaToNorthflank(changes, { env, request: h.request }), (error: Error) => {
      assert.match(error.message, /HTTP 400/);
      assert.ok(!error.message.includes('fixture-application-key'));
      return true;
    });
  });

  it('requires Northflank authorization without making a network request', async () => {
    const h = harness();
    await assert.rejects(syncElevateMediaToNorthflank(changes, { env: {}, request: h.request }), /not configured/);
    assert.equal(h.calls.length, 0);
  });

  it('does not silently sync an empty change set', async () => {
    const h = harness();
    await assert.rejects(syncElevateMediaToNorthflank({}, { env, request: h.request }), /No Elevate/);
    assert.equal(h.calls.length, 0);
  });

  it('uses configured project and service identifiers', async () => {
    const h = harness({ missing: true });
    const customEnv = { ...env, NORTHFLANK_PROJECT_ID: 'my-project', NORTHFLANK_ADMIN_SERVICE_ID: 'admin-custom', NORTHFLANK_LMS_SERVICE_ID: 'lms-custom' };
    await syncElevateMediaToNorthflank(changes, { env: customEnv, request: h.request });
    assert.deepEqual(h.getGroup().restrictions.nfObjects.map((item: any) => item.id), ['admin-custom', 'lms-custom']);
    assert.ok(h.calls.every(({ url }) => url.includes('/projects/my-project/')));
  });

  it('keeps Admin authorization ahead of service-scoped Google writes', () => {
    const source = readFileSync('apps/admin/app/api/admin/env-vars/route.ts', 'utf8');
    const post = source.slice(source.indexOf('export async function POST'));
    assert.ok(post.indexOf('apiRequireAdmin(req)') < post.indexOf('saveGoogleRuntimeConfiguration(component, entries)'));
    assert.match(post, /validateRuntimeEntries\(component, entries\)/);
    assert.doesNotMatch(post, /syncElevateMediaToNorthflank/);
    assert.doesNotMatch(post, /set_platform_secret|pending-google-secret-manager/);
    assert.match(post, /return NextResponse\.json\(\{ \.\.\.result, auditRecorded: true \}\)/);
    const google = readFileSync('lib/google/runtime-configuration.ts', 'utf8');
    assert.match(google, /await client\.health\(ready\)/);
    assert.match(google, /value: variable \? '••••••••' : ''/);
  });
});
