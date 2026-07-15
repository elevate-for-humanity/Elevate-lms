import { nfFetch, projectApiPath } from './lib';

const projectId = 'elevate-platform';

const mapping = [
  { id: 'elevate-marketing', name: 'Elevate Marketing', file: '/Dockerfile.marketing' },
  { id: 'elevate-admin', name: 'Elevate Admin', file: '/Dockerfile.northflank-admin' },
  { id: 'elevate-lms', name: 'Elevate LMS', file: '/Dockerfile.northflank-lms' },
  { id: 'elevate-lms-production', name: 'Elevate Assets', file: '/Dockerfile.assets' }
];

async function main() {
  for (const s of mapping) {
    try {
      console.log(`Configuring ${s.id} (${s.name})...`);
      
      const response = await nfFetch<any>(projectApiPath(projectId, `/services/${s.id}`));
      const current = response.data || response;

      // Fix domains and advancedOptions validation error
      if (current.ports && current.ports[0]) {
        if (current.ports[0].advancedOptions === null) {
          current.ports[0].advancedOptions = {};
        }
        if (current.ports[0].domains) {
          current.ports[0].domains = current.ports[0].domains.map((d: any) => typeof d === 'string' ? d : d.name);
        }
      }

      const payload = {
        ...current,
        name: s.name,
        buildEngineConfiguration: { buildEngine: 'buildkit' },
        vcsData: {
          ...current.vcsData,
          dockerFilePath: s.file,
          dockerWorkDir: '/'
        },
        billing: {
          deploymentPlan: 'nf-compute-400' // 8GB Plan
        }
      };

      await nfFetch(projectApiPath(projectId, `/services/combined/${s.id}`), {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      console.log(`✅ Successfully mapped ${s.id} to ${s.file}`);
    } catch (error) {
      console.error(`❌ Failed to map ${s.id}:`, error);
    }
  }
}

main();
