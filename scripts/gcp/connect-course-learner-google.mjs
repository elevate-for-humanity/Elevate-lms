import { isDeepStrictEqual } from 'node:util';
import { pathToFileURL } from 'node:url';
import { google, PROJECT, configSecret, validateConfig } from './runtime-config.mjs';
import { verifyDns } from './verify-production-dns.mjs';
import { checkHostRoute } from './prepare-studio-https.mjs';
import { assertNoActiveExecutions } from './execute-course-job.mjs';

export const BROWSER_HOST = 'browser.elevateforhumanity.org';
export const LEARNER_ENDPOINT = `https://${BROWSER_HOST}/learner/runthrough`;
const URL_KEY = 'ULTIMATE_LEARNER_RUNTHROUGH_URL';
const SECRET_KEY = 'ULTIMATE_LEARNER_RUNTHROUGH_SECRET';
const jobName = 'elevate-course-builder', region = 'us-central1';
const backendName = 'elevate-studio-browser-backend';

function taskSpec(job) {
  const template = job.spec?.template?.spec;
  const task = template?.template?.spec;
  if (task?.containers?.length !== 1 || task.serviceAccountName !== `elevate-worker-runtime@${PROJECT}.iam.gserviceaccount.com`)
    throw new Error('Unexpected Course Builder container or runtime identity');
  return { template, task, container: task.containers[0] };
}

function entry(container, name) {
  const matches = (container.env ?? []).filter(value => value.name === name);
  if (matches.length !== 1) throw new Error('Course Builder learner configuration is missing or duplicated');
  return matches[0];
}

export async function connectCourseLearner({ run = google, request = fetch, dns = verifyDns } = {}) {
  const read = args => JSON.parse(run([...args, '--project=' + PROJECT, '--format=json']));
  const secretName = configSecret('ultimate-worker');
  // Read the existing payload for this explicit migration. Normal deployments
  // reject retired endpoints through loadGoogleConfig.
  const readConfig = () => validateConfig(JSON.parse(run(['secrets', 'versions', 'access', 'latest', '--secret=' + secretName, '--project=' + PROJECT])), 'ultimate-worker');
  const readJob = () => read(['run', 'jobs', 'describe', jobName, '--region=' + region]);
  const config = readConfig(), before = readJob();
  const { container } = taskSpec(before);
  const credential = config.runtimeEnvironment[SECRET_KEY];
  if (typeof credential !== 'string' || credential.length < 16) throw new Error('Existing learner credential unavailable');
  const liveSecret = entry(container, SECRET_KEY);
  const ref = liveSecret.valueFrom?.secretKeyRef;
  const liveCredential = liveSecret.value ?? (ref ? run(['secrets', 'versions', 'access', ref.key || 'latest', '--secret=' + ref.name, '--project=' + PROJECT]) : undefined);
  if (liveCredential !== credential) throw new Error('Saved and live learner credentials differ; refusing rotation');
  entry(container, URL_KEY);
  const inventory = () => read(['run', 'jobs', 'executions', 'list', '--job=' + jobName, '--region=' + region]);
  assertNoActiveExecutions(inventory());

  const map = read(['compute', 'url-maps', 'describe', 'elevate-public-routes', '--global']);
  if (!checkHostRoute(map)) throw new Error('Google browser host route has not been prepared');
  const backend = read(['compute', 'backend-services', 'describe', backendName, '--global']);
  const expectedGroup = `/projects/${PROJECT}/zones/us-central1-a/instanceGroups/elevate-studio-browser-group`;
  if (backend.backends?.length !== 1 || !backend.backends[0].group?.endsWith(expectedGroup))
    throw new Error('Unexpected Google browser backend');
  const members = read(['compute', 'instance-groups', 'unmanaged', 'list-instances', 'elevate-studio-browser-group', '--zone=us-central1-a']);
  if (members.length !== 1 || !members[0].instance?.endsWith(`/projects/${PROJECT}/zones/us-central1-a/instances/elevate-studio-browser-trial`))
    throw new Error('Unexpected Google browser instance');
  const proxies = read(['compute', 'target-https-proxies', 'list']).filter(value => value.urlMap?.endsWith(`/projects/${PROJECT}/global/urlMaps/elevate-public-routes`));
  const rules = read(['compute', 'forwarding-rules', 'list']).filter(value => proxies.some(proxy => proxy.selfLink === value.target) && ['443', '443-443'].includes(value.portRange));
  const addresses = [...new Set(rules.map(value => value.IPAddress))];
  if (addresses.length !== 1) throw new Error('Expected one Google HTTPS frontend');
  if (!dns(BROWSER_HOST, addresses).passed) throw new Error('Browser DNS does not point to the verified Google HTTPS frontend');

  async function get(path, authenticated = false) {
    try {
      return await request(`https://${BROWSER_HOST}${path}`, {
        redirect: 'error', signal: AbortSignal.timeout(20000),
        ...(authenticated ? { headers: { authorization: `Bearer ${credential}` } } : {}),
      });
    } catch { throw new Error('Google learner endpoint could not be reached securely'); }
  }
  const healthResponse = await get('/health');
  const health = await healthResponse.json();
  if (!healthResponse.ok || !health.ready || !health.providerAuthStorage?.persistent || !/^[a-f0-9]{40}$/.test(health.commit ?? ''))
    throw new Error('Google browser health, commit or persistent storage is not ready');
  const anonymous = await get('/learner/health');
  await anonymous.body?.cancel();
  if (anonymous.status !== 401) throw new Error('Anonymous learner access was not denied');
  const authenticated = await get('/learner/health', true);
  const learner = await authenticated.json();
  if (!authenticated.ok || !learner.ready || learner.commit !== health.commit)
    throw new Error('Google browser and LMS learner authentication did not pass');

  // Detect concurrent changes again immediately before writing either surface.
  assertNoActiveExecutions(inventory());
  if (!isDeepStrictEqual(readConfig(), config) || !isDeepStrictEqual(readJob().spec, before.spec))
    throw new Error('Runtime configuration changed during validation; retry against fresh state');
  const next = { ...config, runtimeEnvironment: { ...config.runtimeEnvironment, [URL_KEY]: LEARNER_ENDPOINT } };
  validateConfig(next, 'ultimate-worker');
  if (!isDeepStrictEqual(next, config)) {
    run(['secrets', 'versions', 'add', secretName, '--project=' + PROJECT, '--data-file=-'], JSON.stringify(next));
    if (!isDeepStrictEqual(readConfig(), next)) throw new Error('Saved Google learner configuration readback failed');
  }
  // Update only this endpoint. Preserve image, CPU, memory, retries and all
  // other variables. This does not execute a job or alter the course queue.
  if (entry(container, URL_KEY).value !== LEARNER_ENDPOINT) {
    run(['run', 'jobs', 'update', jobName, '--project=' + PROJECT, '--region=' + region, '--update-env-vars=' + URL_KEY + '=' + LEARNER_ENDPOINT, '--quiet']);
  }
  const after = readJob();
  const expected = structuredClone(before);
  Object.assign(entry(taskSpec(expected).container, URL_KEY), { value: LEARNER_ENDPOINT });
  delete entry(taskSpec(expected).container, URL_KEY).valueFrom;
  if (!isDeepStrictEqual(taskSpec(after).template, taskSpec(expected).template) || !isDeepStrictEqual(readConfig(), next))
    throw new Error('Live Google learner cutover readback failed; inspect the existing job before retrying');
  return { job: jobName, endpoint: LEARNER_ENDPOINT, browserCommit: health.commit,
    dnsVerified: true, learnerAuthenticationVerified: true, savedConfigurationUpdated: true,
    liveConfigurationUpdated: true, resourcesPreserved: true, executionStarted: false };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.env.GITHUB_REF !== 'refs/heads/main') throw new Error('Production cutover requires main');
  connectCourseLearner().then(result => console.log(JSON.stringify(result))).catch(error => {
    console.error(`Google learner cutover failed: ${error.message}`); process.exitCode = 1;
  });
}
