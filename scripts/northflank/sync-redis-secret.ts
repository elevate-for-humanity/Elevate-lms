#!/usr/bin/env tsx
import { nfFetch, projectApiPath, resolveProjectId, resolveLmsServiceId, resolveAdminServiceId } from './lib';

async function main() {
  const redisUrl = process.env.REDIS_URL?.trim();
  if (!redisUrl) throw new Error('REDIS_URL is required');

  const projectId = resolveProjectId();
  if (!projectId) throw new Error('NORTHFLANK_PROJECT_ID is required');

  const secretId = process.env.NORTHFLANK_SECRET_GROUP_ID || 'elevate-production-env';
  const current = await nfFetch(projectApiPath(projectId, `/secrets/${secretId}?show=this`)) as any;
  const data = current?.data || current;
  if (!data?.secrets) throw new Error(`Unable to read Northflank secret group ${secretId}`);

  const existingVariables = data.secrets.variables || {};
  const mergedVariables = { ...existingVariables, REDIS_URL: redisUrl };

  await nfFetch(projectApiPath(projectId, `/secrets/${secretId}`), {
    method: 'POST',
    body: JSON.stringify({
      name: data.name || secretId,
      description: data.description || 'Elevate shared production secrets/config',
      priority: data.priority ?? 10,
      type: data.type || 'secret',
      secretType: data.secretType || 'environment',
      restrictions: data.restrictions || { restricted: false },
      secrets: {
        variables: mergedVariables,
        files: data.secrets.files || {},
        dockerSecretMounts: data.secrets.dockerSecretMounts || {},
      },
    }),
  });

  const serviceIds = [
    process.env.NORTHFLANK_MARKETING_SERVICE_ID || 'elevate-marketing',
    resolveLmsServiceId() || process.env.NORTHFLANK_LMS_SERVICE_ID || 'elevate-lms',
    resolveAdminServiceId() || process.env.NORTHFLANK_ADMIN_SERVICE_ID || 'elevate-admin',
  ];

  for (const serviceId of [...new Set(serviceIds)]) {
    await nfFetch(projectApiPath(projectId, `/services/${serviceId}/restart`), {
      method: 'POST',
      body: JSON.stringify({}),
    });
    console.log(`Restart requested for ${serviceId}`);
  }

  console.log(`REDIS_URL synchronized into ${secretId} without replacing existing secret variables.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
