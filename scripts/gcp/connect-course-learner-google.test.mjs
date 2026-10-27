import test from 'node:test';
import assert from 'node:assert/strict';
import { connectCourseLearner, LEARNER_ENDPOINT } from './connect-course-learner-google.mjs';

const project = 'elegant-racer-299721';
const root = `https://www.googleapis.com/compute/v1/projects/${project}`;
const secret = 'existing-learner-test-credential';
const urlKey = 'ULTIMATE_LEARNER_RUNTHROUGH_URL';
function fixture(options = {}) {
  const state = {
    config: { version: 1, component: 'ultimate-worker', volumes: [], runtimeFiles: {},
      runtimeEnvironment: { [urlKey]: 'https://browser--old.code.run/learner/runthrough',
        ULTIMATE_LEARNER_RUNTHROUGH_SECRET: secret, UNRELATED: 'preserved' } },
    job: { spec: { template: { spec: { parallelism: 1, taskCount: 1, template: { spec: {
      serviceAccountName: `elevate-worker-runtime@${project}.iam.gserviceaccount.com`,
      timeoutSeconds: '10800', maxRetries: 0,
      containers: [{ image: 'us-central1-docker.pkg.dev/existing@sha256:' + 'f'.repeat(64),
        resources: { limits: { cpu: '8000m', memory: '32Gi' } },
        env: [{ name: urlKey, value: 'https://browser--old.code.run/learner/runthrough' },
          { name: 'ULTIMATE_LEARNER_RUNTHROUGH_SECRET', value: secret },
          { name: 'UNRELATED', value: 'unchanged' }] }],
    } } } } } },
    calls: [], writes: [], requests: [], configReads: 0,
  };
  const run = (args, input) => {
    state.calls.push(args);
    if (args.slice(0, 3).join(' ') === 'secrets versions access') {
      state.configReads++;
      if (options.concurrent && state.configReads === 2) state.config.runtimeEnvironment.UNRELATED = 'new-owner-change';
      return JSON.stringify(state.config);
    }
    if (args.slice(0, 3).join(' ') === 'secrets versions add') {
      state.writes.push('saved-config'); state.config = JSON.parse(input); return '';
    }
    if (args.slice(0, 3).join(' ') === 'run jobs describe') return JSON.stringify(state.job);
    if (args.slice(0, 4).join(' ') === 'run jobs executions list')
      return JSON.stringify(options.active ? [{ status: { conditions: [{ type: 'Completed', status: 'Unknown' }] } }] : []);
    if (args.slice(0, 3).join(' ') === 'run jobs update') {
      state.writes.push('job');
      const container = state.job.spec.template.spec.template.spec.containers[0];
      container.env.find(entry => entry.name === urlKey).value = LEARNER_ENDPOINT;
      if (options.corruptResources) container.resources.limits.memory = '8Gi';
      return '';
    }
    if (args[1] === 'url-maps') return JSON.stringify({ name: 'elevate-public-routes',
      hostRules: [{ hosts: ['browser.elevateforhumanity.org'], pathMatcher: 'studio-browser' }],
      pathMatchers: [{ name: 'studio-browser', defaultService: root + '/global/backendServices/elevate-studio-browser-backend' }] });
    if (args[1] === 'backend-services') return JSON.stringify({ backends: [{ group: root + '/zones/us-central1-a/instanceGroups/elevate-studio-browser-group' }] });
    if (args[1] === 'instance-groups') return JSON.stringify([{ instance: root + '/zones/us-central1-a/instances/elevate-studio-browser-trial' }]);
    if (args[1] === 'target-https-proxies') return JSON.stringify([{ selfLink: root + '/global/targetHttpsProxies/public', urlMap: root + '/global/urlMaps/elevate-public-routes' }]);
    if (args[1] === 'forwarding-rules') return JSON.stringify([{ target: root + '/global/targetHttpsProxies/public', portRange: '443-443', IPAddress: '34.110.235.233' }]);
    throw new Error('Unexpected command: ' + args.slice(0, 3).join(' '));
  };
  const request = async (url, init) => {
    state.requests.push({ url, init });
    assert.equal(init.redirect, 'error');
    if (url.endsWith('/learner/health') && !init.headers) return new Response('{}', { status: options.anonymousAllowed ? 200 : 401 });
    if (init.headers) assert.equal(init.headers.authorization, 'Bearer ' + secret);
    return new Response(JSON.stringify({ ready: !options.unready, commit: 'a'.repeat(40), providerAuthStorage: { persistent: true } }), { status: options.authFailed && init.headers ? 401 : 200 });
  };
  return { state, dependencies: { run, request, dns: () => ({ passed: !options.badDns }) } };
}

test('replaces saved and live legacy endpoints while preserving the existing 8 CPU / 32 GiB job', async () => {
  const { state, dependencies } = fixture();
  const original = structuredClone(state.job.spec.template.spec.template.spec.containers[0]);
  const result = await connectCourseLearner(dependencies);
  assert.deepEqual(state.writes, ['saved-config', 'job']);
  assert.equal(state.config.runtimeEnvironment[urlKey], LEARNER_ENDPOINT);
  assert.equal(state.config.runtimeEnvironment.UNRELATED, 'preserved');
  const after = state.job.spec.template.spec.template.spec.containers[0];
  assert.equal(after.env.find(value => value.name === urlKey).value, LEARNER_ENDPOINT);
  assert.deepEqual(after.resources, original.resources);
  assert.equal(after.image, original.image);
  assert.deepEqual(after.env.filter(value => value.name !== urlKey), original.env.filter(value => value.name !== urlKey));
  assert.equal(result.executionStarted, false);
  assert.equal(state.calls.some(args => args.includes('execute')), false);
  assert.equal(JSON.stringify(state.calls).includes(secret), false);
  assert.equal(JSON.stringify(result).includes(secret), false);
  state.writes.length = 0;
  await connectCourseLearner(dependencies);
  assert.deepEqual(state.writes, []);
});

for (const [options, error] of [
  [{ badDns: true }, /DNS/], [{ unready: true }, /not ready/],
  [{ authFailed: true }, /authentication did not pass/],
  [{ anonymousAllowed: true }, /Anonymous learner access/],
  [{ active: true }, /ALREADY_ACTIVE/], [{ concurrent: true }, /changed during validation/],
]) {
  test(`refuses cutover before mutations: ${Object.keys(options)[0]}`, async () => {
    const { state, dependencies } = fixture(options);
    await assert.rejects(connectCourseLearner(dependencies), error);
    assert.deepEqual(state.writes, []);
    if (options.badDns) assert.equal(state.requests.length, 0);
  });
}

test('mismatched existing credentials are not copied, rotated or overwritten', async () => {
  const { state, dependencies } = fixture();
  state.job.spec.template.spec.template.spec.containers[0].env[1].value = 'other-existing-credential';
  await assert.rejects(connectCourseLearner(dependencies), /credentials differ/);
  assert.deepEqual(state.writes, []);
});

test('readback detects an unrelated resource change instead of claiming success', async () => {
  const { dependencies } = fixture({ corruptResources: true });
  await assert.rejects(connectCourseLearner(dependencies), /cutover readback failed/);
});
