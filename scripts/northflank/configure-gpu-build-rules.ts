import { nfFetch, projectApiPath } from './lib';

const WEB_PROJECT_ID = process.env.NORTHFLANK_PROJECT_ID || 'elevate-platform';
const GPU_PROJECT_ID = process.env.NORTHFLANK_GPU_PROJECT_ID || 'elevate-media-gpu';
const BUILD_SERVICE_ID = process.env.NORTHFLANK_GPU_BUILD_SERVICE_ID || 'elevate-gpu-worker-build';
const GPU_SERVICE_ID = process.env.NORTHFLANK_GPU_SERVICE_ID || 'elevate-gpu-worker';

async function patchCombined(projectId: string, serviceId: string) {
  const response = await nfFetch<any>(projectApiPath(projectId, `/services/${serviceId}`));
  const service = response.data || response;
  const payload = {
    ...service,
    disabledCI: false,
    disabledCD: false,
    buildSource: service.buildSource || 'git',
    vcsData: {
      ...(service.vcsData || {}),
      projectUrl: 'https://github.com/elevate-for-humanity/Elevate-lms',
      projectType: 'github',
      projectBranch: 'main',
    },
  };
  await nfFetch(projectApiPath(projectId, `/services/combined/${serviceId}`), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  console.log(`${projectId}/${serviceId}: CI/CD enabled on main`);
}

async function patchBuild(projectId: string, serviceId: string) {
  const response = await nfFetch<any>(projectApiPath(projectId, `/services/${serviceId}`));
  const service = response.data || response;
  const payload = {
    ...service,
    disabledCI: false,
    buildSource: service.buildSource || 'git',
    vcsData: {
      ...(service.vcsData || {}),
      projectUrl: 'https://github.com/elevate-for-humanity/Elevate-lms',
      projectType: 'github',
      projectBranch: 'main',
    },
  };
  await nfFetch(projectApiPath(projectId, `/services/build/${serviceId}`), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  console.log(`${projectId}/${serviceId}: CI enabled on main`);
}

async function exists(projectId: string, serviceId: string) {
  try { await nfFetch(projectApiPath(projectId, `/services/${serviceId}`)); return true; }
  catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (/404|not found/i.test(msg)) return false;
    throw error;
  }
}

async function main() {
  if (await exists(WEB_PROJECT_ID, BUILD_SERVICE_ID)) await patchBuild(WEB_PROJECT_ID, BUILD_SERVICE_ID);
  else console.log(`${WEB_PROJECT_ID}/${BUILD_SERVICE_ID}: missing`);

  if (await exists(GPU_PROJECT_ID, GPU_SERVICE_ID)) await patchCombined(GPU_PROJECT_ID, GPU_SERVICE_ID);
  else console.log(`${GPU_PROJECT_ID}/${GPU_SERVICE_ID}: not created yet; build rule will be applied after GPU unlock`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
