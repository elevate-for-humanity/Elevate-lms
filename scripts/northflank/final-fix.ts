import { nfFetch, projectApiPath } from './lib';

const projectId = 'elevate-platform';
const secretId = 'elevate-production-env';

async function main() {
  const secrets = await nfFetch<any>(projectApiPath(projectId, `/secrets/${secretId}`));
  
  // Update secret type to include 'build' scope
  const body = {
    ...secrets,
    secretType: 'environment', // This stays the same
    priority: 10,
    // Add build linkage if possible
  };

  await nfFetch(projectApiPath(projectId, `/secrets/${secretId}`), {
    method: 'POST',
    body: JSON.stringify(body)
  });

  console.log(`Updated "${secretId}". Manual action: In Northflank, link this group as "Build Arguments" in service settings.`);
}

main();
