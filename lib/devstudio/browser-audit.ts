import 'server-only';

type BrowserSession = {
  id: string;
  token: string;
  url: string;
  viewport: { width: number; height: number };
};

type BrowserAudit = {
  title: string;
  url: string;
  viewport: { width: number; height: number };
  document: { width: number; height: number };
  horizontalOverflow: boolean;
  counts: Record<string, number>;
  accessibilityHeuristics: {
    missingAlt: string[];
    unlabeledControls: string[];
    emptyLinks: Array<string | null>;
    headingSkips: Array<{ previous: number; current: number; text: string }>;
  };
  browserEvents: Array<{
    type: string;
    at: string;
    level?: string;
    text?: string;
    url?: string;
    status?: number;
    error?: string;
  }>;
  evidenceCapturedAt: string;
};

const DEFAULT_TARGET = 'https://www.elevateforhumanity.org';

function browserConfiguration() {
  return {
    url: (process.env.STUDIO_BROWSER_URL || '').replace(/\/$/, ''),
    secret: process.env.STUDIO_BROWSER_SECRET || '',
  };
}

function validatedTarget(input?: string) {
  const target = new URL(input || DEFAULT_TARGET);
  const host = target.hostname.toLowerCase();
  if (
    !['http:', 'https:'].includes(target.protocol) ||
    target.username ||
    target.password ||
    (target.port && !['80', '443'].includes(target.port)) ||
    !(host === 'elevateforhumanity.org' || host.endsWith('.elevateforhumanity.org'))
  ) {
    throw new Error('Live Studio audits are limited to Elevate production domains');
  }
  return target.toString();
}

async function readJson<T>(response: Response, fallback: string): Promise<T> {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const reason =
      payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error?: unknown }).error)
        : fallback;
    throw new Error(reason);
  }
  return payload as T;
}

async function captureViewport(
  workerUrl: string,
  secret: string,
  target: string,
  viewport: { width: number; height: number },
) {
  const session = await readJson<BrowserSession>(
    await fetch(`${workerUrl}/sessions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-studio-browser-secret': secret },
      body: JSON.stringify({ url: target, ...viewport }),
      cache: 'no-store',
      signal: AbortSignal.timeout(40_000),
    }),
    'Studio Browser could not start a live session',
  );

  const authorization = { Authorization: `Bearer ${session.token}` };
  try {
    return await readJson<BrowserAudit>(
      await fetch(`${workerUrl}/sessions/${session.id}/audit`, {
        headers: authorization,
        cache: 'no-store',
        signal: AbortSignal.timeout(20_000),
      }),
      'Studio Browser could not collect audit evidence',
    );
  } finally {
    await fetch(`${workerUrl}/sessions/${session.id}`, {
      method: 'DELETE',
      headers: authorization,
      signal: AbortSignal.timeout(10_000),
    }).catch(() => undefined);
  }
}

export async function runStudioBrowserAudit(input?: { url?: string; includeMobile?: boolean }) {
  const config = browserConfiguration();
  if (!config.url || !config.secret) {
    throw new Error(
      'Studio Browser is not configured. STUDIO_BROWSER_URL and STUDIO_BROWSER_SECRET are required.',
    );
  }
  const target = validatedTarget(input?.url);
  const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
    ...(input?.includeMobile === false ? [] : [{ name: 'mobile', width: 390, height: 844 }]),
  ];
  const results = [];
  for (const viewport of viewports) {
    results.push({
      viewport: viewport.name,
      audit: await captureViewport(config.url, config.secret, target, viewport),
    });
  }
  return {
    evidenceType: 'live-playwright-browser-audit',
    target,
    results,
    checked: [
      'page load',
      'console errors and warnings',
      'page errors',
      'failed requests',
      'HTTP 4xx/5xx responses',
      'horizontal overflow',
      'missing image alt attributes',
      'unnamed visible controls',
      'empty visible links',
      'heading-level skips',
    ],
    limitations: [
      'Accessibility results are deterministic heuristics, not a complete WCAG conformance audit.',
      'Controls are inventoried but destructive or transactional actions are not clicked.',
    ],
  };
}
