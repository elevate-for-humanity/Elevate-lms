#!/usr/bin/env tsx
/**
 * Bootstrap and reconcile the production Admin hostname across Northflank and Cloudflare.
 *
 * Required:
 *   NORTHFLANK_API_TOKEN
 *   CLOUDFLARE_API_TOKEN with Zone:DNS Edit permission
 * Optional:
 *   CLOUDFLARE_ZONE_ID (resolved by zone name when omitted)
 *
 * Northflank is the source of truth for verification records and the current
 * CNAME target. Cloudflare is the authoritative DNS provider.
 */

import { nfFetch, resolveTeamId } from './lib';

const CF_API = 'https://api.cloudflare.com/client/v4';
const ZONE_NAME = 'elevateforhumanity.org';
const DOMAIN = 'admin.elevateforhumanity.org';

const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
if (!token) {
  console.error('CLOUDFLARE_API_TOKEN is required to reconcile production Admin DNS.');
  process.exit(1);
}

type TeamDomain = {
  name: string;
  status?: string;
  hostname?: string;
  token?: string;
};

type CfRecord = {
  id: string;
  type: string;
  name: string;
  content: string;
  proxied?: boolean;
};

async function cf<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${CF_API}${path}`, {
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
  const zones = await cf<Array<{ id: string; name: string }>>(
    `/zones?name=${encodeURIComponent(ZONE_NAME)}&status=active`,
  );
  const zone = zones.find((item) => item.name === ZONE_NAME);
  if (!zone) throw new Error(`Cloudflare zone ${ZONE_NAME} was not found or is not active.`);
  return zone.id;
}

async function upsertRecord(
  zoneId: string,
  desired: { type: 'TXT' | 'CNAME'; name: string; content: string; proxied?: boolean },
) {
  const records = await cf<CfRecord[]>(
    `/zones/${zoneId}/dns_records?name=${encodeURIComponent(desired.name)}`,
  );
  const matchingType = records.find((record) => record.type === desired.type);
  const payload = {
    type: desired.type,
    name: desired.name,
    content: desired.content,
    ttl: 1,
    ...(desired.type === 'CNAME' ? { proxied: desired.proxied ?? false } : {}),
  };

  if (!matchingType) {
    await cf(`/zones/${zoneId}/dns_records`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    console.log(`Created Cloudflare ${desired.type} ${desired.name}.`);
    return;
  }

  const alreadyCanonical =
    matchingType.content === desired.content &&
    (desired.type !== 'CNAME' || matchingType.proxied === (desired.proxied ?? false));
  if (alreadyCanonical) {
    console.log(`Cloudflare ${desired.type} ${desired.name} is already canonical.`);
    return;
  }

  await cf(`/zones/${zoneId}/dns_records/${matchingType.id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  console.log(`Updated Cloudflare ${desired.type} ${desired.name}.`);
}

async function ensureNorthflankDomain(teamId: string): Promise<TeamDomain> {
  const list = await nfFetch<{ domains?: TeamDomain[] }>(`/teams/${teamId}/domains`);
  let row = (list.domains ?? []).find((domain) => domain.name === DOMAIN);
  if (!row) {
    console.log(`Registering ${DOMAIN} with Northflank.`);
    row = await nfFetch<TeamDomain>(`/teams/${teamId}/domains`, {
      method: 'POST',
      body: JSON.stringify({ domain: DOMAIN }),
    });
  }
  return row;
}

async function verifyNorthflankTeamDomain(teamId: string, zoneId: string, initial: TeamDomain) {
  let row = initial;
  for (let attempt = 1; attempt <= 24; attempt += 1) {
    if (row.status === 'verified') return;

    if (row.hostname && row.token) {
      await upsertRecord(zoneId, {
        type: 'TXT',
        name: row.hostname,
        content: row.token,
      });
    }

    try {
      await nfFetch(`/teams/${teamId}/domains/${encodeURIComponent(DOMAIN)}/verify`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
    } catch (error) {
      console.log(
        `Northflank team-domain verification pending (${attempt}/24): ${error instanceof Error ? error.message : error}`,
      );
    }

    const latest = await nfFetch<{ domains?: TeamDomain[] }>(`/teams/${teamId}/domains`);
    row = (latest.domains ?? []).find((domain) => domain.name === DOMAIN) ?? row;
    if (row.status === 'verified') return;
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error(`Northflank team-domain verification did not complete for ${DOMAIN}.`);
}

async function reconcileCname(teamId: string, zoneId: string) {
  const row = await nfFetch<{ content?: string; verified?: boolean }>(
    `/teams/${teamId}/domains/${encodeURIComponent(DOMAIN)}/subdomains/@`,
  );
  if (!row.content) throw new Error(`Northflank returned no CNAME target for ${DOMAIN}.`);

  await upsertRecord(zoneId, {
    type: 'CNAME',
    name: DOMAIN,
    content: row.content,
    proxied: false,
  });
  console.log(`Canonical Admin CNAME target: ${row.content}`);

  for (let attempt = 1; attempt <= 24; attempt += 1) {
    const current = await nfFetch<{ content?: string; verified?: boolean }>(
      `/teams/${teamId}/domains/${encodeURIComponent(DOMAIN)}/subdomains/@`,
    );
    if (current.verified) {
      console.log(`Northflank verified ${DOMAIN} CNAME.`);
      return;
    }
    console.log(`Northflank CNAME verification pending (${attempt}/24).`);
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error(`Northflank did not verify the canonical CNAME for ${DOMAIN}.`);
}

async function main() {
  const teamId = resolveTeamId();
  if (!teamId) throw new Error('NORTHFLANK_TEAM_ID is required.');
  const zoneId = await resolveZoneId();
  const domain = await ensureNorthflankDomain(teamId);
  await verifyNorthflankTeamDomain(teamId, zoneId, domain);
  await reconcileCname(teamId, zoneId);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
