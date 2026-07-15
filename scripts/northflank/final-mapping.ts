import { nfFetch, projectApiPath } from './lib';

const projectId = 'elevate-platform';

const mapping = [
  { id: 'elevate-marketing', file: '/Dockerfile.marketing' },
  { id: 'elevate-admin', file: '/Dockerfile.northflank-admin' },
  { id: 'elevate-lms', file: '/Dockerfile.northflank-lms' },
  { id: 'elevate-lms-production', file: '/Dockerfile.assets' }
];

async function main() {
  for (const s of mapping) {
    try {
      console.log(`Verifying/Fixing ${s.id} to ${s.file}...`);
      
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
        buildEngineConfiguration: { 
          buildEngine: 'buildkit',
          buildkit: {
            useInternalCache: true,
            useCache: true
          }
        },
        vcsData: {
          ...current.vcsData,
          dockerFilePath: s.file,
          dockerWorkDir: '/'
        }
      };

      await nfFetch(projectApiPath(projectId, `/services/combined/${s.id}`), {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      console.log(`✅ ${s.id} mapped to ${s.file}`);
    } catch (error) {
      console.error(`❌ Failed ${s.id}:`, error);
    }
  }
}

main();
