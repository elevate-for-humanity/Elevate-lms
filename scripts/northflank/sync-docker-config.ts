import { nfFetch, projectApiPath } from './lib';

const projectId = 'elevate-platform';
const serviceId = 'elevate-lms-build';

async function main() {
  console.log(`Synchronizing configuration for ${serviceId}...`);
  
  // 1. Get current state
  const response = await nfFetch<any>(projectApiPath(projectId, `/services/${serviceId}`));
  const s = response.data || response;

  // 2. Prepare the clean Docker-based payload
  const payload = {
    name: s.name,
    description: s.description,
    serviceType: "combined",
    buildSource: "git",
    vcsData: {
      projectUrl: "https://github.com/elevate-for-humanity/Elevate-lms",
      projectBranch: "main",
      projectType: "github",
      dockerFilePath: "/Dockerfile.northflank-lms",
      dockerWorkDir: "/"
    },
    buildEngineConfiguration: {
      buildEngine: "buildkit",
      buildkit: {
        useInternalCache: true,
        useCache: true,
        internalCacheStorage: 10240
      }
    },
    billing: {
      deploymentPlan: "nf-compute-400", // 4 vCPU / 8192 MB
      buildPlan: "nf-compute-400-16"
    },
    deployment: {
      instances: 1,
      docker: {
        configType: "default"
      }
    },
    ports: [
      {
        name: "site",
        internalPort: 8080,
        protocol: "HTTP",
        public: true,
        advancedOptions: {}
      }
    ],
    healthChecks: [
      {
        protocol: "HTTP",
        type: "readinessProbe",
        port: 8080,
        path: "/api/health/northflank",
        initialDelaySeconds: 120,
        periodSeconds: 30,
        timeoutSeconds: 10,
        failureThreshold: 3,
        successThreshold: 1
      }
    ]
  };

  // 3. Use the service-specific update path
  await nfFetch(projectApiPath(projectId, `/services/combined/${serviceId}`), {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });

  console.log(`✅ ${serviceId} is now FULLY CONFIGURED with Docker and 8GB memory.`);
}

main();
