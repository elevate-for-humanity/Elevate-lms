#!/usr/bin/env tsx
/**
 * Reconcile the authoritative Cloudflare DNS record for the Admin service.
 *
 * Required:
 *   CLOUDFLARE_API_TOKEN with Zone:DNS Edit permission
 * Optional:
 *   CLOUDFLARE_ZONE_ID (resolved by zone name when omitted)
 *
 * Canonical mapping:
 *   admin.elevateforhumanity.org -> admin.elevateforhumanity.org.elev-5vfk.dns.northflank.app
 */

const API = 'https://api.cloudflare.com/client/v4';
const ZONE_NAME = 'elevateforhumanity.org';
const RECORD_NAME = 'admin.elevateforhumanity.org';
const RECORD_TARGET = 'admin.elevateforhumanity.org.elev-5vfk.dns.northflank.app';

const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
if (!token) {
  console.error('CLOUDFLARE_API_TOKEN is required to reconcile production Admin DNS.');
  process.exit(1);
}

async function cf<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const body = (await response.json()) as {
    success?: boolean;
    result?: T;
    errors?: Array<{ code?: number; message?: string }>;
  };
  if (!response.ok || !body.success) {
    throw new Error(
      `Cloudflare API ${response.status}: ${body.errors?.map((e) => `${e.code ?? ''} ${e.message ?? ''}`.trim()).join('; ') || 'request failed'}`,
    );
  }
  return body.result as T;
}

async function resolveZoneId(): Promise<string> {
  const configured = process.env.CLOUDFLARE_ZONE_ID?.trim();
  if (configured) return configured;
  const zones = await cf<Array<{ id: string; name: string }>>(`/zones?name=${encodeURIComponent(ZONE_NAME)}&status=active`);
  const zone = zones.find((item) => item.name === ZONE_NAME);
  if (!zone) throw new Error(`Cloudflare zone ${ZONE_NAME} was not found or is not active.`);
  return zone.id;
}

async function main() {
  const zoneId = await resolveZoneId();
  const records = await cf<Array<{ id: string; type: string; name: string; content: string; proxied?: boolean }>>(
    `/zones/${zoneId}/dns_records?name=${encodeURIComponent(RECORD_NAME)}`,
  );

  const canonical = {
    type: 'CNAME',
    name: RECORD_NAME,
    content: RECORD_TARGET,
    ttl: 1,
    proxied: false,
  };

  const record = records[0];
  if (!record) {
    await cf(`/zones/${zoneId}/dns_records`, {
      method: 'POST',
      body: JSON.stringify(canonical),
    });
    console.log(`Created ${RECORD_NAME} CNAME -> ${RECORD_TARGET} (DNS only).`);
    return;
  }

  if (
    record.type === canonical.type &&
    record.content === canonical.content &&
    record.proxied === canonical.proxied
  ) {
    console.log(`Admin DNS already canonical: ${RECORD_NAME} -> ${RECORD_TARGET}.`);
    return;
  }

  await cf(`/zones/${zoneId}/dns_records/${record.id}`, {
    method: 'PUT',
    body: JSON.stringify(canonical),
  });
  console.log(`Updated ${RECORD_NAME} CNAME -> ${RECORD_TARGET} (DNS only).`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
