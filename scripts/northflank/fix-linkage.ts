import { nfFetch, projectApiPath } from './lib';

const projectId = 'elevate-platform';
const secretId = 'elevate-production-env';
const serviceIds = ['elevate-lms', 'elevate-admin', 'elevate-lms-production', 'elevate-marketing'];

async function main() {
  const current = await nfFetch<any>(projectApiPath(projectId, `/secrets/${secretId}`));
  
  const body = {
    ...current,
    restrictions: {
      restricted: true,
      nfObjects: serviceIds.map(id => ({ id, type: 'service' })),
      tagMatchCondition: 'or'
    }
  };

  await nfFetch(projectApiPath(projectId, `/secrets/${secretId}`), {
    method: 'POST',
    body: JSON.stringify(body)
  });

  console.log(`Successfully linked "${secretId}" to: ${serviceIds.join(', ')}`);
}

main();
