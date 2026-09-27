#!/usr/bin/env tsx
import { nfFetch, projectApiPath, resolveProjectId } from './lib';

const serviceId = process.env.NORTHFLANK_ULTIMATE_WORKER_SERVICE_ID || 'elevate-ultimate-worker';
const secretGroupIds = [
  process.env.NORTHFLANK_SECRET_GROUP_ID || 'elevate-production-env',
  'elevate-llm-client-env',
];

async function main() {
  const projectId = resolveProjectId();
  if (!projectId) throw new Error('NORTHFLANK_PROJECT_ID_REQUIRED');
  for (const groupId of new Set(secretGroupIds)) {
    // Fail before deployment if the owned inference credentials have not been provisioned.
    const current: any = await nfFetch(projectApiPath(projectId, `/secrets/${groupId}`));
    const restrictions = current.restrictions ?? {};
    const objects = restrictions.nfObjects ?? [];
    if (objects.some((item: any) => item.type === 'service' && item.id === serviceId)) {
      console.log(`${groupId} already grants ${serviceId} access`);
      continue;
    }
    await nfFetch(projectApiPath(projectId, `/secrets/${groupId}`), {
      method: 'PATCH',
      body: JSON.stringify({
        restrictions: {
          restricted: true,
          nfObjects: [...objects, { id: serviceId, type: 'service' }],
          tags: restrictions.tags ?? [],
          tagMatchCondition: restrictions.tagMatchCondition ?? 'or',
        },
      }),
    });
    console.log(`Attached ${groupId} to ${serviceId} without reading secret values`);
  }
}

main().catch(error => { console.error(error); process.exit(1); });
