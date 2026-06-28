import { nfFetch, projectApiPath } from './lib';

const projectId = 'elevate-platform';
const services = ['elevate-lms', 'elevate-admin', 'elevate-lms-production', 'elevate-lms-build'];

const buildArgs = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://cuxzzpsyufcewtmicszk.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1eHp6cHN5dWZjZXd0bWljc3prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNjEwNDcsImV4cCI6MjA3MzczNzA0N30.DyFtzoKha_tuhKiSIPoQlKonIpaoSYrlhzntCUvLUnA',
  NEXT_PUBLIC_SITE_URL: 'https://www.elevateforhumanity.org',
  NEXT_PUBLIC_ADMIN_URL: 'https://admin.elevateforhumanity.org',
  BUILD_SCOPE: '1'
};

async function main() {
  for (const serviceId of services) {
    console.log(`Updating build configuration for ${serviceId}...`);
    const response = await nfFetch<any>(projectApiPath(projectId, `/services/${serviceId}`));
    const s = response.data || response;
    
    // Fix advancedOptions validation error
    if (s.ports && s.ports[0]) {
      if (s.ports[0].advancedOptions === null) {
        s.ports[0].advancedOptions = {};
      }
      // Fix domains validation error: map domain objects to strings
      s.ports[0].domains = s.ports[0].domains.map((d: any) => typeof d === 'string' ? d : d.name);
    }

    const body = {
      ...s,
      buildConfiguration: {
        ...s.buildConfiguration,
        buildArguments: {
          ...s.buildConfiguration?.buildArguments,
          ...buildArgs
        }
      }
    };

    await nfFetch(projectApiPath(projectId, `/services/combined/${serviceId}`), {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
    console.log(`Successfully updated ${serviceId}.`);
  }
}

main();
