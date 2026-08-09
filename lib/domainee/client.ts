import 'server-only';
import crypto from 'node:crypto';

const API_BASE = 'https://api.domainee.dev/v1';

export class DomaineeError extends Error {
  status: number;
  body?: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'DomaineeError';
    this.status = status;
    this.body = body;
  }
}

function isUsableKey(value: string | undefined | null): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed.length < 10) return false;
  return trimmed.startsWith('sk_live_') || trimmed.startsWith('sk_test_');
}

export function getDomaineeApiKey(): string | null {
  const key = process.env.DOMAINEE_API_KEY;
  return isUsableKey(key) ? key : null;
}

export function isDomaineeConfigured(): boolean {
  return getDomaineeApiKey() !== null;
}

async function domaineeFetch<T>(
  path: string,
  options: RequestInit & { idempotencyKey?: string } = {},
): Promise<T> {
  const key = getDomaineeApiKey();
  if (!key) {
    throw new DomaineeError('DOMAINEE_API_KEY is not configured.', 500);
  }
  const { idempotencyKey, headers, ...rest } = options;
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      ...(headers as Record<string, string> | undefined),
    },
  });
  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new DomaineeError(`Domainee non-JSON ${res.status}: ${text.slice(0, 300)}`, res.status);
  }
  if (!res.ok) {
    const err = json as { error?: string; message?: string } | null;
    const detail = err?.message || err?.error || text || `HTTP ${res.status}`;
    throw new DomaineeError(
      `Domainee ${res.status} ${options.method || 'GET'} ${path}: ${detail}`,
      res.status,
      json,
    );
  }
  return json as T;
}

export async function connectDomain(
  hostname: string,
  originUrl: string,
  opts: {
    metadata?: Record<string, unknown>;
    mode?: string;
    redirectWww?: boolean;
    idempotencyKey?: string;
  } = {},
) {
  const type = await import('./types');
  return domaineeFetch<type.DomaineeConnectResponse>('/domains', {
    method: 'POST',
    body: JSON.stringify({
      hostname,
      originUrl,
      mode: opts.mode ?? 'proxy',
      redirectWww: opts.redirectWww ?? false,
      metadata: opts.metadata ?? {},
    }),
    idempotencyKey: opts.idempotencyKey,
  });
}

/** Live availability + pass-through cost. This call does not charge or create a purchase. */
export async function checkDomainPurchase(hostname: string) {
  const type = await import('./types');
  const query = new URLSearchParams({ hostname });
  return domaineeFetch<type.DomaineePurchaseQuote>(`/domain-purchases/check?${query.toString()}`, {
    method: 'GET',
  });
}

export async function buyDomain(
  hostname: string,
  years: number,
  registrant: import('./types').DomaineeRegistrant,
  opts: {
    originUrl?: string;
    customerReference?: string;
    idempotencyKey?: string;
  } = {},
) {
  const type = await import('./types');
  const body: Record<string, unknown> = { hostname, years, registrant };
  if (opts.customerReference) body.customerReference = opts.customerReference;
  if (opts.originUrl) body.autoConnect = { originUrl: opts.originUrl };
  return domaineeFetch<type.DomaineeBuyResponse>('/domain-purchases', {
    method: 'POST',
    body: JSON.stringify(body),
    idempotencyKey: opts.idempotencyKey,
  });
}

export async function getDomain(domainId: string) {
  const type = await import('./types');
  return domaineeFetch<{ domain: type.DomaineeDomain }>(`/domains/${domainId}`, { method: 'GET' });
}

export async function getPurchase(purchaseId: string) {
  const type = await import('./types');
  return domaineeFetch<{ purchase: type.DomaineePurchase }>(`/domain-purchases/${purchaseId}`, {
    method: 'GET',
  });
}

export async function listDomains(cursor?: string) {
  const type = await import('./types');
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return domaineeFetch<type.DomaineeListResponse>(`/domains${qs}`, { method: 'GET' });
}

export async function deleteDomain(domainId: string) {
  return domaineeFetch<{ deleted: boolean }>(`/domains/${domainId}`, { method: 'DELETE' });
}

export function verifyDomaineeWebhook(
  rawBody: string | Buffer,
  signature: string,
  secret: string,
): boolean {
  if (!signature || !secret) return false;
  const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function getDomaineeWebhookSecret(): string | null {
  const secret = process.env.DOMAINEE_WEBHOOK_SECRET;
  return secret && secret.trim().length > 10 ? secret.trim() : null;
}
