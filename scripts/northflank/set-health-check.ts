import { nfFetch, projectApiPath } from './lib';

const projectId = 'elevate-platform';
const serviceIds = ['elevate-lms', 'elevate-admin', 'elevate-lms-build'];

async function main() {
  for (const serviceId of serviceIds) {
    try {
      console.log(`Configuring health check for ${serviceId}...`);
      
      // Get current service config
      const response = await nfFetch<any>(projectApiPath(projectId, `/services/${serviceId}`));
      const service = response.data || response;

      // Prepare updated config
      // Northflank v1 API health check is typically under 'deployment.healthCheck'
      const updatedConfig = {
        deployment: {
          ...service.deployment,
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

      // PATCH the service
      // Note: For 'combined' services, Northflank sometimes uses /services/combined/{id}
      const patchPath = service.serviceType === 'combined' 
        ? `/services/combined/${serviceId}` 
        : `/services/${serviceId}`;

      await nfFetch(projectApiPath(projectId, patchPath), {
        method: 'POST', // Northflank uses POST with full body for updates sometimes, or PATCH
        body: JSON.stringify(updatedConfig)
      });

      console.log(`✅ Successfully configured ${serviceId}`);
    } catch (error) {
      console.error(`❌ Failed to configure ${serviceId}:`, error);
    }
  }
}

main();
