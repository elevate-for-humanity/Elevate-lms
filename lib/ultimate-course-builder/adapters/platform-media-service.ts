const DEFAULT_ADMIN_URL = 'https://admin.elevateforhumanity.org';

function serviceBaseUrl(): string {
  return (
    process.env.ULTIMATE_MEDIA_SERVICE_URL ||
    process.env.NEXT_PUBLIC_ADMIN_URL ||
    DEFAULT_ADMIN_URL
  ).replace(/\/+$/, '');
}

function serviceSecret(): string {
  const value = (
    process.env.ULTIMATE_MEDIA_SERVICE_SECRET ||
    process.env.CRON_SECRET ||
    ''
  ).trim();
  if (!value) throw new Error('ULTIMATE_MEDIA_SERVICE_SECRET_REQUIRED');
  return value;
}

export async function callUltimateMediaService<T>(
  path: string,
  body: unknown,
  timeoutMs: number,
): Promise<T> {
  const response = await fetch(`${serviceBaseUrl()}${path}`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${serviceSecret()}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });

  const raw = await response.text();
  let payload: unknown = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = { error: raw.slice(0, 500) };
    }
  }

  if (!response.ok) {
    const detail =
      payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error?: unknown }).error)
        : `HTTP ${response.status}`;
    throw new Error(`ULTIMATE_MEDIA_SERVICE_FAILED:${response.status}:${detail.slice(0, 400)}`);
  }

  return payload as T;
}
