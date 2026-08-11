'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type DemoSalesState = Record<string, unknown>;

export function useDemoSalesSession(productKey: string, scenarioKey?: string) {
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<DemoSalesState>({});
  const [ready, setReady] = useState(false);
  const creating = useRef(false);

  useEffect(() => {
    if (creating.current) return;
    creating.current = true;
    const storageKey = `elevate-demo:${productKey}:${scenarioKey ?? 'default'}`;
    const existing = window.sessionStorage.getItem(storageKey);
    if (existing) {
      setToken(existing);
      setReady(true);
      return;
    }

    fetch('/api/store/demo/session', {
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
    })
      .then((response) => response.json())
      .then((payload) => {
        const nextToken = payload?.demo?.session_token;
        if (typeof nextToken === 'string') {
          window.sessionStorage.setItem(storageKey, nextToken);
          setToken(nextToken);
          setState(payload.demo.state ?? {});
        }
      })
      .finally(() => setReady(true));
  }, [productKey, scenarioKey]);

  const patch = useCallback(async (
    statePatch: DemoSalesState,
    event?: DemoSalesState,
  ) => {
    setState((current) => ({ ...current, ...statePatch }));
    if (!token) return;
    const response = await fetch('/api/store/demo/session', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, state: statePatch, event }),
    });
    if (!response.ok) throw new Error('Could not save demo progress.');
  }, [token]);

  return { token, state, setState, patch, ready };
}
