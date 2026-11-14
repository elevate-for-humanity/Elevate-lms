import { nfFetch, projectApiPath } from './lib';

const projectId = 'elevate-platform';
const serviceId = 'elevate-lms';

async function main() {
  console.log(`Forcibly enabling CD for ${serviceId}...`);
  
  const response = await nfFetch<any>(projectApiPath(projectId, `/services/${serviceId}`));
  const s = response.data || response;

  const payload = {
    ...s,
    disabledCD: false,
    disabledCI: false
  };

  // Fix domains and advancedOptions
  if (payload.ports && payload.ports[0]) {
    payload.ports[0].advancedOptions = payload.ports[0].advancedOptions || {};
    if (payload.ports[0].domains) {
      payload.ports[0].domains = payload.ports[0].domains.map((d: any) => typeof d === 'string' ? d : d.name);
    }
  }

  await nfFetch(projectApiPath(projectId, `/services/combined/${serviceId}`), {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });

  console.log(`✅ ${serviceId}: CD is now officially ENABLED.`);
}

main();
