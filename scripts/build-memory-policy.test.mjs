import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { boundedBuildEnvironment, buildMemoryLimitBytes, withBuildMemoryDefaults, childExitStatus } from './build-memory-policy.mjs';
import { containerBuild, containerBuildPolicy, validateContainerProfiles } from './container-build-policy.mjs';
import { checkBuildMemoryPolicy } from './check-build-memory-policy.mjs';
import { mkdtemp, mkdir, writeFile, readFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const original = process.env.ELEVATE_SEQUENTIAL_TYPECHECK;
afterEach(() => {
  if (original === undefined) delete process.env.ELEVATE_SEQUENTIAL_TYPECHECK;
  else process.env.ELEVATE_SEQUENTIAL_TYPECHECK = original;
});
const GiB = 2 ** 30;

test('OOM kills retain exit 137 rather than being mislabeled as termination', () => {
  assert.equal(childExitStatus(null, 'SIGKILL'), 137);
  assert.equal(childExitStatus(null, 'SIGTERM'), 143);
  assert.equal(childExitStatus(null, 'SIGINT'), 130);
  assert.equal(childExitStatus(7, null), 7);
});

test('container limits take priority over host RAM and unlimited cgroups', () => {
  const files = { '/sys/fs/cgroup/memory.max': String(8 * GiB), '/sys/fs/cgroup/memory.high': 'max' };
  assert.equal(buildMemoryLimitBytes({ physicalBytes: 64 * GiB, constrainedBytes: 0, read(path) {
    if (!(path in files)) throw Error('absent');
    return files[path];
  } }), 8 * GiB);
});

test('soft memory limits and cgroup v1 are also respected', () => {
  assert.equal(buildMemoryLimitBytes({ physicalBytes: 64 * GiB, constrainedBytes: 0, read(path) {
    if (path.endsWith('memory.high')) return String(6 * GiB);
    if (path.endsWith('memory.limit_in_bytes')) return String(8 * GiB);
    return 'max';
  } }), 6 * GiB);
});

test('the Node-reported ancestor container limit also bounds an unlimited leaf cgroup', () => {
  assert.equal(buildMemoryLimitBytes({ physicalBytes: 64 * GiB, constrainedBytes: 7 * GiB,
    read: () => 'max' }), 7 * GiB);
});

test('oversized legacy heap values are clamped while unrelated Node options survive', () => {
  const result = boundedBuildEnvironment({ NODE_OPTIONS: '--enable-source-maps --max-old-space-size=16384', KEEP: 'value' }, 8 * GiB);
  assert.equal(result.heapMiB, 5120);
  assert.equal(result.env.NODE_OPTIONS, '--enable-source-maps --max-old-space-size=5120');
  assert.equal(result.env.KEEP, 'value');
});

test('smaller explicit heaps are retained and large hosts stay bounded', () => {
  assert.equal(boundedBuildEnvironment({ NODE_OPTIONS: '--max_old_space_size 4096' }, 8 * GiB).heapMiB, 4096);
  assert.equal(boundedBuildEnvironment({}, 64 * GiB).heapMiB, 6144);
  assert.throws(() => boundedBuildEnvironment({}, 2 * GiB), /at least 4 GiB/);
});

test('new app defaults preserve features but reject expanded build concurrency', () => {
  delete process.env.ELEVATE_SEQUENTIAL_TYPECHECK;
  const config = withBuildMemoryDefaults({ experimental: { cpus: 8, optimizeCss: false }, typescript: { ignoreBuildErrors: true } });
  assert.equal(config.experimental.cpus, 1);
  assert.equal(config.experimental.optimizeCss, false);
  assert.equal(config.experimental.parallelServerCompiles, false);
  assert.equal(config.typescript.ignoreBuildErrors, false);
});

test('type checking is deferred only for the canonical sequential build child', () => {
  process.env.ELEVATE_SEQUENTIAL_TYPECHECK = '1';
  assert.equal(withBuildMemoryDefaults({}).typescript.ignoreBuildErrors, true);
  process.env.ELEVATE_SEQUENTIAL_TYPECHECK = '0';
  assert.equal(withBuildMemoryDefaults({}).typescript.ignoreBuildErrors, false);
});

test('all Google image profiles have explicit workload families and unknown images are rejected', () => {
  assert.equal(Object.keys(containerBuildPolicy).length, 11);
  assert.equal(containerBuild('store').app, 'marketing');
  assert.equal(containerBuild('ultimate-worker').family, 'native-course-worker');
  assert.equal(containerBuild('media-gpu-worker').family, 'gpu-media');
  assert.equal(containerBuild('owned-cpu-llm').family, 'cpu-llm');
  assert.throws(() => containerBuild('unreviewed'), /Register a reviewed/);
  assert.throws(() => containerBuild('__proto__'), /Register a reviewed/);
});

test('new image profiles must declare existing memory, saving and recovery controls', () => {
  for (const field of ['memoryControl', 'savingControl', 'recoveryControl']) {
    const profile = { ...containerBuildPolicy.lms };
    delete profile[field];
    assert.throws(() => validateContainerProfiles({ future: profile }, () => true), new RegExp(field));
  }
  assert.throws(() => validateContainerProfiles({future:{...containerBuildPolicy.lms,family:'unknown'}}, () => true), /unknown workload/);
  assert.throws(() => validateContainerProfiles({future:{...containerBuildPolicy.lms,savingControl:'../unreviewed'}}, () => true), /savingControl/);
  assert.throws(() => validateContainerProfiles({future:containerBuildPolicy.lms}, () => false), /source is required/);
});

async function policyFixture(run) {
  const root = await mkdtemp(join(tmpdir(), 'new-container-policy-'));
  try {
    await mkdir(join(root, 'scripts'), { recursive: true });
    await writeFile(join(root, 'scripts/build-memory-policy.mjs'), await readFile(new URL('./build-memory-policy.mjs', import.meta.url)));
    await writeFile(join(root, 'next.config.mjs'), "import {withBuildMemoryDefaults} from './scripts/build-memory-policy.mjs'; export default withBuildMemoryDefaults({});");
    // Test against the reviewed worker COPY allowlist used in real image builds.
    await writeFile(join(root, '.dockerignore'), await readFile(new URL('../.dockerignore', import.meta.url)));
    const workerTest = join(root, 'tests/worker/narration-storage-reference.test.mjs');
    await mkdir(dirname(workerTest), { recursive: true });
    await writeFile(workerTest, '// fixture for policy validation');
    const app = join(root, 'apps', 'future-app');
    await mkdir(app, { recursive: true });
    await writeFile(join(app, 'package.json'), await readFile(new URL('../templates/next-web-container/package.json', import.meta.url)));
    await writeFile(join(app, 'next.config.mjs'), await readFile(new URL('../templates/next-web-container/next.config.mjs', import.meta.url)));
    for (const { dockerfile } of Object.values(containerBuildPolicy)) {
      const path = join(root, dockerfile);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, 'FROM node:22 AS builder\nRUN install util-linux\n');
      if (dockerfile === 'Dockerfile.ultimate-worker') {
        await writeFile(path, 'FROM node:22 AS builder\nRUN install util-linux\nCOPY tests/worker/narration-storage-reference.test.mjs ./tests/worker/\n');
      }
    }
    for (const profile of Object.values(containerBuildPolicy)) {
      for (const field of ['memoryControl', 'savingControl', 'recoveryControl']) {
        const path = join(root, profile[field]);
        try { await access(path); } catch {
          await mkdir(dirname(path), {recursive:true});
          await writeFile(path, '// reviewed fixture control\n');
        }
      }
    }
    await run(root, app);
  } finally { await rm(root, { recursive: true, force: true }); }
}

test('new Next applications are discovered automatically without an app allowlist', async () => {
  await policyFixture(async root => {
    const result = await checkBuildMemoryPolicy(root);
    assert.deepEqual(result.nextApps, ['future-app']);
    assert.equal(result.nextConfigs, 2);
  });
});

test('new containers cannot bypass bounded admission with a raw next build script', async () => {
  await policyFixture(async (root, app) => {
    await writeFile(join(app, 'package.json'), JSON.stringify({ dependencies: { next: '15.5.25' }, scripts: { build: 'next build' } }));
    await assert.rejects(checkBuildMemoryPolicy(root), /bounded, sequentially typechecked/);
  });
});

test('a hard-coded builder heap blocks the container before compilation', async () => {
  await policyFixture(async root => {
    await writeFile(join(root, 'Dockerfile.marketing'), 'FROM node:22 AS builder\nRUN install util-linux\nENV NODE_OPTIONS=--max-old-space-size=16384\n');
    await assert.rejects(checkBuildMemoryPolicy(root), /hard-coded build heaps/);
  });
});

test('a new Docker-building workflow cannot omit automatic admission', async () => {
  await policyFixture(async root => {
    const directory = join(root, '.github/workflows');
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, 'future.yml'), 'steps:\n  - run: docker build -f Dockerfile.marketing .\n');
    await assert.rejects(checkBuildMemoryPolicy(root), /every container build needs/);
  });
});

test('an admitted workflow must still register a new image source', async () => {
  await policyFixture(async root => {
    const directory = join(root, '.github/workflows');
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, 'future.yml'), 'steps:\n  - run: node scripts/check-build-memory-policy.mjs --source-only\n  - run: docker build -f Dockerfile.unreviewed .\n');
    await assert.rejects(checkBuildMemoryPolicy(root), /register Dockerfile.unreviewed/);
  });
});

test('alternate future container builders cannot silently bypass admission', async () => {
  await policyFixture(async root => {
    const directory = join(root, '.github/workflows');
    await mkdir(directory, {recursive:true});
    for (const builder of ['uses: docker/build-push-action@v6', 'run: gcloud builds submit .', 'run: podman build .', 'run: buildctl build']) {
      await writeFile(join(directory, 'future.yml'), `steps:\n  - ${builder}\n`);
      await assert.rejects(checkBuildMemoryPolicy(root), /integrate this container builder/);
    }
  });
});

test('worker regression must remain included by the Docker context', async () => {
  await policyFixture(async root => {
    await writeFile(join(root, '.dockerignore'), 'tests\n');
    await assert.rejects(checkBuildMemoryPolicy(root), /Worker image fixture excluded by \.dockerignore/);
  });
});

test('missing worker regression fixture blocks release admission', async () => {
  await policyFixture(async root => {
    await rm(join(root, 'tests/worker/narration-storage-reference.test.mjs'));
    await assert.rejects(checkBuildMemoryPolicy(root), /Worker image regression fixture missing/);
  });
});