// GitHub workflow conclusion alone does not prove a service reached production.
// Validation-only jobs can succeed while all deployment stages were skipped.
const requiredReleaseJobs = Object.freeze({
  'deploy-admin.yml': ['Deploy and verify Admin on Google', 'acceptance'],
  'deploy-google-lms-trigger.yml': ['deploy', 'acceptance'],
  'deploy-google-marketing-trigger.yml': ['Deploy and verify Marketing on Google', 'acceptance'],
  'deploy-google-store-runtime.yml': ['Deploy and verify Store on Google', 'acceptance'],
});

export async function completedServiceReleaseVerified(run, workflow, api) {
  const required = requiredReleaseJobs[workflow];
  if (!required || run?.status !== 'completed' || run.conclusion !== 'success' ||
      !Number.isSafeInteger(run.id) || run.id < 1) return false;
  const response = await api(`actions/runs/${run.id}/jobs?per_page=100`);
  const jobs = response?.jobs;
  // A partial page cannot establish that the deployment and acceptance
  // stages both completed. Fail closed rather than infer success.
  if (!Array.isArray(jobs) || (Number.isFinite(response.total_count) && response.total_count > jobs.length)) return false;
  return required.every(name => jobs.some(job =>
    job.name === name && job.status === 'completed' && job.conclusion === 'success',
  ));
}
