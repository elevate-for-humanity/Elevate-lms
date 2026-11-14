import { pathToFileURL } from 'node:url';
const repository = 'elevate-for-humanity/Elevate-lms';
const workflows = ['deploy-admin.yml', 'deploy-google-lms-trigger.yml', 'deploy-google-marketing-trigger.yml', 'deploy-google-store-runtime.yml'];

export async function releaseApprovedWeb({ sha, token, releaseHold, request = fetch }) {
  if (!/^[a-f0-9]{40}$/.test(sha || '') || typeof token !== 'string' || !token.trim()) throw Error('RELEASE_IDENTITY_REQUIRED');
  if (releaseHold !== undefined && releaseHold !== 'false') throw Error('RELEASE_HOLD_NOT_CLEARED');
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
  // The main-only workflow supplies GitHub's trusted variable context. Its
  // scoped Actions token must not need administrator-level variable access.
  // Legacy explicit hold management retains its original write/readback gate.
  if (releaseHold === undefined) {
    const hold = await api('actions/variables/GOOGLE_RELEASE_HOLD');
    if (hold.value === 'true') await api('actions/variables/GOOGLE_RELEASE_HOLD', 'PATCH', { name: 'GOOGLE_RELEASE_HOLD', value: 'false' });
    const verified = await api('actions/variables/GOOGLE_RELEASE_HOLD');
    if (verified.value !== 'false') throw Error('RELEASE_HOLD_READBACK_FAILED');
  }
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

export async function resolveReleaseCredential(env, request = fetch) {
  const normalize = value => typeof value === 'string' ? value.trim().replace(/^(?:Bearer|token)\s+/i, '') : '';
  async function valid(token) {
    const response = await request(`https://api.github.com/repos/${repository}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }, redirect: 'error', signal: AbortSignal.timeout(15000),
    });
    if (response.ok) return true;
    // Expiry is distinct from authorization denial. Never look for another
    // identity to work around a 403 or a repository-access denial.
    if (response.status === 401) return false;
    throw Error(`RELEASE_CREDENTIAL_CHECK_HTTP_${response.status}`);
  }
  const deployed = normalize(env.GITHUB_TOKEN);
  if (deployed && await valid(deployed)) return { token: deployed, source: 'google-runtime-config' };
  if (env.ELEVATE_RUNTIME_CONFIG_PROVIDER === 'google-secret-manager') throw Error('RELEASE_GOOGLE_CREDENTIAL_EXPIRED');
  // Legacy runtimes already authorize this exact canonical secret. Read only
  // that key; never enumerate secrets or export it from this trusted runner.
  if (env.NEXT_PUBLIC_SUPABASE_URL === 'https://cuxzzpsyufcewtmicszk.supabase.co' && env.SUPABASE_SERVICE_ROLE_KEY) {
    const response = await request(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/get_platform_secret`, {
      method: 'POST', headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_key: 'GITHUB_TOKEN' }), redirect: 'error', signal: AbortSignal.timeout(15000),
    });
    if (response.ok) {
      const canonical = normalize(await response.json());
      if (canonical && canonical !== deployed && await valid(canonical)) return { token: canonical, source: 'canonical-platform' };
    }
  }
  throw Error('RELEASE_REPOSITORY_CREDENTIAL_UNAVAILABLE');
}

export async function releaseCurrentWorkflow(env = process.env, request = fetch) {
  if (env.GITHUB_REPOSITORY !== repository || env.GITHUB_REF !== 'refs/heads/main' || env.GITHUB_EVENT_NAME !== 'workflow_dispatch') throw Error('RELEASE_WORKFLOW_IDENTITY_REQUIRED');
  if (!env.GH_TOKEN?.trim()) throw Error('RELEASE_WORKFLOW_TOKEN_REQUIRED');
  if (env.GOOGLE_RELEASE_HOLD !== 'false') throw Error('RELEASE_HOLD_NOT_CLEARED');
  return releaseApprovedWeb({ sha: env.GITHUB_SHA, token: env.GH_TOKEN, releaseHold: env.GOOGLE_RELEASE_HOLD, request });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    console.log(JSON.stringify(await releaseCurrentWorkflow()));
  }
  catch (error) { console.error(JSON.stringify({ error: /^RELEASE_[A-Z0-9_]+$/.test(error?.message || '') ? error.message : 'RELEASE_CONTROLLER_FAILED' })); process.exitCode = 1; }
}
