#!/usr/bin/env tsx
/**
 * Attach custom domains to Northflank service HTTP ports.
 *
 *   npx tsx scripts/northflank/configure-domains.ts --dry-run
 *   npx tsx scripts/northflank/configure-domains.ts --execute
 *
 * Env:
 *   NORTHFLANK_API_TOKEN, NORTHFLANK_PROJECT_ID
 *   NORTHFLANK_LMS_SERVICE_ID, NORTHFLANK_ADMIN_SERVICE_ID
 *
 * Admin is a dedicated service. admin.elevateforhumanity.org must never be
 * attached to LMS as a fallback.
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

const LMS_DOMAINS = ['elevateforhumanity.org', 'www.elevateforhumanity.org', 'lms.elevateforhumanity.org'];
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
    console.warn('  CNAME not verified — path assignment skipped. Correct DNS before deployment verification.');
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

  if (!projectId || !lmsId || !adminId) {
    console.error(
      'NORTHFLANK_PROJECT_ID, NORTHFLANK_LMS_SERVICE_ID, and NORTHFLANK_ADMIN_SERVICE_ID are required.\n' +
        'Admin DNS will not be assigned to LMS as a fallback.',
    );
    process.exit(1);
  }

  console.log(dryRun ? '=== DRY RUN ===' : '=== EXECUTE ===');

  for (const d of LMS_DOMAINS) {
    await assignDomainToService(d, projectId, lmsId, dryRun);
  }
  await updateServiceDomains(projectId, lmsId, LMS_DOMAINS, dryRun);

  for (const d of ADMIN_DOMAINS) {
    await assignDomainToService(d, projectId, adminId, dryRun);
  }
  await updateServiceDomains(projectId, adminId, ADMIN_DOMAINS, dryRun);

  console.log(`
--- DNS ---
admin.elevateforhumanity.org must point to the dedicated Admin service CNAME and
Northflank path / must be assigned to the Admin service port named site.
After DNS verification, TLS certificates provision automatically in Northflank.
`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
