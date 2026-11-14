#!/usr/bin/env tsx
/**
 * Register/verify store.elevateforhumanity.org with Northflank and assign it to
 * the isolated elevate-store service. If Cloudflare credentials are present,
 * the script can also upsert the required CNAME automatically. If DNS is
 * authoritative elsewhere (for example Durable), the existing CNAME is used
 * and Northflank verification/assignment still completes.
 */
import { nfFetch, projectApiPath, resolveProjectId, resolveTeamId } from './lib';

const DOMAIN = process.env.NEXT_PUBLIC_STORE_DOMAIN || 'store.elevateforhumanity.org';
const SERVICE_ID = process.env.NORTHFLANK_STORE_SERVICE_ID || 'elevate-store';
const PORT_NAME = 'store';
const CLOUDFLARE_API = 'https://api.cloudflare.com/client/v4';

type TeamDomain = {
  name: string;
  status?: string;
};

type Subdomain = {
  fullName?: string;
  content?: string;
  verified?: boolean;
};

type ServicePort = {
  id: string;
  name: string;
  internalPort: number;
  public?: boolean;
  protocol?: string;
  dns?: string;
  domains?: Array<{ name: string }>;
};

async function listTeamDomains(teamId: string): Promise<TeamDomain[]> {
  const data = await nfFetch<{ domains?: TeamDomain[] }>(`/teams/${teamId}/domains`);
  return data.domains ?? [];
}

async function ensureDomainRegistered(teamId: string): Promise<void> {
  const existing = await listTeamDomains(teamId);
  if (existing.some((row) => row.name === DOMAIN)) return;
  await nfFetch(`/teams/${teamId}/domains`, {
    method: 'POST',
    body: JSON.stringify({ domain: DOMAIN }),
  });
  console.log(`Registered Northflank domain ${DOMAIN}`);
}

async function readSubdomain(teamId: string): Promise<Subdomain> {
  return nfFetch<Subdomain>(
    `/teams/${teamId}/domains/${encodeURIComponent(DOMAIN)}/subdomains/@`,
  );
}

async function cloudflareFetch(path: string, init: RequestInit = {}) {
  const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
  if (!token) throw new Error('CLOUDFLARE_API_TOKEN is not configured');
  const response = await fetch(`${CLOUDFLARE_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  const data = await response.json() as { success?: boolean; errors?: unknown[]; result?: any };
  if (!response.ok || !data.success) {
    throw new Error(`Cloudflare ${response.status}: ${JSON.stringify(data.errors ?? data)}`);
  }
  return data.result;
}

async function resolveCloudflareZoneId(): Promise<string> {
  const configured = process.env.CLOUDFLARE_ZONE_ID?.trim();
  if (configured) return configured;
  const zones = await cloudflareFetch('/zones?name=elevateforhumanity.org&status=active');
  const zoneId = Array.isArray(zones) ? zones[0]?.id : undefined;
  if (!zoneId) throw new Error('Could not resolve Cloudflare zone elevateforhumanity.org');
  return zoneId;
}

async function upsertCloudflareCname(target: string): Promise<void> {
  const zoneId = await resolveCloudflareZoneId();
  const records = await cloudflareFetch(
    `/zones/${zoneId}/dns_records?type=CNAME&name=${encodeURIComponent(DOMAIN)}`,
  );
  const payload = {
    type: 'CNAME',
    name: DOMAIN,
    content: target,
    ttl: 1,
    proxied: false,
  };
  const existing = Array.isArray(records) ? records[0] : undefined;
  if (existing?.id) {
    await cloudflareFetch(`/zones/${zoneId}/dns_records/${existing.id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    console.log(`Updated Cloudflare CNAME ${DOMAIN} -> ${target}`);
  } else {
    await cloudflareFetch(`/zones/${zoneId}/dns_records`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    console.log(`Created Cloudflare CNAME ${DOMAIN} -> ${target}`);
  }
}

async function verifyNorthflank(teamId: string): Promise<Subdomain> {
  for (let attempt = 1; attempt <= 36; attempt += 1) {
    try {
      await nfFetch(
        `/teams/${teamId}/domains/${encodeURIComponent(DOMAIN)}/subdomains/@/verify`,
        { method: 'POST', body: JSON.stringify({}) },
      );
    } catch {
      // Northflank can return a verification error while DNS/SSL is propagating.
    }
    const row = await readSubdomain(teamId);
    if (row.verified) return row;
    console.log(`Waiting for Northflank domain verification (${attempt}/36)...`);
    await new Promise((resolve) => setTimeout(resolve, 10_000));
  }
  throw new Error(`${DOMAIN} did not verify in Northflank after DNS propagation window`);
}

async function assignDomain(teamId: string, projectId: string): Promise<void> {
  const pathEnc = encodeURIComponent('/');
  await nfFetch(
    `/teams/${teamId}/domains/${encodeURIComponent(DOMAIN)}/subdomains/@/paths/${pathEnc}/assign`,
    {
      method: 'POST',
      body: JSON.stringify({
        assignment: { project: projectId, service: SERVICE_ID, port: PORT_NAME },
      }),
    },
  );
  console.log(`Assigned ${DOMAIN}/ to ${SERVICE_ID}:${PORT_NAME}`);

  const data = await nfFetch<{ ports?: ServicePort[] }>(
    projectApiPath(projectId, `/services/${SERVICE_ID}/ports`),
  );
  const ports = data.ports ?? [];
  const storePort = ports.find((port) => port.name === PORT_NAME) ?? ports[0];
  if (!storePort) throw new Error(`No public port found on ${SERVICE_ID}`);

  const merged = [...new Set([...(storePort.domains ?? []).map((d) => d.name), DOMAIN])];
  await nfFetch(projectApiPath(projectId, `/services/${SERVICE_ID}/ports`), {
    method: 'POST',
    body: JSON.stringify({
      ports: ports.map((port) => ({
        id: port.id,
        name: port.name,
        internalPort: port.internalPort,
        public: port.public,
        protocol: port.protocol || 'HTTP',
        domains: port.id === storePort.id
          ? merged
          : (port.domains ?? []).map((d) => d.name),
      })),
    }),
  });
}

async function main() {
  const execute = process.argv.includes('--execute');
  const projectId = resolveProjectId();
  const teamId = resolveTeamId();
  if (!projectId || !teamId) throw new Error('Northflank project/team configuration is required');

  await ensureDomainRegistered(teamId);
  let subdomain = await readSubdomain(teamId);
  console.log(`Northflank CNAME target for ${DOMAIN}: ${subdomain.content ?? '(missing)'}`);

  if (!execute) {
    console.log(`Verified: ${Boolean(subdomain.verified)}`);
    return;
  }

  if (!subdomain.content) throw new Error(`Northflank did not return a CNAME target for ${DOMAIN}`);

  if (process.env.CLOUDFLARE_API_TOKEN?.trim()) {
    await upsertCloudflareCname(subdomain.content);
  } else {
    console.log(`Cloudflare credentials not supplied; using existing authoritative DNS for ${DOMAIN}.`);
    console.log(`Expected CNAME: ${DOMAIN} -> ${subdomain.content}`);
  }

  subdomain = await verifyNorthflank(teamId);
  if (!subdomain.verified) throw new Error(`${DOMAIN} is not verified`);
  await assignDomain(teamId, projectId);
  console.log(`Store domain live wiring complete: https://${DOMAIN}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
