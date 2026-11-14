import { nfFetch, projectApiPath } from './lib';

const projectId = 'elevate-platform';
const serviceIds = ['elevate-lms', 'elevate-admin', 'elevate-marketing'];

async function main() {
  for (const serviceId of serviceIds) {
    try {
      console.log(`Enabling CD and ensuring Buildkit for ${serviceId}...`);
      
      const response = await nfFetch<any>(projectApiPath(projectId, `/services/${serviceId}`));
      const s = response.data || response;

      // Fix domains and advancedOptions validation error
      if (s.ports && s.ports[0]) {
        s.ports[0].advancedOptions = s.ports[0].advancedOptions || {};
        if (s.ports[0].domains) {
          s.ports[0].domains = s.ports[0].domains.map((d: any) => typeof d === 'string' ? d : d.name);
        }
      }

      const payload = {
        ...s,
        disabledCD: false,
        disabledCI: false,
        buildEngineConfiguration: { 
          buildEngine: 'buildkit',
          buildkit: {
            useInternalCache: true,
            useCache: true
          }
        }
      };

      await nfFetch(projectApiPath(projectId, `/services/combined/${serviceId}`), {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      console.log(`✅ ${serviceId}: CD Enabled, Engine Locked to Docker.`);
    } catch (error) {
      console.error(`❌ Failed ${serviceId}:`, error);
    }
  }
}

main();
