import { nfFetch, projectApiPath } from './lib';

const projectId = 'elevate-platform';
const serviceId = 'elevate-marketing';

async function main() {
  console.log(`Force-configuring ${serviceId} to use Docker...`);
  
  // 1. Get full state
  const response = await nfFetch<any>(projectApiPath(projectId, `/services/${serviceId}`));
  const s = response.data || response;

  // 2. Build the exact payload Northflank expects for Buildkit
  const payload = {
    ...s,
    buildSource: 'git',
    serviceType: 'combined',
    buildEngineConfiguration: {
      buildEngine: 'buildkit',
      buildkit: {
        useInternalCache: false,
        useCache: false,
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
    // Fix the validation error for advancedOptions
    ports: s.ports.map((p: any) => ({
      ...p,
      advancedOptions: p.advancedOptions || {}
    })),
    disabledCI: false,
    disabledCD: false
  };

  // 3. Send via POST (some NF endpoints require POST for full updates)
  try {
    await nfFetch(projectApiPath(projectId, `/services/combined/${serviceId}`), {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.log('POST failed, trying PATCH...');
    await nfFetch(projectApiPath(projectId, `/services/combined/${serviceId}`), {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  }

  console.log(`✅ ${serviceId} is now locked to Docker (Buildkit).`);
}

main();
