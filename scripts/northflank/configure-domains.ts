#!/usr/bin/env tsx
/**
 * Attach canonical production domains to their dedicated Northflank services.
 *
 *   npx tsx scripts/northflank/configure-domains.ts --dry-run
 *   npx tsx scripts/northflank/configure-domains.ts --execute
 *
 * Canonical ownership:
 *   www.elevateforhumanity.org   -> Marketing
 *   app.elevateforhumanity.org   -> LMS
 *   admin.elevateforhumanity.org -> Admin
 *
 * The apex elevateforhumanity.org is a DNS/HTTP redirect to www and is not
 * attached to an application service here.
 */

import {
  nfFetch,
  projectApiPath,
  resolveProjectId,
  resolveMarketingServiceId,
  resolveLmsServiceId,
  resolveAdminServiceId,
  resolveTeamId,
} from './lib';

type Port = {
  id: string;
  name: string;
  internalPort: number;
  public?: boolean;
  protocol?: string;
  domains?: { name: string }[];
  dns?: string;
};

const SERVICE_DOMAINS = {
  marketing: ['www.elevateforhumanity.org'],
  lms: ['app.elevateforhumanity.org'],
  admin: ['admin.elevateforhumanity.org'],
} as const;

async function getSubdomainCname(domain: string): Promise<{ verified: boolean; content?: string }> {
  const teamId = resolveTeamId();
  if (!teamId) return { verified: false };
  try {
    const row = await nfFetch<{ verified?: boolean; content?: string }>(
      `/teams/${teamId}/domains/${encodeURIComponent(domain)}/subdomains/@`,
    );
    return { verified: Boolean(row.verified), content: row.content };
  } catch {
    return { verified: false };
  }
}

async function assignDomainToService(
  domain: string,
  projectId: string,
  serviceId: string,
  dryRun: boolean,
) {
  const { verified, content } = await getSubdomainCname(domain);
  console.log(`\nDomain ${domain} -> service ${serviceId}`);
  console.log(`  CNAME target: ${content ?? '(see print-cname-targets.ts)'}`);
  console.log(`  CNAME verified: ${verified}`);
  if (!verified) {
    console.warn('  CNAME not verified — assignment skipped. Correct DNS before deployment verification.');
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
  domainNames: readonly string[],
  forbiddenDomains: ReadonlySet<string>,
  dryRun: boolean,
) {
  const { ports } = await nfFetch<{ ports: Port[] }>(
    projectApiPath(projectId, `/services/${serviceId}/ports`),
  );
  const httpPort =
    ports.find((port) => port.public && (port.protocol === 'HTTP' || port.protocol === 'HTTP/2')) ??
    ports[0];
  if (!httpPort) throw new Error(`No public HTTP port on service ${serviceId}`);

  // Preserve unrelated domains, but actively remove domains owned by another
  // Elevate service. This repairs historical cross-service assignments instead
  // of only appending the new correct hostname.
  const existing = (httpPort.domains ?? [])
    .map((domain) => domain.name)
    .filter((domain) => !forbiddenDomains.has(domain));
  const merged = [...new Set([...existing, ...domainNames])];

  console.log(`\nService ${serviceId} port ${httpPort.name} (${httpPort.id})`);
  console.log(`  Northflank URL: ${httpPort.dns}`);
  console.log(`  Domains: ${merged.join(', ')}`);

  if (dryRun) return;

  const payload = {
    ports: ports.map((port) => {
      if (port.id !== httpPort.id) {
        return {
          id: port.id,
          name: port.name,
          internalPort: port.internalPort,
          public: port.public,
          protocol: port.protocol || 'HTTP',
          domains: (port.domains ?? []).map((domain) => domain.name),
        };
      }
      return {
        id: port.id,
        name: port.name,
        internalPort: port.internalPort,
        public: true,
        protocol: port.protocol || 'HTTP',
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

async function configureService(
  key: keyof typeof SERVICE_DOMAINS,
  projectId: string,
  serviceId: string,
  dryRun: boolean,
) {
  const domains = SERVICE_DOMAINS[key];
  const forbidden = new Set(
    Object.entries(SERVICE_DOMAINS)
      .filter(([owner]) => owner !== key)
      .flatMap(([, ownerDomains]) => [...ownerDomains]),
  );

  for (const domain of domains) {
    await assignDomainToService(domain, projectId, serviceId, dryRun);
  }
  await updateServiceDomains(projectId, serviceId, domains, forbidden, dryRun);
}

async function main() {
  const dryRun = !process.argv.includes('--execute');
  const projectId = resolveProjectId();
  const marketingId = resolveMarketingServiceId();
  const lmsId = resolveLmsServiceId();
  const adminId = resolveAdminServiceId();

  if (!projectId || !marketingId || !lmsId || !adminId) {
    console.error(
      'NORTHFLANK_PROJECT_ID, NORTHFLANK_MARKETING_SERVICE_ID, NORTHFLANK_LMS_SERVICE_ID, and NORTHFLANK_ADMIN_SERVICE_ID are required. No cross-service fallback is allowed.',
    );
    process.exit(1);
  }

  const ids = [marketingId, lmsId, adminId];
  if (new Set(ids).size !== ids.length) {
    throw new Error('Marketing, LMS, and Admin must use three distinct Northflank service IDs.');
  }

  console.log(dryRun ? '=== DRY RUN ===' : '=== EXECUTE ===');
  await configureService('marketing', projectId, marketingId, dryRun);
  await configureService('lms', projectId, lmsId, dryRun);
  await configureService('admin', projectId, adminId, dryRun);

  console.log(`
--- Canonical DNS ownership ---
www.elevateforhumanity.org   -> Marketing service
app.elevateforhumanity.org   -> LMS service
admin.elevateforhumanity.org -> Admin service
elevateforhumanity.org       -> permanent redirect to https://www.elevateforhumanity.org

After DNS verification, TLS certificates provision automatically in Northflank.
`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
