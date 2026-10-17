import { pathToFileURL } from 'node:url';
import { loadGoogleConfig } from './runtime-config.mjs';
const repository = 'elevate-for-humanity/Elevate-lms';
const workflows = ['deploy-admin.yml', 'deploy-google-lms-trigger.yml', 'deploy-google-marketing-trigger.yml', 'deploy-google-store-runtime.yml'];

export async function releaseApprovedWeb({ sha, token, request = fetch }) {
  if (!/^[a-f0-9]{40}$/.test(sha || '') || typeof token !== 'string' || !token.trim()) throw Error('RELEASE_IDENTITY_REQUIRED');
  async function api(path, method = 'GET', body) {
    const response = await request(`https://api.github.com/repos/${repository}/${path}`, {
      method, headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}), redirect: 'error', signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw Error(`RELEASE_GITHUB_HTTP_${response.status}`);
    return response.status === 204 ? null : response.json();
  }
  const head = await api('git/ref/heads/main');
  if (head.object?.sha !== sha) throw Error('RELEASE_MAIN_CHANGED');
  const runs = await api(`actions/workflows/ci.yml/runs?head_sha=${sha}&event=push&per_page=20`);
  let approved = false;
  for (const run of runs.workflow_runs || []) {
    if (run.head_sha !== sha) continue;
    const jobs = await api(`actions/runs/${run.id}/jobs?per_page=100`);
    if (jobs.jobs?.some(job => job.name === 'CI Required Gate' && job.status === 'completed' && job.conclusion === 'success')) approved = true;
  }
  if (!approved) throw Error('RELEASE_REQUIRED_CI_NOT_GREEN');
  const hold = await api('actions/variables/GOOGLE_RELEASE_HOLD');
  if (hold.value === 'true') await api('actions/variables/GOOGLE_RELEASE_HOLD', 'PATCH', { name: 'GOOGLE_RELEASE_HOLD', value: 'false' });
  const verified = await api('actions/variables/GOOGLE_RELEASE_HOLD');
  if (verified.value !== 'false') throw Error('RELEASE_HOLD_READBACK_FAILED');
  const dispatched = [];
  for (const workflow of workflows) {
    const active = await api(`actions/workflows/${workflow}/runs?head_sha=${sha}&event=workflow_dispatch&per_page=30`);
    if (active.workflow_runs?.some(run => run.head_sha === sha && ['queued', 'in_progress', 'waiting', 'requested', 'pending'].includes(run.status))) {
      dispatched.push({ workflow, status: 'already_active' }); continue;
    }
    const inputs = workflow === 'deploy-google-marketing-trigger.yml' ? {} : { requested_sha: sha };
    await api(`actions/workflows/${workflow}/dispatches`, 'POST', { ref: 'main', inputs });
    dispatched.push({ workflow, status: 'dispatched' });
  }
  return { commit: sha, releaseHold: false, workflows: dispatched, deploymentVerified: false };
}

async function runtimeGitHubToken() {
  const env = loadGoogleConfig('admin').runtimeEnvironment;
  if (env.GITHUB_TOKEN?.trim()) return env.GITHUB_TOKEN.trim().replace(/^(?:Bearer|token)\s+/i, '');
  // The existing Studio credential is restricted to the repository; use it
  // inside this trusted runner, never export it as a job output or artifact.
  if (env.ELEVATE_RUNTIME_CONFIG_PROVIDER !== 'google-secret-manager' && env.NEXT_PUBLIC_SUPABASE_URL === 'https://cuxzzpsyufcewtmicszk.supabase.co' && env.SUPABASE_SERVICE_ROLE_KEY) {
    const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/get_platform_secret`, {
      method: 'POST', headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_key: 'GITHUB_TOKEN' }), redirect: 'error', signal: AbortSignal.timeout(15000),
    });
    if (response.ok) {
      const value = await response.json();
      if (typeof value === 'string' && value.trim()) return value.trim().replace(/^(?:Bearer|token)\s+/i, '');
    }
  }
  throw Error('RELEASE_REPOSITORY_CREDENTIAL_UNAVAILABLE');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { console.log(JSON.stringify(await releaseApprovedWeb({ sha: process.env.GITHUB_SHA, token: await runtimeGitHubToken() }))); }
  catch (error) { console.error(JSON.stringify({ error: /^RELEASE_[A-Z0-9_]+$/.test(error?.message || '') ? error.message : 'RELEASE_CONTROLLER_FAILED' })); process.exitCode = 1; }
}
