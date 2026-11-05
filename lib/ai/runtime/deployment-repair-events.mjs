const RELEASE_PATHS = new Set([
  '.github/workflows/deploy-admin.yml',
  '.github/workflows/deploy-google-lms-trigger.yml',
  '.github/workflows/deploy-google-marketing-trigger.yml',
  '.github/workflows/deploy-google-course-worker.yml',
  '.github/workflows/deploy-google-store-runtime.yml',
  '.github/workflows/ci.yml',
  '.github/workflows/integrity-gate.yml',
  '.github/workflows/predeploy-check.yml',
  '.github/workflows/course-factory-authority.yml',
  '.github/workflows/lockfile-check.yml',
  '.github/workflows/registered-apprenticeship-e2e.yml',
  '.github/workflows/verify-paris-production-authorization.yml',
]);
const MAIN_CHECK_PATHS = new Set([
  '.github/workflows/ci.yml',
  '.github/workflows/integrity-gate.yml',
  '.github/workflows/predeploy-check.yml',
  '.github/workflows/course-factory-authority.yml',
  '.github/workflows/lockfile-check.yml',
]);

/** Only the latest execution on current main is actionable. A successful push
 * dispatcher is not execution evidence and cannot conceal a failed release. */
export function failedCurrentReleases(runs, sha) {
  if (!/^[a-f0-9]{40}$/.test(sha || '')) return [];
  const latest = new Map();
  for (const run of runs) {
    if (run.head_branch !== 'main' || run.head_sha !== sha || !RELEASE_PATHS.has(run.path) || run.conclusion === 'skipped' ||
        !(run.event === 'workflow_dispatch' ||
          (run.path === '.github/workflows/deploy-google-course-worker.yml' && run.event === 'push') ||
          (MAIN_CHECK_PATHS.has(run.path) && ['push','schedule'].includes(run.event)) ||
          (run.path === '.github/workflows/registered-apprenticeship-e2e.yml' && ['push','workflow_run'].includes(run.event)))) continue;
    const previous = latest.get(run.path);
    const time = Date.parse(run.run_started_at || run.created_at) || 0;
    const previousTime = Date.parse(previous?.run_started_at || previous?.created_at) || 0;
    if (!previous || time > previousTime || (time === previousTime && run.id > previous.id)) latest.set(run.path, run);
  }
  return [...latest.values()].filter(run => run.status === 'completed' && run.conclusion === 'failure');
}
