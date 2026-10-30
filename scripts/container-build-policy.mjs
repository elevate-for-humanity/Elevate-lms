import { pathToFileURL } from 'node:url';

const web = app => ({ family: 'next-web', app,
  memoryControl: 'scripts/build-memory-policy.mjs',
  savingControl: 'lib/supabase/server.ts',
  recoveryControl: 'scripts/gcp/check-database-recovery.mjs' });

// Every Google image must declare its workload family. New web containers use
// the shared Next preset and bounded entry point; native/GPU workers retain
// their separate, capacity-checked runtime contracts.
export const containerBuildPolicy = Object.freeze({
  'legacy83-candidate': { dockerfile: 'Dockerfile.legacy83-candidate', family: 'next-web', app: 'legacy83',
    memoryControl: 'scripts/build-memory-policy.mjs',
    savingControl: '.deploy/legacy83-source/manifest.json',
    recoveryControl: 'scripts/gcp/deploy-legacy83-website.mjs' },
  marketing: { dockerfile: 'Dockerfile.marketing', ...web('marketing') },
  store: { dockerfile: 'Dockerfile.marketing', ...web('marketing') },
  admin: { dockerfile: 'Dockerfile.admin', ...web('admin') },
  lms: { dockerfile: 'Dockerfile.northflank-lms', ...web('lms') },
  'ultimate-worker': { dockerfile: 'Dockerfile.ultimate-worker', family: 'native-course-worker',
    memoryControl: 'scripts/gcp/regional-capacity.mjs',
    savingControl: 'lib/ultimate-course-builder/persistence/fenced-persistence.ts',
    recoveryControl: 'lib/ultimate-course-builder/core/full-course-runner.ts' },
  'studio-browser': { dockerfile: 'Dockerfile.studio-browser', family: 'chromium-browser',
    memoryControl: 'services/studio-browser/server.mjs',
    savingControl: 'services/studio-browser/provider-session-store.mjs',
    recoveryControl: 'services/studio-browser/provider-session-store.test.mjs' },
  'llm-gpu-worker': { dockerfile: 'services/llm-gpu-worker/Dockerfile', family: 'gpu-llm',
    memoryControl: 'services/llm-gpu-worker/entrypoint.sh',
    savingControl: 'services/llm-gpu-worker/bake_model.py',
    recoveryControl: 'services/llm-gpu-worker/README.md' },
  'owned-llm': { dockerfile: 'services/llm-gpu-worker/Dockerfile.google', family: 'gpu-llm',
    memoryControl: 'services/llm-gpu-worker/entrypoint.google.sh',
    savingControl: 'services/llm-gpu-worker/bake_model.py',
    recoveryControl: 'services/llm-gpu-worker/README.md' },
  'owned-cpu-llm': { dockerfile: 'services/llm-cpu-worker/Dockerfile.google', family: 'cpu-llm',
    memoryControl: 'services/llm-cpu-worker/entrypoint.sh',
    savingControl: 'services/llm-cpu-worker/finalize_model.py',
    recoveryControl: 'services/llm-cpu-worker/README.md' },
  'media-gpu-worker': { dockerfile: 'services/media-gpu-worker/Dockerfile', family: 'gpu-media',
    memoryControl: 'services/media-gpu-worker/worker.py',
    savingControl: 'lib/storage/elevate-media-storage.ts',
    recoveryControl: 'services/media-gpu-worker/README.md' },
});

// These are reviewed source references, not claims of live backup/load-test
// acceptance. Admission prevents future images silently omitting these concerns.
export function validateContainerProfiles(profiles, exists) {
  const families = new Set(['next-web', 'native-course-worker', 'chromium-browser', 'gpu-llm', 'gpu-media', 'cpu-llm']);
  for (const [name, profile] of Object.entries(profiles)) {
    if (!families.has(profile.family)) throw new Error(`${name}: unknown workload family`);
    for (const field of ['dockerfile', 'memoryControl', 'savingControl', 'recoveryControl']) {
      const path = profile[field];
      if (typeof path !== 'string' || !path || path.startsWith('/') || path.split('/').includes('..') || !exists(path))
        throw new Error(`${name}: reviewed ${field} source is required`);
    }
  }
}

export function containerBuild(component) {
  if (!Object.hasOwn(containerBuildPolicy, component))
    throw new Error('Register a reviewed container workload/memory profile before building it.');
  return { ...containerBuildPolicy[component] };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { console.log(containerBuild(process.argv[2]).dockerfile); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
