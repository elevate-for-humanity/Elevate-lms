import { pathToFileURL } from 'node:url';

const repository = 'elevate-for-humanity/Elevate-lms';
const workflow = '.github/workflows/exercise-owned-pbx-device.yml';
const exerciseStep = 'Create and revoke one temporary device for the approved operator';

function identity(env) {
  const runId = env.PHONE_EXERCISE_RUN_ID;
  if (env.GITHUB_REPOSITORY !== repository || !/^[1-9]\d*$/.test(runId || '') || !env.GH_TOKEN?.trim()) {
    throw Error('PHONE_HANDOFF_IDENTITY_REQUIRED');
  }
  return { runId, token: env.GH_TOKEN };
}

async function api(path, token, request, body) {
  const response = await request(`https://api.github.com/repos/${repository}/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
    redirect: 'error', signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw Error('PHONE_HANDOFF_GITHUB_HTTP_' + response.status);
  return response.status === 204 ? null : response.json();
}

export async function verifyPhoneExercise(env = process.env, request = fetch, {
  allowRunning = false, attempts = 36, delay = ms => new Promise(resolve => setTimeout(resolve, ms)), now = Date.now,
} = {}) {
  const { runId, token } = identity(env);
  for (let attempt = 0; attempt < attempts; attempt++) {
    const source = await api('actions/runs/' + runId, token, request);
    const age = now() - Date.parse(source.updated_at);
    if (source.repository?.full_name !== repository || source.head_branch !== 'main' ||
        source.event !== 'workflow_dispatch' || source.path?.split('@')[0] !== workflow ||
        !/^[a-f0-9]{40}$/.test(source.head_sha || '') || !Number.isFinite(age) || age < -300000 || age > 7200000) {
      throw Error('PHONE_HANDOFF_SOURCE_UNVERIFIED');
    }
    const completed = source.status === 'completed';
    if (completed && source.conclusion !== 'success') throw Error('PHONE_HANDOFF_EXERCISE_NOT_SUCCESSFUL');
    if (!completed && !['queued', 'pending', 'in_progress', 'waiting'].includes(source.status)) {
      throw Error('PHONE_HANDOFF_SOURCE_UNVERIFIED');
    }
    if (completed || allowRunning) {
      const result = await api('actions/runs/' + runId + '/jobs?per_page=100', token, request);
      const passed = result.jobs?.some(job => job.name === 'exercise' && job.status === 'completed' &&
        job.conclusion === 'success' && job.run_id === Number(runId) && job.steps?.some(step =>
          step.name === exerciseStep && step.status === 'completed' && step.conclusion === 'success'));
      if (!passed) throw Error('PHONE_HANDOFF_EXERCISE_NOT_SUCCESSFUL');
      return { sourceRunId: runId, sourceCommit: source.head_sha, deviceExerciseVerified: true, sourceCompleted: completed };
    }
    await delay(5000);
  }
  throw Error('PHONE_HANDOFF_COMPLETION_TIMEOUT');
}

export async function dispatchPhoneBindings(env = process.env, request = fetch) {
  const { token } = identity(env);
  const evidence = await verifyPhoneExercise(env, request, { allowRunning: true });
  await api('actions/workflows/bind-owned-phone-runtime.yml/dispatches', token, request, {
    ref: 'main', inputs: { acceptance_run_id: evidence.sourceRunId },
  });
  return { ...evidence, bindingsDispatched: true, bindingsVerified: false, carrierRoutingChanged: false };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const work = process.argv[2] === 'dispatch' ? dispatchPhoneBindings : process.argv[2] === 'verify' ? verifyPhoneExercise : null;
  if (!work) throw Error('PHONE_HANDOFF_COMMAND_REQUIRED');
  work().then(result => console.log(JSON.stringify(result))).catch(error => {
    console.error(/^PHONE_HANDOFF_[A-Z_0-9]+$/.test(error.message) ? error.message : 'PHONE_HANDOFF_REQUEST_FAILED');
    process.exitCode = 1;
  });
}
