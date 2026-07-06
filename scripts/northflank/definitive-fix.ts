import { nfFetch, projectApiPath } from './lib';

const projectId = 'elevate-platform';
const serviceId = 'elevate-lms-build';

async function main() {
  console.log(`Fixing configuration for ${serviceId}...`);
  
  const response = await nfFetch<any>(projectApiPath(projectId, `/services/${serviceId}`));
  const s = response.data || response;

  const payload = {
    ...s,
    buildEngineConfiguration: {
      buildEngine: 'buildkit',
      buildkit: {
        useInternalCache: true,
        useCache: true,
        internalCacheStorage: 10240
      }
    },
    vcsData: {
      ...s.vcsData,
      dockerFilePath: '/Dockerfile.northflank-lms',
      dockerWorkDir: '/'
    },
    billing: {
      deploymentPlan: 'nf-compute-400',
      buildPlan: 'nf-compute-400-16'
    },
    // Ensure advancedOptions is never null
    ports: s.ports.map((p: any) => ({
      ...p,
      advancedOptions: p.advancedOptions || {}
    }))
  };

  // For 'combined' services, Northflank requires the /combined/ path for updates
  await nfFetch(projectApiPath(projectId, `/services/combined/${serviceId}`), {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });

  console.log(`✅ ${serviceId} configuration is now FIXED to Docker.`);
}

main();
