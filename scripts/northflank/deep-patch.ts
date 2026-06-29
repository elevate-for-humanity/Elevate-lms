import { nfFetch, projectApiPath } from './lib';

const projectId = 'elevate-platform';
const serviceId = 'elevate-lms-build';

async function main() {
  console.log(`Deep-patching configuration for ${serviceId}...`);
  
  // Use the 'combined' update endpoint specifically
  const patchPath = `/services/combined/${serviceId}`;
  
  const body = {
    deployment: {
      instances: 1,
    },
    buildSettings: {
      dockerfile: {
        dockerFilePath: "/Dockerfile.northflank-lms",
        dockerWorkDir: "/",
        buildEngine: "buildkit"
      }
    },
    billing: {
      deploymentPlan: "nf-compute-400"
    }
  };

  try {
    const res = await nfFetch(projectApiPath(projectId, patchPath), {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
    console.log(`✅ Success:`, res);
  } catch (e) {
    console.error(`❌ Failed:`, e);
  }
}

main();
