import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ createClient: vi.fn(), replace: vi.fn(), notify: vi.fn() }));
vi.mock('@/lib/supabase/client', () => ({ createClient: () => state.createClient() }));

import AuthCallbackPage from '@/apps/lms/app/auth/callback/page';

const realWindow = window;
const provider = 'https://www.elevateforhumanity.org/sites/2exclusive-platinum-cleaning/provider';
let storageKey: string;
let browserNumber = 0;
const user = {
  id: '00000000-0000-0000-0000-000000000001', aud: 'authenticated', role: 'authenticated',
  email: 'callback@qa.invalid', app_metadata: {}, user_metadata: {},
  created_at: '2026-01-01T00:00:00Z',
};
let currentUrl: URL;
let client: SupabaseClient;
let cookieJar: Map<string, string>;
let authFetch: ReturnType<typeof vi.fn>;
let denyCode: boolean;
let denyUser: boolean;

function callbackUrl(destination = provider) {
  const url = new URL('https://app.elevateforhumanity.org/auth/callback');
  url.searchParams.set('code', 'local-callback-code');
  url.searchParams.set('next', destination);
  return url;
}

function tokenResponse() {
  const now = Math.floor(Date.now() / 1000);
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return {
    access_token: `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, iat: now, exp: now + 3600 })}.local-test-signature`,
    refresh_token: 'local-test-refresh', token_type: 'bearer', expires_in: 3600,
    expires_at: now + 3600, user,
  };
}

function createSdkClient() {
  client = createBrowserClient('https://callback-fixture.supabase.co', 'local-test-anon-key', {
    isSingleton: false,
    global: { fetch: authFetch },
    cookieOptions: { name: storageKey },
    cookies: {
      getAll: () => [...cookieJar].map(([name, value]) => ({ name, value })),
      setAll: changes => {
        for (const { name, value } of changes) {
          if (value) cookieJar.set(name, value);
          else cookieJar.delete(name);
        }
      },
    },
  });
  return client;
}

beforeEach(() => {
  vi.clearAllMocks();
  denyCode = false;
  denyUser = false;
  currentUrl = callbackUrl();
  storageKey = `callback-fixture-${++browserNumber}`;
  cookieJar = new Map([[`${storageKey}-code-verifier`, JSON.stringify('local-test-verifier')]]);
  // Use the installed browser Auth SDK and cookie adapter. Only the Auth HTTP
  // boundary is simulated; no real project, account, token or email is used.
  vi.stubGlobal('BroadcastChannel', undefined);
  vi.stubGlobal('window', new Proxy(realWindow, {
    get: (target, key) => {
      if (key === 'location') return {
        href: currentUrl.href, hash: currentUrl.hash, search: currentUrl.search,
        origin: currentUrl.origin, pathname: currentUrl.pathname, replace: state.replace,
      };
      if (key === 'history') return {
        state: null,
        replaceState: (_state: unknown, _title: string, url: string) => { currentUrl = new URL(url, currentUrl); },
      };
      return Reflect.get(target, key);
    },
  }));
  authFetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input));
    if (url.pathname === '/auth/v1/token' && url.searchParams.get('grant_type') === 'pkce') {
      return Response.json(denyCode ? { code: 'bad_code_verifier', message: 'Invalid callback code' } : tokenResponse(), { status: denyCode ? 400 : 200 });
    }
    if (url.pathname === '/auth/v1/user') {
      return Response.json(denyUser ? { code: 'bad_jwt', message: 'Invalid user session' } : user, { status: denyUser ? 401 : 200 });
    }
    throw new Error(`Unexpected mocked Auth request: ${url.pathname}`);
  });
  state.createClient.mockImplementation(createSdkClient);
  state.notify.mockResolvedValue(Response.json({ ok: true }));
  vi.stubGlobal('fetch', state.notify);
});

afterEach(async () => {
  cleanup();
  if (client) await client.auth.stopAutoRefresh();
  vi.unstubAllGlobals();
});

describe('callback with the installed Supabase browser SDK', () => {
  it.each([provider, '/community'])('uses the SDK initialization exchange once before returning to %s', async destination => {
    currentUrl = callbackUrl(destination);
    render(<AuthCallbackPage />);
    await waitFor(() => expect(state.replace).toHaveBeenCalledWith(destination));
    const exchanges = authFetch.mock.calls.filter(([url]) => String(url).includes('grant_type=pkce'));
    expect(exchanges).toHaveLength(1);
    expect(JSON.parse(String(exchanges[0][1]?.body))).toEqual({ auth_code: 'local-callback-code', code_verifier: 'local-test-verifier' });
    expect(cookieJar.has(`${storageKey}-code-verifier`)).toBe(false);
    expect(currentUrl.searchParams.has('code')).toBe(false);
    expect(authFetch.mock.calls.some(([url]) => String(url).endsWith('/auth/v1/user'))).toBe(true);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('explicitly exchanges a new callback on an already initialized client', async () => {
    currentUrl = new URL('https://app.elevateforhumanity.org/community');
    const initializedClient = createSdkClient();
    await initializedClient.auth.initialize();
    state.createClient.mockReturnValue(initializedClient);
    currentUrl = callbackUrl();
    render(<AuthCallbackPage />);
    await waitFor(() => expect(state.replace).toHaveBeenCalledWith(provider));
    expect(authFetch.mock.calls.filter(([url]) => String(url).includes('grant_type=pkce'))).toHaveLength(1);
  });

  it('redeems a callback only from the active StrictMode effect with a preinitialized client', async () => {
    currentUrl = new URL('https://app.elevateforhumanity.org/community');
    const initializedClient = createSdkClient();
    await initializedClient.auth.initialize();
    state.createClient.mockReturnValue(initializedClient);
    currentUrl = callbackUrl();
    render(<StrictMode><AuthCallbackPage /></StrictMode>);
    await waitFor(() => expect(state.replace).toHaveBeenCalledWith(provider));
    expect(authFetch.mock.calls.filter(([url]) => String(url).includes('grant_type=pkce'))).toHaveLength(1);
    expect(state.notify).toHaveBeenCalledTimes(1);
    expect(state.replace).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not replace failed PKCE initialization with an older session', async () => {
    denyCode = true;
    cookieJar.set(storageKey, JSON.stringify(tokenResponse()));
    render(<AuthCallbackPage />);
    await screen.findByRole('alert');
    expect(state.replace).not.toHaveBeenCalled();
    expect(state.notify).not.toHaveBeenCalled();
    expect(authFetch.mock.calls.filter(([url]) => String(url).includes('grant_type=pkce'))).toHaveLength(1);
  });

  it('does not accept an older session when the new callback lacks its verifier', async () => {
    cookieJar.delete(`${storageKey}-code-verifier`);
    cookieJar.set(storageKey, JSON.stringify(tokenResponse()));
    render(<AuthCallbackPage />);
    await screen.findByRole('alert');
    expect(state.replace).not.toHaveBeenCalled();
    expect(state.notify).not.toHaveBeenCalled();
  });

  it('preserves the legacy fragment session after the PKCE client rejects automatic fragment detection', async () => {
    const session = tokenResponse();
    currentUrl = callbackUrl('/reset-password?mode=recovery');
    currentUrl.searchParams.delete('code');
    currentUrl.hash = new URLSearchParams({ access_token: session.access_token, refresh_token: session.refresh_token, type: 'recovery' }).toString();
    cookieJar.clear();
    render(<AuthCallbackPage />);
    await waitFor(() => expect(state.replace).toHaveBeenCalledWith('/reset-password?mode=recovery'));
    expect(authFetch.mock.calls.some(([url]) => String(url).includes('grant_type=pkce'))).toBe(false);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not redirect when the Auth server rejects the resulting user session', async () => {
    denyUser = true;
    render(<AuthCallbackPage />);
    await screen.findByRole('alert');
    expect(state.replace).not.toHaveBeenCalled();
    expect(state.notify).not.toHaveBeenCalled();
  });
});
