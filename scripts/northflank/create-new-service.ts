import { nfFetch, projectApiPath } from './lib';

const projectId = 'elevate-platform';
const newServiceId = 'elevate-lms-v2';

async function main() {
  console.log(`Creating fresh production service: ${newServiceId}...`);
  
  const payload = {
    id: newServiceId,
    name: "Elevate LMS Production",
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
    buildSettings: {
      dockerfile: {
        dockerFilePath: "/Dockerfile.northflank-lms",
        dockerWorkDir: "/"
      }
    },
    billing: {
      deploymentPlan: "nf-compute-400",
      buildPlan: "nf-compute-400-16"
    },
    deployment: {
      instances: 1
    },
    ports: [
      {
        name: "site",
        internalPort: 8080,
        protocol: "HTTP",
        public: true
      }
    ],
    healthChecks: [
      {
        protocol: "HTTP",
        type: "readinessProbe",
        port: 8080,
        path: "/api/health/northflank",
        initialDelaySeconds: 30,
        periodSeconds: 60,
        timeoutSeconds: 10,
        failureThreshold: 3,
        successThreshold: 1
      }
    ]
  };

  try {
    const res = await nfFetch(`https://api.northflank.com/v1/teams/elevates-team/projects/${projectId}/services/combined`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    console.log(`✅ Successfully created ${newServiceId}:`, res);
  } catch (error) {
    console.error(`❌ Failed to create ${newServiceId}:`, error);
  }
}

main();
