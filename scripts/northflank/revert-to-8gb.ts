import { nfFetch, projectApiPath } from './lib';

const projectId = 'elevate-platform';
const serviceIds = ['elevate-lms', 'elevate-admin', 'elevate-marketing'];

async function main() {
  for (const serviceId of serviceIds) {
    try {
      console.log(`Reverting build plan for ${serviceId}...`);
      
      const response = await nfFetch<any>(projectApiPath(projectId, `/services/${serviceId}`));
      const s = response.data || response;

      // 1. Remove buildPlan to revert to default (deploymentPlan)
      delete s.billing.buildPlan;
      
      // 2. Ensure deploymentPlan is 8GB
      s.billing.deploymentPlan = 'nf-compute-400';

      // 3. Fix advancedOptions validation
      if (s.ports && s.ports[0]) {
        s.ports[0].advancedOptions = s.ports[0].advancedOptions || {};
        if (s.ports[0].domains) {
          s.ports[0].domains = s.ports[0].domains.map((d: any) => typeof d === 'string' ? d : d.name);
        }
      }

      // 4. Update the service
      await nfFetch(projectApiPath(projectId, `/services/combined/${serviceId}`), {
        method: 'PATCH', // PATCH with full object also works
        body: JSON.stringify(s)
      });

      console.log(`✅ ${serviceId} is now on 8GB compatible plan.`);
    } catch (error) {
      console.error(`❌ Failed ${serviceId}:`, error);
    }
  }
}

main();
