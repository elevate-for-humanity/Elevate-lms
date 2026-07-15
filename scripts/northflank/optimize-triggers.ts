import { nfFetch, projectApiPath } from './lib';

const projectId = 'elevate-platform';

/**
 * PATH-BASED BUILD TRIGGERS
 * This ensures that a push only builds the container that actually changed.
 * This stops "double building" and saves money.
 */

const mapping = [
  { 
    id: 'elevate-marketing', 
    name: 'Elevate Marketing', 
    file: '/Dockerfile.marketing',
    domain: 'www.elevateforhumanity.org',
    ignore: ['app/admin/**', 'app/apprentice/**', 'app/instructor/**', 'app/partner/**', 'app/student-portal/**', 'Dockerfile.northflank-admin', 'Dockerfile.northflank-lms']
  },
  { 
    id: 'elevate-admin', 
    name: 'Elevate Admin', 
    file: '/Dockerfile.northflank-admin',
    domain: 'admin.elevateforhumanity.org',
    ignore: ['app/(marketing)/**', 'app/(public)/**', 'app/apprentice/**', 'app/lms/**', 'app/student-portal/**', 'app/programs/**', 'app/store/**', 'Dockerfile.marketing', 'Dockerfile.northflank-lms']
  },
  { 
    id: 'elevate-lms', 
    name: 'Elevate LMS', 
    file: '/Dockerfile.northflank-lms',
    domain: 'app.elevateforhumanity.org',
    ignore: ['app/admin/**', 'app/mission-control/**', 'app/intelligence/**', 'app/(marketing)/**', 'app/(public)/**', 'app/programs/**', 'app/store/**', 'Dockerfile.marketing', 'Dockerfile.northflank-admin']
  }
];

async function main() {
  for (const s of mapping) {
    try {
      console.log(`Optimizing triggers for ${s.name}...`);
      
      const response = await nfFetch<any>(projectApiPath(projectId, `/services/${s.id}`));
      const current = response.data || response;

      const payload = {
        ...current,
        name: s.name,
        buildConfiguration: {
          ...current.buildConfiguration,
          pathIgnoreRules: s.ignore
        },
        ports: current.ports.map((p: any) => ({
          ...p,
          advancedOptions: p.advancedOptions || {},
          domains: [s.domain] // API expects string
        }))
      };

      await nfFetch(projectApiPath(projectId, `/services/combined/${s.id}`), {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      console.log(`✅ ${s.name} configured: ignores [${s.ignore.length}] paths, mapped to ${s.domain}`);
    } catch (error) {
      console.error(`❌ Failed ${s.id}:`, error);
    }
  }
}

main();
