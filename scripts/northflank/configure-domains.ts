#!/usr/bin/env tsx
/**
 * Attach custom domains to Northflank service HTTP ports.
 *
 *   pnpm tsx scripts/northflank/configure-domains.ts --dry-run
 *   pnpm tsx scripts/northflank/configure-domains.ts --execute
 *
 * Env:
 *   NORTHFLANK_API_TOKEN, NORTHFLANK_PROJECT_ID
 *   NORTHFLANK_LMS_SERVICE_ID, NORTHFLANK_ADMIN_SERVICE_ID
 *
 * Defaults:
 *   LMS  → elevateforhumanity.org (apex) + www (redirects to apex in app)
 *   Admin → admin.elevateforhumanity.org
 */

import { nfFetch, projectApiPath, resolveProjectId, resolveLmsServiceId, resolveAdminServiceId, resolveTeamId } from './lib';

type Port = {
  id: string;
  name: string;
  internalPort: number;
  public?: boolean;
  protocol?: string;
  domains?: { name: string }[];
  dns?: string;
};

const LMS_DOMAINS = ['elevateforhumanity.org', 'www.elevateforhumanity.org'];
const ADMIN_DOMAINS = ['admin.elevateforhumanity.org'];

async function getSubdomainCname(domain: string): Promise<{ verified: boolean; content?: string }> {
  const teamId = resolveTeamId();
  if (!teamId) return { verified: false };
  try {
    const row = await nfFetch<{ verified?: boolean; content?: string }>(
      `/teams/${teamId}/domains/${encodeURIComponent(domain)}/subdomains/@`,
    );
    return { verified: !!row.verified, content: row.content };
  } catch {
    return { verified: false };
  }
}

async function assignDomainToService(domain: string, projectId: string, serviceId: string, dryRun: boolean) {
  const { verified, content } = await getSubdomainCname(domain);
  console.log(`\nDomain ${domain} → service ${serviceId}`);
  console.log(`  CNAME target: ${content ?? '(see print-cname-targets.ts)'}`);
  console.log(`  CNAME verified: ${verified}`);
  if (!verified) {
    console.warn(
      '  CNAME not verified — path assign skipped. Use updateServiceDomains (A record apex is OK on Durable).',
    );
    return;
  }
  if (dryRun) return;
  const teamId = resolveTeamId();
  const pathEnc = encodeURIComponent('/');
  await nfFetch(
    `/teams/${teamId}/domains/${encodeURIComponent(domain)}/subdomains/@/paths/${pathEnc}/assign`,
    {
      method: 'POST',
      body: JSON.stringify({
        assignment: { project: projectId, service: serviceId, port: 'site' },
      }),
    },
  );
  console.log('  Assigned path / to port site.');
}

async function updateServiceDomains(
  projectId: string,
  serviceId: string,
  domainNames: string[],
  dryRun: boolean,
) {
  const { ports } = await nfFetch<{ ports: Port[] }>(
    projectApiPath(projectId, `/services/${serviceId}/ports`),
  );
  const httpPort = ports.find((p) => p.public && (p.protocol === 'HTTP' || p.protocol === 'HTTP/2')) ?? ports[0];
  if (!httpPort) throw new Error(`No public HTTP port on service ${serviceId}`);

  const existing = (httpPort.domains ?? []).map((d) => d.name);
  const merged = [...new Set([...existing, ...domainNames])];

  console.log(`\nService ${serviceId} port ${httpPort.name} (${httpPort.id})`);
  console.log(`  Northflank URL: ${httpPort.dns}`);
  console.log(`  Domains: ${merged.join(', ')}`);

  if (dryRun) return;

  const payload = {
    ports: ports.map((p) => {
      if (p.id !== httpPort.id) {
        return {
          id: p.id,
          name: p.name,
          internalPort: p.internalPort,
          public: p.public,
          protocol: p.protocol || 'HTTP',
          domains: (p.domains ?? []).map((d) => d.name),
        };
      }
      return {
        id: p.id,
        name: p.name,
        internalPort: p.internalPort,
        public: true,
        protocol: p.protocol || 'HTTP',
        domains: merged,
      };
    }),
  };

  await nfFetch(projectApiPath(projectId, `/services/${serviceId}/ports`), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  console.log('  Updated port domains.');
}

async function main() {
  const dryRun = !process.argv.includes('--execute');
  const projectId = resolveProjectId();
  const lmsId = resolveLmsServiceId();
  const adminId = resolveAdminServiceId();

  if (!projectId || !lmsId) {
    console.error(
      'Set NORTHFLANK_PROJECT_ID and NORTHFLANK_LMS_SERVICE_ID\nRun: pnpm tsx scripts/northflank/audit.ts',
    );
    process.exit(1);
  }

  console.log(dryRun ? '=== DRY RUN ===' : '=== EXECUTE ===');

  for (const d of LMS_DOMAINS) {
    await assignDomainToService(d, projectId, lmsId, dryRun);
  }
  // Durable apex often uses an A record (no CNAME verify). Still attach hostnames on the port.
  await updateServiceDomains(projectId, lmsId, LMS_DOMAINS, dryRun);
  if (adminId) {
    for (const d of ADMIN_DOMAINS) {
      await assignDomainToService(d, projectId, adminId, dryRun);
    }
  } else {
    console.warn(
      '\nNo NORTHFLANK_ADMIN_SERVICE_ID — attaching admin hostname to LMS service (combined deploy).\n' +
        'Create a separate admin service later and move admin.elevateforhumanity.org to it.\n',
    );
    await updateServiceDomains(projectId, lmsId, ADMIN_DOMAINS, dryRun);
  }

  console.log(`
--- DNS (at your registrar / Cloudflare) ---
For each custom domain Northflank shows a CNAME target in the service → Ports UI.
Point (browser should show apex, not www):
  elevateforhumanity.org         → LMS apex CNAME (primary)
  www.elevateforhumanity.org     → LMS www CNAME (app 308-redirects to apex)
  admin.elevateforhumanity.org   → Admin service CNAME

After DNS propagates, TLS certificates provision automatically in Northflank.
`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
