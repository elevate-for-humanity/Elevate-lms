import 'server-only';
import crypto from 'node:crypto';
import type {
  DomaineeBuyResponse,
  DomaineeConnectResponse,
  DomaineeDomain,
  DomaineeListResponse,
  DomaineePurchase,
  DomaineePurchaseQuote,
  DomaineeRegistrant,
} from './types';

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
  return trimmed.length >= 10 && (trimmed.startsWith('sk_live_') || trimmed.startsWith('sk_test_'));
}

export function getDomaineeApiKey(): string | null {
  return isUsableKey(process.env.DOMAINEE_API_KEY) ? process.env.DOMAINEE_API_KEY!.trim() : null;
}

export function isDomaineeConfigured(): boolean {
  return getDomaineeApiKey() !== null;
}

async function domaineeFetch<T>(
  path: string,
  options: RequestInit & { idempotencyKey?: string } = {},
): Promise<T> {
  const key = getDomaineeApiKey();
  if (!key) throw new DomaineeError('DOMAINEE_API_KEY is not configured.', 500);
  const { idempotencyKey, headers, ...rest } = options;
  const response = await fetch(path.startsWith('http') ? path : `${API_BASE}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      ...(headers as Record<string, string> | undefined),
    },
  });
  const text = await response.text();
  let payload: unknown = null;
  try { payload = text ? JSON.parse(text) : null; }
  catch { throw new DomaineeError(`Domainee returned non-JSON HTTP ${response.status}.`, response.status); }
  if (!response.ok) {
    const detail = payload as { error?: string; message?: string } | null;
    throw new DomaineeError(detail?.message || detail?.error || `Domainee HTTP ${response.status}`, response.status, payload);
  }
  return payload as T;
}

export async function connectDomain(
  hostname: string,
  originUrl: string,
  opts: { metadata?: Record<string, unknown>; mode?: string; redirectWww?: boolean; idempotencyKey?: string } = {},
) {
  return domaineeFetch<DomaineeConnectResponse>('/domains', {
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

/** No-charge live availability and wholesale+Domainee fee quote. */
export async function checkDomainPurchase(hostname: string) {
  const query = new URLSearchParams({ hostname });
  return domaineeFetch<DomaineePurchaseQuote>(`/domain-purchases/check?${query.toString()}`, { method: 'GET' });
}

export async function buyDomain(
  hostname: string,
  years: number,
  registrant: DomaineeRegistrant,
  opts: { originUrl?: string; customerReference?: string; idempotencyKey?: string } = {},
) {
  // Domainee's purchase API uses stateOrProvince; the Elevate UI stores the
  // shorter internal field name `state` and translates it only at this boundary.
  const domaineeRegistrant = {
    firstName: registrant.firstName,
    lastName: registrant.lastName,
    email: registrant.email,
    phone: registrant.phone,
    address1: registrant.address1,
    city: registrant.city,
    stateOrProvince: registrant.state,
    postalCode: registrant.postalCode,
    country: registrant.country,
  };
  const body: Record<string, unknown> = { hostname, years, registrant: domaineeRegistrant };
  if (opts.customerReference) body.customerReference = opts.customerReference;
  if (opts.originUrl) body.autoConnect = { originUrl: opts.originUrl };
  return domaineeFetch<DomaineeBuyResponse>('/domain-purchases', {
    method: 'POST',
    body: JSON.stringify(body),
    idempotencyKey: opts.idempotencyKey,
  });
}

export async function getDomain(domainId: string) {
  return domaineeFetch<{ domain: DomaineeDomain }>(`/domains/${domainId}`, { method: 'GET' });
}

export async function getPurchase(purchaseId: string) {
  return domaineeFetch<{ purchase: DomaineePurchase }>(`/domain-purchases/${purchaseId}`, { method: 'GET' });
}

export async function listDomains(cursor?: string) {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return domaineeFetch<DomaineeListResponse>(`/domains${qs}`, { method: 'GET' });
}

export async function deleteDomain(domainId: string) {
  return domaineeFetch<{ deleted: boolean }>(`/domains/${domainId}`, { method: 'DELETE' });
}

export function verifyDomaineeWebhook(rawBody: string | Buffer, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function getDomaineeWebhookSecret(): string | null {
  const secret = process.env.DOMAINEE_WEBHOOK_SECRET?.trim();
  return secret && secret.length > 10 ? secret : null;
}
