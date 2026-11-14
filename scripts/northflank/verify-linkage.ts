import {
  nfFetch,
  projectApiPath,
  resolveAdminServiceId,
  resolveLmsServiceId,
  resolveProjectId,
} from './lib';

async function main() {
  const projectId = resolveProjectId();
  if (!projectId) throw new Error('NORTHFLANK_PROJECT_ID is required');

  const secretId = process.env.NORTHFLANK_SECRET_GROUP_ID || 'elevate-production-env';
  const current = await nfFetch<any>(projectApiPath(projectId, `/secrets/${secretId}?show=this`));
  const data = current?.data || current;
  const variables = data?.secrets?.variables || {};
  const hasRedis = Boolean(
    variables.REDIS_URL ||
      (variables.UPSTASH_REDIS_REST_URL && variables.UPSTASH_REDIS_REST_TOKEN),
  );
  if (!hasRedis) throw new Error(`${secretId} does not contain a complete Redis configuration`);

  const expectedServices = [
    process.env.NORTHFLANK_MARKETING_SERVICE_ID || 'elevate-marketing',
    resolveLmsServiceId() || process.env.NORTHFLANK_LMS_SERVICE_ID || 'elevate-lms',
    resolveAdminServiceId() || process.env.NORTHFLANK_ADMIN_SERVICE_ID || 'elevate-admin',
  ];
  const linked = Array.isArray(data?.restrictions?.nfObjects)
    ? data.restrictions.nfObjects
    : [];
  const missing = [...new Set(expectedServices)].filter(
    (serviceId) => !linked.some((item: any) => item?.type === 'service' && item?.id === serviceId),
  );
  if (missing.length) throw new Error(`${secretId} is not linked to: ${missing.join(', ')}`);

  console.log(`Verified Redis configuration and ${expectedServices.length} production service links.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
