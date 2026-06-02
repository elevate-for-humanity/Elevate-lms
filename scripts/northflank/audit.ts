#!/usr/bin/env tsx
/**
 * List Northflank projects, services, secret groups, and port/domains.
 *
 *   pnpm tsx scripts/northflank/audit.ts
 *
 * Env:
 *   NORTHFLANK_API_TOKEN (required)
 *   NORTHFLANK_TEAM_ID (default: elevates-team)
 *   NORTHFLANK_PROJECT_ID (optional — auto-picks first project if unset)
 */

import { nfFetch, projectApiPath, resolveProjectId, resolveTeamId } from './lib';

type Project = { id: string; name: string };
type Service = { id: string; name: string; serviceType?: string };
type SecretGroup = { id: string; name?: string; secretType?: string };
type Port = {
  id: string;
  name: string;
  internalPort: number;
  public?: boolean;
  dns?: string;
  domains?: { name: string }[];
};

async function listProjects(): Promise<Project[]> {
  const teamId = resolveTeamId();
  if (teamId) {
    const data = await nfFetch<Project[]>(`/teams/${teamId}/projects`);
    return Array.isArray(data) ? data : (data as { projects?: Project[] }).projects ?? [];
  }
  const data = await nfFetch<Project[] | { projects: Project[] }>('/projects');
  return Array.isArray(data) ? data : data.projects ?? [];
}

async function main() {
  const projects = await listProjects();
  console.log('\n=== Projects ===');
  for (const p of projects) {
    console.log(`  ${p.id}\t${p.name}`);
  }

  const projectId = resolveProjectId() || projects[0]?.id;
  if (!projectId) {
    console.error('\nNo project found. Set NORTHFLANK_PROJECT_ID.');
    process.exit(1);
  }
  console.log(`\nUsing project: ${projectId}`);

  const services = await nfFetch<Service[] | { services: Service[] }>(
    projectApiPath(projectId, '/services'),
  );
  const serviceList = Array.isArray(services) ? services : services.services ?? [];
  console.log('\n=== Services ===');
  for (const s of serviceList) {
    console.log(`  ${s.id}\t${s.name}\t${s.serviceType ?? ''}`);
  }

  const secrets = await nfFetch<SecretGroup[] | { secrets: SecretGroup[] }>(
    projectApiPath(projectId, '/secrets'),
  );
  const secretList = Array.isArray(secrets) ? secrets : secrets.secrets ?? [];
  console.log('\n=== Secret groups ===');
  for (const s of secretList) {
    console.log(`  ${s.id}\t${s.name ?? ''}\t${s.secretType ?? ''}`);
  }

  for (const s of serviceList) {
    const portsData = await nfFetch<{ ports: Port[] }>(
      projectApiPath(projectId, `/services/${s.id}/ports`),
    );
    console.log(`\n=== Ports: ${s.name} (${s.id}) ===`);
    for (const port of portsData.ports ?? []) {
      const domains = (port.domains ?? []).map((d) => d.name).join(', ') || '(none)';
      console.log(
        `  ${port.name} id=${port.id} :${port.internalPort} public=${port.public} dns=${port.dns}`,
      );
      console.log(`    custom domains: ${domains}`);
    }
  }

  console.log('\n--- Set in Cursor secrets for automation ---');
  console.log(`NORTHFLANK_PROJECT_ID=${projectId}`);
  const lms = serviceList.find((s) => /lms|www|main|elevate-lms/i.test(s.name));
  const admin = serviceList.find((s) => /admin/i.test(s.name));
  if (lms) console.log(`NORTHFLANK_LMS_SERVICE_ID=${lms.id}`);
  if (admin) console.log(`NORTHFLANK_ADMIN_SERVICE_ID=${admin.id}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
