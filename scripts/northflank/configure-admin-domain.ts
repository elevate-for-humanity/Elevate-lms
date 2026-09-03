#!/usr/bin/env tsx
/**
 * Enforce canonical Admin domain ownership in Northflank.
 * This is intentionally Admin-only so the Admin deployment does not require
 * Marketing or LMS service secrets.
 */

import {
  nfFetch,
  projectApiPath,
  resolveAdminServiceId,
  resolveProjectId,
  resolveTeamId,
} from './lib';

const DOMAIN = 'admin.elevateforhumanity.org';

type Port = {
  id: string;
  name: string;
  internalPort: number;
  public?: boolean;
  protocol?: string;
  domains?: { name: string }[];
};

async function waitForVerification(): Promise<string> {
  const teamId = resolveTeamId();
  if (!teamId) throw new Error('NORTHFLANK_TEAM_ID is required.');

  for (let attempt = 1; attempt <= 24; attempt += 1) {
    try {
      const row = await nfFetch<{ verified?: boolean; content?: string }>(
        `/teams/${teamId}/domains/${encodeURIComponent(DOMAIN)}/subdomains/@`,
      );
      if (row.verified) return row.content ?? '';
      console.log(`Northflank DNS verification pending for ${DOMAIN} (${attempt}/24).`);
    } catch (error) {
      console.log(`Northflank domain verification lookup pending (${attempt}/24): ${error instanceof Error ? error.message : error}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  throw new Error(`Northflank did not verify ${DOMAIN} after authoritative DNS reconciliation.`);
}

async function main() {
  const teamId = resolveTeamId();
  const projectId = resolveProjectId();
  const serviceId = resolveAdminServiceId();
  if (!teamId || !projectId || !serviceId) {
    throw new Error('NORTHFLANK_TEAM_ID, NORTHFLANK_PROJECT_ID, and NORTHFLANK_ADMIN_SERVICE_ID are required.');
  }

  const cname = await waitForVerification();
  console.log(`Northflank verified ${DOMAIN}${cname ? ` -> ${cname}` : ''}.`);

  await nfFetch(
    `/teams/${teamId}/domains/${encodeURIComponent(DOMAIN)}/subdomains/@/paths/${encodeURIComponent('/')}/assign`,
    {
      method: 'POST',
      body: JSON.stringify({
        assignment: { project: projectId, service: serviceId, port: 'site' },
      }),
    },
  );

  const { ports } = await nfFetch<{ ports: Port[] }>(
    projectApiPath(projectId, `/services/${serviceId}/ports`),
  );
  const httpPort =
    ports.find((port) => port.public && (port.protocol === 'HTTP' || port.protocol === 'HTTP/2')) ?? ports[0];
  if (!httpPort) throw new Error(`No public HTTP port found on ${serviceId}.`);

  const domains = [...new Set([...(httpPort.domains ?? []).map((item) => item.name), DOMAIN])];
  const payload = {
    ports: ports.map((port) => ({
      id: port.id,
      name: port.name,
      internalPort: port.internalPort,
      public: port.id === httpPort.id ? true : port.public,
      protocol: port.protocol || 'HTTP',
      domains: port.id === httpPort.id ? domains : (port.domains ?? []).map((item) => item.name),
    })),
  };

  await nfFetch(projectApiPath(projectId, `/services/${serviceId}/ports`), {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  console.log(`Assigned ${DOMAIN} to ${serviceId} port ${httpPort.name}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
