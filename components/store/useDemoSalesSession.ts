'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type DemoSalesState = Record<string, unknown>;

export function useDemoSalesSession(productKey: string, scenarioKey?: string) {
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<DemoSalesState>({});
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const storageKey = `elevate-demo:${productKey}:${scenarioKey ?? 'default'}`;
  const creating = useRef(false);

  const createSession = useCallback(async () => {
    const response = await fetch('/api/store/demo/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productKey,
        scenarioKey,
        initialState: {},
        utmSource: new URLSearchParams(window.location.search).get('utm_source'),
        utmMedium: new URLSearchParams(window.location.search).get('utm_medium'),
        utmCampaign: new URLSearchParams(window.location.search).get('utm_campaign'),
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || typeof payload?.demo?.session_token !== 'string') {
      throw new Error(payload?.error || 'Could not start demo session.');
    }

    const nextToken = payload.demo.session_token as string;
    window.sessionStorage.setItem(storageKey, nextToken);
    setToken(nextToken);
    setState(payload.demo.state ?? {});
    return nextToken;
  }, [productKey, scenarioKey, storageKey]);

  useEffect(() => {
    if (creating.current) return;
    creating.current = true;
    let cancelled = false;

    async function initialize() {
      setReady(false);
      setError(null);
      try {
        const existing = window.sessionStorage.getItem(storageKey);
        if (existing) {
          const response = await fetch(`/api/store/demo/session?token=${encodeURIComponent(existing)}`, {
            method: 'GET',
            cache: 'no-store',
          });
          const payload = await response.json().catch(() => ({}));
          if (response.ok && typeof payload?.demo?.session_token === 'string') {
            if (!cancelled) {
              setToken(existing);
              setState(payload.demo.state ?? {});
            }
            return;
          }
          window.sessionStorage.removeItem(storageKey);
        }

        if (!cancelled) await createSession();
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : 'Could not initialize demo session.');
          setToken(null);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void initialize();
    return () => {
      cancelled = true;
    };
  }, [createSession, storageKey]);

  const patch = useCallback(async (
    statePatch: DemoSalesState,
    event?: DemoSalesState,
  ) => {
    setState((current) => ({ ...current, ...statePatch }));
    setError(null);

    let activeToken = token;
    if (!activeToken) {
      activeToken = await createSession();
    }

    let response = await fetch('/api/store/demo/session', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: activeToken, state: statePatch, event }),
    });

    if ([404, 409, 410].includes(response.status)) {
      window.sessionStorage.removeItem(storageKey);
      activeToken = await createSession();
      response = await fetch('/api/store/demo/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: activeToken, state: statePatch, event }),
      });
    }

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const message = payload?.error || 'Could not save demo progress.';
      setError(message);
      throw new Error(message);
    }
  }, [createSession, storageKey, token]);

  return { token, state, setState, patch, ready, error };
}
