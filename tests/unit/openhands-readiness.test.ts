import {afterEach, beforeEach, expect, it, vi} from 'vitest';

const h = vi.hoisted(() => ({config: vi.fn()}));
vi.mock('@/lib/devstudio/openhands/client', () => ({getHydratedOpenHandsConfig: h.config}));
vi.mock('@/lib/health/service-health', () => ({getRuntimeReadiness: () => ({commit: 'a'.repeat(40), revision: 'admin-fixture'})}));
import {probeOpenHandsReadiness} from '@/lib/devstudio/paris-openhands-readiness';

beforeEach(() => {
  h.config.mockReset();
  h.config.mockResolvedValue({apiKey: 'private-fixture-key', origin: 'https://app.all-hands.dev', configuredRepository: 'elevate-for-humanity/Elevate-lms'});
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({items: [{id: 'private-task', title: 'private account content'}]})));
});
afterEach(() => {vi.unstubAllEnvs(); vi.unstubAllGlobals();});

it('proves only a read and emits no credential, account, conversation or write evidence', async () => {
  const result = await probeOpenHandsReadiness();
  expect(result).toMatchObject({verified: true, status: 'read_authorization_verified', readOnly: true,
    apiKeyResolved: true, repositoryMatches: true, agentStarted: false, writeAuthority: 'not_exercised', commit: 'a'.repeat(40)});
  expect(fetch).toHaveBeenCalledOnce();
  const [url, init] = vi.mocked(fetch).mock.calls[0];
  expect(url).toBe('https://app.all-hands.dev/api/v1/app-conversations/search?limit=1');
  expect(init).toMatchObject({method: 'GET', redirect: 'error', cache: 'no-store'});
  const headers = new Headers(init?.headers);
  expect(headers.get('Authorization')).toBe('Bearer private-fixture-key');
  expect(headers.has('X-Access-Token')).toBe(false);
  expect(init?.signal).toBeInstanceOf(AbortSignal);
  expect(JSON.stringify(result)).not.toMatch(/private-fixture-key|private-task|private account content/);
});

it.each([
  [{apiKey: ''}, {apiKeyResolved: false, repositoryMatches: true}],
  [{configuredRepository: 'another/repository'}, {apiKeyResolved: true, repositoryMatches: false}],
])('separates configuration failures without calling a provider', async (patch, expected) => {
  h.config.mockResolvedValue({...await h.config(), ...patch});
  expect(await probeOpenHandsReadiness()).toMatchObject({...expected, verified: false, status: 'not_configured', providerRequestMade: false});
  expect(fetch).not.toHaveBeenCalled();
});

it('reports the selected authority without substituting a different credential source', async () => {
  vi.stubEnv('ELEVATE_RUNTIME_CONFIG_PROVIDER', 'google-secret-manager');
  h.config.mockResolvedValue({apiKey: '', configuredRepository: 'elevate-for-humanity/Elevate-lms'});
  expect(await probeOpenHandsReadiness()).toMatchObject({credentialAuthority: 'google-secret-manager', apiKeyResolved: false, verified: false});
  expect(fetch).not.toHaveBeenCalled();
});

it.each(['https://another.example', 'http://app.all-hands.dev', 'https://app.all-hands.dev@another.example'])('never sends a key to unverified origin %s', async origin => {
  h.config.mockResolvedValue({...await h.config(), origin});
  expect(await probeOpenHandsReadiness()).toMatchObject({verified: false, status: 'origin_not_verified', providerRequestMade: false});
  expect(fetch).not.toHaveBeenCalled();
});

it.each([401, 403, 429, 500])('keeps HTTP %s unverified and discards the provider body', async httpStatus => {
  vi.mocked(fetch).mockResolvedValueOnce(new Response('private upstream credential details', {status: httpStatus}));
  const result = await probeOpenHandsReadiness();
  expect(result).toMatchObject({verified: false, httpStatus});
  expect(JSON.stringify(result)).not.toContain('private upstream');
});

it.each([
  () => new Response('<html>sign in</html>', {headers: {'Content-Type': 'text/html'}}),
  () => Response.json({error: 'private error'}),
  () => new Response('invalid JSON private error', {headers: {'Content-Type': 'application/json'}}),
])('rejects misleading HTTP 200 and malformed responses', async response => {
  vi.mocked(fetch).mockResolvedValueOnce(response());
  expect(await probeOpenHandsReadiness()).toMatchObject({verified: false});
});

it('fails closed and redacts configuration and transport exceptions', async () => {
  h.config.mockRejectedValueOnce(Error('private configuration exception'));
  let result = await probeOpenHandsReadiness();
  expect(result).toMatchObject({verified: false, status: 'configuration_unavailable', apiKeyResolved: null, providerRequestMade: false});
  expect(fetch).not.toHaveBeenCalled();
  vi.mocked(fetch).mockRejectedValueOnce(Error('private transport exception'));
  result = await probeOpenHandsReadiness();
  expect(result).toMatchObject({verified: false, status: 'provider_request_failed'});
  expect(JSON.stringify(result)).not.toContain('private');
});
