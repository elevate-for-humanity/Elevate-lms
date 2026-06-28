import { nfFetch, projectApiPath } from './lib';

const projectId = 'elevate-platform';
const serviceId = 'elevate-lms-build';

async function main() {
  console.log(`Configuring build settings for ${serviceId}...`);
  
  const current = await nfFetch<any>(projectApiPath(projectId, `/services/${serviceId}`));
  const service = current.data || current;

  // Fix known validation error for advancedOptions
  if (service.ports && service.ports[0] && service.ports[0].advancedOptions === null) {
    service.ports[0].advancedOptions = {};
  }

  const body = {
    ...service,
    buildEngineConfiguration: {
      buildEngine: 'buildkit'
    },
    vcsData: {
      ...service.vcsData,
      dockerFilePath: "/Dockerfile.northflank-lms",
      dockerWorkDir: "/"
    },
    billing: {
      deploymentPlan: "nf-compute-400"
    },
    disabledCI: false,
    disabledCD: false
  };

  await nfFetch(projectApiPath(projectId, `/services/combined/${serviceId}`), {
    method: 'PATCH',
    body: JSON.stringify(body)
  });

  console.log(`✅ Successfully switched ${serviceId} to Docker build engine.`);
}

main();
