#!/usr/bin/env tsx
import fs from 'node:fs';
import { nfFetch, projectApiPath, resolveProjectId } from './lib';

const SERVICE_ID = process.env.NORTHFLANK_STORE_SERVICE_ID || 'elevate-store';

type Port = {
  name?: string;
  public?: boolean;
  dns?: string;
  publicDns?: string;
  domains?: Array<{ name?: string } | string>;
};

async function main() {
  const projectId = resolveProjectId();
  if (!projectId) throw new Error('NORTHFLANK_PROJECT_ID is required');

  const response = await nfFetch<any>(projectApiPath(projectId, `/services/${SERVICE_ID}/ports`));
  const payload = response?.data ?? response;
  const ports: Port[] = Array.isArray(payload) ? payload : payload?.ports ?? [];
  const port = ports.find((row) => row.name === 'store') ?? ports.find((row) => row.public) ?? ports[0];
  if (!port) throw new Error(`No ports returned for ${SERVICE_ID}`);

  const dns = port.dns || port.publicDns;
  if (!dns) throw new Error(`Northflank did not return a public DNS name for ${SERVICE_ID}:store`);
  const url = dns.startsWith('http') ? dns.replace(/\/$/, '') : `https://${dns.replace(/\/$/, '')}`;

  console.log(`Store runtime URL: ${url}`);
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `url=${url}\n`, 'utf8');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
