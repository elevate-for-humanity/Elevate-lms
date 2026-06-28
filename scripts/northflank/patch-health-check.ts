import { nfFetch, projectApiPath } from './lib';

const projectId = 'elevate-platform';
const serviceIds = ['elevate-lms', 'elevate-admin', 'elevate-lms-build'];

async function main() {
  for (const serviceId of serviceIds) {
    try {
      console.log(`Configuring health check for ${serviceId}...`);
      
      const patchPath = `/services/combined/${serviceId}`;
      const body = {
        deployment: {
          healthCheck: {
            enabled: true,
            path: '/api/health/northflank',
            port: 8080,
            protocol: 'HTTP',
            initialDelaySeconds: 120,
            periodSeconds: 30,
            timeoutSeconds: 10,
            failureThreshold: 3
          }
        }
      };

      await nfFetch(projectApiPath(projectId, patchPath), {
        method: 'PATCH',
        body: JSON.stringify(body)
      });

      console.log(`✅ Successfully configured ${serviceId}`);
    } catch (error) {
      console.error(`❌ Failed to configure ${serviceId}:`, error);
    }
  }
}

main();
