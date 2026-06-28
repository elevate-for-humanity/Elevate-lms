import { nfFetch, projectApiPath } from './lib';

const projectId = 'elevate-platform';
const serviceId = 'elevate-lms-build';

async function main() {
  console.log(`Triggering deployment for ${serviceId}...`);
  
  // Northflank API for triggering builds is often POST /projects/{id}/services/{id}/builds
  const buildPath = `/services/combined/${serviceId}/builds`;
  
  try {
    const res = await nfFetch(projectApiPath(projectId, buildPath), {
      method: 'POST',
      body: JSON.stringify({})
    });
    console.log('✅ Build triggered successfully:', res);
  } catch (e) {
    console.error('❌ Failed to trigger build:', e);
  }
}

main();
