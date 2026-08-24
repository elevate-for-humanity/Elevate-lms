#!/usr/bin/env tsx
import { nfFetch, projectApiPath, resolveProjectId, resolveLmsServiceId, resolveAdminServiceId } from './lib';

async function main() {
  const redisUrl = process.env.REDIS_URL?.trim();
  const restUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!redisUrl && !(restUrl && restToken)) {
    throw new Error('REDIS_URL or the complete Upstash REST pair is required');
  }

  const projectId = resolveProjectId();
  if (!projectId) throw new Error('NORTHFLANK_PROJECT_ID is required');

  const secretId = process.env.NORTHFLANK_SECRET_GROUP_ID || 'elevate-production-env';
  const current = await nfFetch(projectApiPath(projectId, `/secrets/${secretId}?show=this`)) as any;
  const data = current?.data || current;
  if (!data?.secrets) throw new Error(`Unable to read Northflank secret group ${secretId}`);

  const existingVariables = data.secrets.variables || {};
  const mergedVariables = {
    ...existingVariables,
    ...(redisUrl ? { REDIS_URL: redisUrl } : {}),
    ...(restUrl && restToken
      ? { UPSTASH_REDIS_REST_URL: restUrl, UPSTASH_REDIS_REST_TOKEN: restToken }
      : {}),
  };

  const serviceIds = [
    process.env.NORTHFLANK_MARKETING_SERVICE_ID || 'elevate-marketing',
    resolveLmsServiceId() || process.env.NORTHFLANK_LMS_SERVICE_ID || 'elevate-lms',
    resolveAdminServiceId() || process.env.NORTHFLANK_ADMIN_SERVICE_ID || 'elevate-admin',
  ];
  const restrictions = data.restrictions || {};
  const currentObjects = Array.isArray(restrictions.nfObjects) ? restrictions.nfObjects : [];
  const nfObjects = [...currentObjects];
  for (const serviceId of [...new Set(serviceIds)]) {
    if (!nfObjects.some((item: any) => item?.type === 'service' && item?.id === serviceId)) {
      nfObjects.push({ id: serviceId, type: 'service' });
    }
  }

  await nfFetch(projectApiPath(projectId, `/secrets/${secretId}`), {
    method: 'POST',
    body: JSON.stringify({
      name: data.name || secretId,
      description: data.description || 'Elevate shared production secrets/config',
      priority: data.priority ?? 10,
      type: data.type || 'secret',
      secretType: data.secretType || 'environment',
      restrictions: {
        restricted: true,
        nfObjects,
        tags: restrictions.tags || [],
        tagMatchCondition: restrictions.tagMatchCondition || 'or',
      },
      secrets: {
        variables: mergedVariables,
        files: data.secrets.files || {},
        dockerSecretMounts: data.secrets.dockerSecretMounts || {},
      },
    }),
  });

  for (const serviceId of [...new Set(serviceIds)]) {
    await nfFetch(projectApiPath(projectId, `/services/${serviceId}/restart`), {
      method: 'POST',
      body: JSON.stringify({}),
    });
    console.log(`Restart requested for ${serviceId}`);
  }

  console.log(`Redis configuration synchronized into ${secretId} and linked to all production services.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
