import { AuthRetryableFetchError } from '@supabase/supabase-js';

type BrowserAuthFetchOptions = {
  fetchImpl?: typeof fetch;
  now?: () => number;
  readRetryUntil?: () => number;
  writeRetryUntil?: (until: number) => void;
};

const DEFAULT_RETRY_MS = 30_000;
const MAX_RETRY_MS = 300_000;

/** Back off refresh requests only. Identity validation remains in Supabase. */
export function createBrowserAuthFetch(
  supabaseUrl: string,
  { fetchImpl = fetch, now = Date.now, readRetryUntil, writeRetryUntil }: BrowserAuthFetchOptions = {},
): typeof fetch {
  const endpoint = new URL(supabaseUrl);
  let retryUntil = 0;
  const isRefresh = (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
      const method = init?.method ?? (typeof Request !== 'undefined' && input instanceof Request ? input.method : 'GET');
      return method.toUpperCase() === 'POST' && url.origin === endpoint.origin &&
        url.pathname === '/auth/v1/token' && url.searchParams.get('grant_type') === 'refresh_token';
    } catch { return false; }
  };
  return async (input, init) => {
    if (!isRefresh(input, init)) return fetchImpl(input, init);
    const signal = init?.signal ?? (typeof Request !== 'undefined' && input instanceof Request ? input.signal : undefined);
    signal?.throwIfAborted();
    const current = now();
    let shared = 0;
    try { shared = Number(readRetryUntil?.() || 0); } catch { /* Storage may be unavailable. */ }
    if (Number.isFinite(shared) && shared > current && shared <= current + MAX_RETRY_MS)
      retryUntil = Math.max(retryUntil, shared);
    if (retryUntil > current) {
      throw new AuthRetryableFetchError('Authentication refresh is waiting for the provider retry window.', 429);
    }
    const response = await fetchImpl(input, init);
    if (response.status === 429) {
      const raw = response.headers.get('retry-after');
      const seconds = raw?.trim() ? Number(raw) : NaN;
      const delay = Number.isFinite(seconds) ? seconds * 1000 : raw ? Date.parse(raw) - now() : DEFAULT_RETRY_MS;
      retryUntil = now() + Math.min(MAX_RETRY_MS, Math.max(1000, Number.isFinite(delay) ? delay : DEFAULT_RETRY_MS));
      try { writeRetryUntil?.(retryUntil); } catch { /* The in-memory bound still applies. */ }
      // auth-js 2.89 treats a raw 429 as a permanent error and removes the
      // session. Classify refresh throttling as retryable without accepting
      // expired credentials or changing any server authorization checks.
      throw new AuthRetryableFetchError('Authentication refresh was rate limited by the provider.', 429);
    }
    return response;
  };
}

const browserFetchers = new Map<string, typeof fetch>();
export function getBrowserAuthFetch(supabaseUrl: string): typeof fetch {
  if (typeof window === 'undefined') return fetch;
  const origin = new URL(supabaseUrl).origin;
  let transport = browserFetchers.get(origin);
  if (!transport) {
    const key = 'efh:auth:refresh-retry:' + origin;
    transport = createBrowserAuthFetch(origin, {
      readRetryUntil: () => Number(window.localStorage.getItem(key) || 0),
      writeRetryUntil: until => window.localStorage.setItem(key, String(until)),
    });
    browserFetchers.set(origin, transport);
  }
  return transport;
}
