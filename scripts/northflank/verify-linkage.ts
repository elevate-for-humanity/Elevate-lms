import { nfFetch, projectApiPath } from './lib';

const projectId = 'elevate-platform';
const secretId = 'elevate-production-env';

async function main() {
  const secrets = await nfFetch(projectApiPath(projectId, `/secrets/${secretId}`));
  console.log(JSON.stringify(secrets, null, 2));
}

main();
