import { pathToFileURL } from 'node:url';
import { readFile } from 'node:fs/promises';
import { inspectExactMainCI } from './require-exact-lms-ci.mjs';
const repository = 'elevate-for-humanity/Elevate-lms';
const workflows = ['deploy-admin.yml', 'deploy-google-lms-trigger.yml', 'deploy-google-marketing-trigger.yml', 'deploy-google-store-runtime.yml'];

// CI completion closes path-filter gaps without becoming a second deployer.
// Never consume a PR artifact or clear a release hold from workflow_run.
export async function dispatchCompletedMainCI({ env, event, request = fetch }) {
  const run = event?.workflow_run;
  if (env.GITHUB_REPOSITORY !== repository || env.GITHUB_REF !== 'refs/heads/main' ||
      env.GITHUB_EVENT_NAME !== 'workflow_run' || run?.name !== 'CI' ||
      run.path !== '.github/workflows/ci.yml' || !['push', 'workflow_dispatch'].includes(run.event) ||
      run.conclusion !== 'success' || run.head_branch !== 'main' ||
      run.head_repository?.full_name !== repository || !/^[a-f0-9]{40}$/.test(run.head_sha || '')) {
    return { status: 'ignored_untrusted_or_unsuccessful_ci', deploymentVerified: false };
  }
  if (env.GOOGLE_RELEASE_HOLD !== 'false') return { status: 'held', deploymentVerified: false };
  if (!env.GH_TOKEN?.trim()) throw Error('RELEASE_WORKFLOW_TOKEN_REQUIRED');
  async function api(path, method = 'GET', body) {
    const response = await request(`https://api.github.com/repos/${repository}/${path}`, {
      method, headers: { Authorization: `Bearer ${env.GH_TOKEN}`, Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}), redirect: 'error', signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw Error(`RELEASE_GITHUB_HTTP_${response.status}`);
    return response.status === 204 ? null : response.json();
  }
  const head = await api('git/ref/heads/main');
  if (head.object?.sha !== run.head_sha) return { status: 'superseded', deploymentVerified: false };
  const previous = await api(`actions/workflows/release-approved-google-web.yml/runs?head_sha=${run.head_sha}&event=workflow_dispatch&per_page=30`);
  const activeStates = ['queued', 'in_progress', 'waiting', 'requested', 'pending'];
  const priorRuns = previous.workflow_runs?.filter(r => r.head_sha === run.head_sha) ?? [];
  // Controller completion does NOT attest four service releases. The previous
  // Marketing controller completed green even though its image smoke failed,
  // and a later CI completion was incorrectly suppressed as already_requested.
  if (priorRuns.some(r => activeStates.includes(r.status))) {
    return { status: 'already_requested', commit: run.head_sha, deploymentVerified: false };
  }
  if (priorRuns.some(r => r.status === 'completed' && r.conclusion === 'success')) {
    const serviceStates = await Promise.all(workflows.map(async workflow => {
      const releases = await api(`actions/workflows/${workflow}/runs?head_sha=${run.head_sha}&event=workflow_dispatch&per_page=30`);
      return releases.workflow_runs?.some(r => r.head_sha === run.head_sha &&
        (activeStates.includes(r.status) || (r.status === 'completed' && r.conclusion === 'success'))) === true;
    }));
    if (serviceStates.every(Boolean)) {
      return { status: 'already_requested', commit: run.head_sha, deploymentVerified: false };
    }
  }
  await api('actions/workflows/release-approved-google-web.yml/dispatches', 'POST', { ref: 'main' });
  return { status: 'requested', commit: run.head_sha, deploymentVerified: false };
}

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
  const ci = await inspectExactMainCI({ sha, token, request });
  if (ci.status !== 'verified') throw Error('RELEASE_REQUIRED_CI_NOT_GREEN');
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
    const prior = active.workflow_runs?.find(run => run.head_sha === sha &&
      (['queued', 'in_progress', 'waiting', 'requested', 'pending'].includes(run.status) ||
       (run.status === 'completed' && run.conclusion === 'success')));
    if (prior) {
      dispatched.push({ workflow, status: prior.status === 'completed' ? 'already_succeeded' : 'already_active' });
      continue;
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
    const result = process.argv.includes('--completed-ci')
      ? await dispatchCompletedMainCI({ env: process.env, event: JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8')) })
      : await releaseCurrentWorkflow();
    console.log(JSON.stringify(result));
  }
  catch (error) { console.error(JSON.stringify({ error: /^RELEASE_[A-Z0-9_]+$/.test(error?.message || '') ? error.message : 'RELEASE_CONTROLLER_FAILED' })); process.exitCode = 1; }
}
