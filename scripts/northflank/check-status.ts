import { nfFetch, projectApiPath, resolveProjectId, resolveAdminServiceId, resolveLmsServiceId } from './lib';

async function main() {
  const projectId = resolveProjectId();
  const adminServiceId = resolveAdminServiceId();
  const lmsServiceId = resolveLmsServiceId();
  
  console.log(`Project: ${projectId}`);
  console.log(`Admin Service: ${adminServiceId}`);
  console.log(`LMS Service: ${lmsServiceId}`);
  
  // Get admin service status
  console.log('\n=== Admin Service ===');
  const adminStatus = await nfFetch(projectApiPath(projectId, `/services/${adminServiceId}`)) as any;
  console.log(`Status: ${adminStatus?.status?.build?.status || adminStatus?.buildStatus || 'unknown'}`);
  console.log(`Deployment: ${adminStatus?.status?.deployment?.status || adminStatus?.deploymentStatus?.status || 'unknown'}`);
  
  // Get admin builds
  /*
  const adminBuilds = await nfFetch(projectApiPath(projectId, `/services/${adminServiceId}/builds?limit=3`)) as any;
  if (adminBuilds?.builds) {
    console.log('\nRecent builds:');
    for (const b of adminBuilds.builds.slice(0, 3)) {
      console.log(`  ${b.id}: ${b.status} (${b.sha?.slice(0,7) || 'no sha'}) - ${b.success ? 'SUCCESS' : 'FAILED'}`);
      if (b.message) console.log(`    Message: ${b.message.slice(0, 200)}`);
    }
  }
  */
  
  // Get LMS service status
  console.log('\n=== LMS Service ===');
  const lmsStatus = await nfFetch(projectApiPath(projectId, `/services/${lmsServiceId}`)) as any;
  console.log(`Status: ${lmsStatus?.status?.build?.status || lmsStatus?.buildStatus || 'unknown'}`);
  console.log(`Deployment: ${lmsStatus?.status?.deployment?.status || lmsStatus?.deploymentStatus?.status || 'unknown'}`);
  
  // Get LMS builds
  /*
  const lmsBuilds = await nfFetch(projectApiPath(projectId, `/services/${lmsServiceId}/builds?limit=3`)) as any;
  if (lmsBuilds?.builds) {
    console.log('\nRecent builds:');
    for (const b of lmsBuilds.builds.slice(0, 3)) {
      console.log(`  ${b.id}: ${b.status} (${b.sha?.slice(0,7) || 'no sha'}) - ${b.success ? 'SUCCESS' : 'FAILED'}`);
      if (b.message) console.log(`    Message: ${b.message?.slice(0, 200)}`);
    }
  }
  */
}

main().catch(console.error);
