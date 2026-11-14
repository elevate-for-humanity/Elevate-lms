import { nfFetch, projectApiPath } from './lib';

const projectId = process.env.NORTHFLANK_PROJECT_ID || 'elevate-platform';
const services = ['elevate-lms', 'elevate-admin', 'elevate-lms-production', 'elevate-marketing'];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!process.env.NORTHFLANK_API_TOKEN) {
  console.error('NORTHFLANK_API_TOKEN is required.');
  process.exit(1);
}
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.');
  process.exit(1);
}

const buildArgs = {
  NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
  NEXT_PUBLIC_SITE_URL: 'https://www.elevateforhumanity.org',
  NEXT_PUBLIC_ADMIN_URL: 'https://admin.elevateforhumanity.org',
  BUILD_SCOPE: '1',
};

async function main() {
  for (const serviceId of services) {
    console.log(`Updating build configuration for ${serviceId}...`);
    const response = await nfFetch<any>(projectApiPath(projectId, `/services/${serviceId}`));
    const s = response.data || response;

    if (s.ports?.[0]) {
      if (s.ports[0].advancedOptions === null) s.ports[0].advancedOptions = {};
      if (Array.isArray(s.ports[0].domains)) {
        s.ports[0].domains = s.ports[0].domains.map((d: any) => typeof d === 'string' ? d : d?.name).filter(Boolean);
      }
    }

    const body = {
      ...s,
      buildConfiguration: {
        ...s.buildConfiguration,
        buildArguments: {
          ...s.buildConfiguration?.buildArguments,
          ...buildArgs,
        },
      },
    };

    await nfFetch(projectApiPath(projectId, `/services/combined/${serviceId}`), {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    console.log(`Successfully updated ${serviceId}.`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
