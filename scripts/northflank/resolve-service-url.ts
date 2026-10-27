#!/usr/bin/env tsx
/** Print the canonical public URL assigned to a Northflank service. */
import { nfFetch, projectApiPath, resolveProjectId } from './lib';

const projectId = resolveProjectId();
const serviceId = process.argv[2]?.trim();
if (!projectId) throw new Error('Set NORTHFLANK_PROJECT_ID');
if (!serviceId) throw new Error('Usage: resolve-service-url.ts <service-id>');

type Service = {
  ports?: Array<{ dns?: string; domains?: Array<{ name?: string } | string> }>;
};

const service = await nfFetch<Service>(projectApiPath(projectId, `/services/${serviceId}`));
const candidates = (service.ports ?? []).flatMap((port) => [
  port.dns,
  ...(port.domains ?? []).map((item) => (typeof item === 'string' ? item : item.name)),
]);
const domain = candidates.find(Boolean);
if (!domain) throw new Error(`No public URL is assigned to ${serviceId}`);
process.stdout.write(domain.startsWith('http') ? domain : `https://${domain}`);
