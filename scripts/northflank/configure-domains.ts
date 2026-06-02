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
 *   LMS  → www.elevateforhumanity.org (+ elevateforhumanity.org if second port exists)
 *   Admin → admin.elevateforhumanity.org
 */

import { nfFetch, projectApiPath, resolveProjectId, resolveLmsServiceId, resolveAdminServiceId } from './lib';

type Port = {
  id: string;
  name: string;
  internalPort: number;
  public?: boolean;
  protocol?: string;
  domains?: { name: string }[];
  dns?: string;
};

const LMS_DOMAINS = ['www.elevateforhumanity.org', 'elevateforhumanity.org'];
const ADMIN_DOMAINS = ['admin.elevateforhumanity.org'];

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

  if (!projectId || !lmsId || !adminId) {
    console.error(
      'Set NORTHFLANK_PROJECT_ID, NORTHFLANK_LMS_SERVICE_ID, NORTHFLANK_ADMIN_SERVICE_ID\nRun: pnpm tsx scripts/northflank/audit.ts',
    );
    process.exit(1);
  }

  console.log(dryRun ? '=== DRY RUN ===' : '=== EXECUTE ===');

  await updateServiceDomains(projectId, lmsId, LMS_DOMAINS, dryRun);
  await updateServiceDomains(projectId, adminId, ADMIN_DOMAINS, dryRun);

  console.log(`
--- DNS (at your registrar / Cloudflare) ---
For each custom domain Northflank shows a CNAME target in the service → Ports UI.
Point:
  www.elevateforhumanity.org     → LMS service CNAME
  elevateforhumanity.org         → LMS (apex: ALIAS/ANAME or redirect www)
  admin.elevateforhumanity.org   → Admin service CNAME

After DNS propagates, TLS certificates provision automatically in Northflank.
`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
