#!/usr/bin/env tsx
/**
 * Canonical Northflank production provisioner for Elevate's self-hosted GPU video worker.
 *
 * Acceptance is deliberately strict: service creation, exact-SHA CUDA build,
 * persistent model mount, restricted bearer auth, Wan model readiness, and a
 * real 5-second 720p MP4 must all pass before this script exits successfully.
 */
import crypto from 'node:crypto';
import { nfFetch, projectApiPath } from './lib';

const WEB_PROJECT_ID = process.env.NORTHFLANK_PROJECT_ID || 'elevate-platform';
const GPU_PROJECT_ID = process.env.NORTHFLANK_GPU_PROJECT_ID || 'elevate-media-gpu';
const GPU_REGION = process.env.NORTHFLANK_GPU_REGION || 'us-central';
const SERVICE_ID = process.env.NORTHFLANK_GPU_SERVICE_ID || 'elevate-gpu-worker';
const ADMIN_SERVICE_ID = process.env.NORTHFLANK_ADMIN_SERVICE_ID || 'elevate-admin';
const MODEL_VOLUME_ID = process.env.NORTHFLANK_GPU_MODEL_VOLUME_ID || 'elevate-gpu-models-rwx';
const MODEL_VOLUME_MB = Number(process.env.NORTHFLANK_GPU_MODEL_VOLUME_MB || '153600');
// Northflank GPU workloads only accept ReadWriteMany volumes. The platform's
// managed RWX storage class is nf-multi-rw; access mode is immutable after
// volume creation, so this intentionally uses a new volume ID.
const MODEL_STORAGE_CLASS = process.env.NORTHFLANK_GPU_MODEL_STORAGE_CLASS || 'nf-multi-rw';
const MODEL_ACCESS_MODE = 'ReadWriteMany';
const GPU_TYPE = process.env.NORTHFLANK_GPU_TYPE || 'l4-24';
const GPU_COUNT = Number(process.env.NORTHFLANK_GPU_COUNT || '1');
// Confirmed by the Northflank API: nf-compute-* plans are rejected for managed GPU workloads.
const GPU_DEPLOYMENT_PLAN = process.env.NORTHFLANK_GPU_DEPLOYMENT_PLAN || `nf-gpu-${GPU_TYPE}-${GPU_COUNT}g`;
const BUILD_PLAN = process.env.NORTHFLANK_GPU_BUILD_PLAN || 'nf-compute-800-16';
// Northflank's managed L4 node contract is exactly 256000 MB for deployment
// ephemeral storage. 262144 MiB looks like 256 GiB, but the Northflank API
// rejects it because the platform limit is expressed as 256000 MB.
const GPU_DEPLOYMENT_EPHEMERAL_MB = Number(process.env.NORTHFLANK_GPU_EPHEMERAL_MB || '256000');
const BUILD_EPHEMERAL_MB = Number(process.env.NORTHFLANK_GPU_BUILD_EPHEMERAL_MB || '32768');
const RUNTIME_PORT = 8080;
const REPO = 'https://github.com/elevate-for-humanity/Elevate-lms';
const DOCKERFILE = '/services/media-gpu-worker/Dockerfile';
const BUILD_TIMEOUT_MS = Number(process.env.GPU_PROVISION_BUILD_TIMEOUT_MS || 60 * 60 * 1000);
const READY_TIMEOUT_MS = Number(process.env.GPU_PROVISION_READY_TIMEOUT_MS || 90 * 60 * 1000);
const ACCEPTANCE_TIMEOUT_MS = Number(process.env.GPU_PROVISION_ACCEPTANCE_TIMEOUT_MS || 30 * 60 * 1000);

type R = Record<string, any>;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const log = (message: string, detail?: unknown) => detail === undefined
  ? console.log(`[gpu-provision] ${message}`)
  : console.log(`[gpu-provision] ${message}`, detail);

function arrayFrom(value: unknown, key?: string): R[] {
  if (Array.isArray(value)) return value as R[];
  const object = value as R | null;
  if (key && Array.isArray(object?.[key])) return object[key] as R[];
  if (key && Array.isArray(object?.data?.[key])) return object.data[key] as R[];
  if (Array.isArray(object?.data)) return object.data as R[];
  return [];
}

async function preflight() {
  const project = await nfFetch<R>(`/projects/${GPU_PROJECT_ID}`);
  const region = project.deployment?.region || project.region;
  if (region !== GPU_REGION) throw new Error(`GPU project ${GPU_PROJECT_ID} is in ${region || 'unknown'}, expected ${GPU_REGION}`);

  const regions = arrayFrom(await nfFetch<R>('/regions'), 'regions');
  const regionConfig = regions.find((item) => item.id === region);
  const gpu = (regionConfig?.gpuDevices || []).find((item: R) => item.id === GPU_TYPE);
  if (!gpu) throw new Error(`GPU ${GPU_TYPE} is not exposed in Northflank region ${region}`);
  if (Number(gpu.memoryInfo?.sizeInMiB || 0) < 24 * 1024) throw new Error(`${GPU_TYPE} exposes less than 24GB VRAM`);
  if (Array.isArray(gpu.countOptions) && !gpu.countOptions.includes(GPU_COUNT)) throw new Error(`${GPU_TYPE} does not support gpuCount=${GPU_COUNT}`);

  const plans = arrayFrom(await nfFetch<R>('/plans'), 'plans');
  if (!plans.some((plan) => plan.id === BUILD_PLAN && Array.isArray(plan.type) && plan.type.includes('build'))) {
    throw new Error(`Build plan ${BUILD_PLAN} is not available`);
  }
  if (GPU_DEPLOYMENT_EPHEMERAL_MB !== 256000) {
    throw new Error(`Northflank L4 deployment ephemeral storage must be exactly 256000MB; got ${GPU_DEPLOYMENT_EPHEMERAL_MB}`);
  }
  log('Preflight passed', {
    gpuProject: GPU_PROJECT_ID,
    region,
    gpu: GPU_TYPE,
    vramMiB: gpu.memoryInfo?.sizeInMiB,
    gpuPlan: GPU_DEPLOYMENT_PLAN,
    buildPlan: BUILD_PLAN,
    modelStorageClass: MODEL_STORAGE_CLASS,
    deploymentEphemeralMb: GPU_DEPLOYMENT_EPHEMERAL_MB,
    buildEphemeralMb: BUILD_EPHEMERAL_MB,
  });
}

async function ensureVolume(): Promise<string> {
  const volumes = arrayFrom(await nfFetch<R>(projectApiPath(GPU_PROJECT_ID, '/volumes')), 'volumes');
  // Access mode is immutable, so never fall back to a display-name match: the
  // legacy volume has the same old name but is ReadWriteOnce and cannot be
  // attached to a GPU workload.
  let volume = volumes.find((item) => item.id === MODEL_VOLUME_ID);
  if (!volume) {
    volume = await nfFetch<R>(projectApiPath(GPU_PROJECT_ID, '/volumes'), {
      method: 'POST',
      body: JSON.stringify({
        name: 'Elevate GPU Models RWX',
        mounts: [{ volumeMountPath: '', containerMountPath: '/models' }],
        spec: {
          accessMode: MODEL_ACCESS_MODE,
          storageClassName: MODEL_STORAGE_CLASS,
          storageSize: MODEL_VOLUME_MB,
        },
      }),
    });
    log('Created model volume', {
      id: volume.id,
      accessMode: MODEL_ACCESS_MODE,
      storageSize: MODEL_VOLUME_MB,
      storageClassName: MODEL_STORAGE_CLASS,
    });
  } else if (volume.spec?.accessMode && volume.spec.accessMode !== MODEL_ACCESS_MODE) {
    throw new Error(
      `GPU model volume ${volume.id || MODEL_VOLUME_ID} uses ${volume.spec.accessMode}; ` +
      `${MODEL_ACCESS_MODE} is required and volume access mode cannot be changed in place.`,
    );
  } else if (Number(volume.spec?.storageSize || 0) < MODEL_VOLUME_MB) {
    await nfFetch(projectApiPath(GPU_PROJECT_ID, `/volumes/${volume.id}`), {
      method: 'POST',
      body: JSON.stringify({
        mounts: [{ volumeMountPath: '', containerMountPath: '/models' }],
        spec: { storageSize: MODEL_VOLUME_MB },
      }),
    });
    log('Expanded model volume', { id: volume.id, storageSize: MODEL_VOLUME_MB });
  }
  return String(volume.id || MODEL_VOLUME_ID);
}

async function serviceExists() {
  try { await nfFetch(projectApiPath(GPU_PROJECT_ID, `/services/${SERVICE_ID}`)); return true; }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/404|not found/i.test(message)) return false;
    throw error;
  }
}

function servicePayload(volumeId: string): R {
  const gpu = { enabled: true, configuration: { gpuType: GPU_TYPE, gpuCount: GPU_COUNT, timesliced: false } };
  return {
    name: SERVICE_ID,
    description: 'Elevate self-hosted Wan generative video GPU worker',
    billing: { deploymentPlan: GPU_DEPLOYMENT_PLAN, buildPlan: BUILD_PLAN, gpu },
    infrastructure: { architecture: 'x86' },
    buildSource: 'git',
    disabledCI: false,
    vcsData: { projectUrl: REPO, projectType: 'github', projectBranch: 'main' },
    buildSettings: {
      storage: { ephemeralStorage: { storageSize: BUILD_EPHEMERAL_MB } },
      dockerfile: {
        buildEngine: 'buildkit',
        dockerFilePath: DOCKERFILE,
        dockerWorkDir: '/',
        buildkit: { useCache: true, cacheStorageSize: 16384 },
      },
    },
    buildConfiguration: {
      storage: { ephemeralStorage: { storageSize: BUILD_EPHEMERAL_MB } },
      ciIgnoreFlagsEnabled: true,
      ciIgnoreFlags: ['[skip ci]', '[ci skip]', '[northflank skip]', '[skip northflank]'],
    },
    deployment: {
      type: 'deployment',
      instances: 1,
      docker: { configType: 'default' },
      gpu,
      storage: { shmSize: 16384, ephemeralStorage: { storageSize: GPU_DEPLOYMENT_EPHEMERAL_MB } },
      strategy: { type: 'recreate' },
      gracePeriodSeconds: 180,
    },
    createOptions: { volumesToAttach: [volumeId] },
    ports: [{ name: 'gpu', internalPort: RUNTIME_PORT, protocol: 'HTTP', public: true }],
    runtimeEnvironment: {
      SERVICE_ROLE: 'media-gpu-worker',
      PORT: String(RUNTIME_PORT),
      GPU_VIDEO_PROVIDER: 'wan',
      GPU_MAX_CONCURRENCY: '1',
      GPU_JOB_TIMEOUT_SECONDS: '1800',
      GPU_ASSET_TTL_SECONDS: '7200',
      WAN_MIN_VRAM_GB: '22',
      WAN_FPS: '24',
      MODEL_BOOTSTRAP_ENABLED: 'true',
      MODEL_RUNTIME_ROOT: '/models/runtime',
      WAN_REPO: '/models/runtime/wan2.2',
      WAN_VENV: '/models/runtime/wan-venv',
      WAN_PYTHON: '/models/runtime/wan-venv/bin/python',
      WAN_CHECKPOINT_DIR: '/models/Wan2.2-TI2V-5B',
      WAN_MODEL_ID: 'Wan-AI/Wan2.2-TI2V-5B',
      WAN_GIT_REF: '42bf4cfaa384bc21833865abc2f9e6c0e67233dc',
      HF_HOME: '/models/huggingface',
      GPU_OUTPUT_DIR: '/data/output',
    },
    healthChecks: [
      { protocol: 'HTTP', type: 'startupProbe', path: '/health', port: RUNTIME_PORT, initialDelaySeconds: 20, periodSeconds: 15, timeoutSeconds: 5, failureThreshold: 40 },
      { protocol: 'HTTP', type: 'livenessProbe', path: '/health', port: RUNTIME_PORT, initialDelaySeconds: 60, periodSeconds: 30, timeoutSeconds: 5, failureThreshold: 5 },
    ],
  };
}

async function ensureService(volumeId: string) {
  const exists = await serviceExists();
  try {
    await nfFetch(projectApiPath(GPU_PROJECT_ID, exists ? `/services/combined/${SERVICE_ID}` : '/services/combined'), {
      method: exists ? 'PATCH' : 'POST',
      body: JSON.stringify(servicePayload(volumeId)),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('402') || /minimum \$50 credit/i.test(message)) {
      throw new Error('Northflank GPU billing is locked: purchase at least $50 of Northflank account credits, then rerun this workflow.');
    }
    throw error;
  }
  if (exists) {
    try {
      await nfFetch(projectApiPath(GPU_PROJECT_ID, `/volumes/${volumeId}/attach`), {
        method: 'POST', body: JSON.stringify({ nfObject: { id: SERVICE_ID, type: 'service' } }),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/already|attached|conflict/i.test(message)) throw error;
    }
  }
}

type ExactBuild = { buildId: string; sha: string };

async function triggerExactBuild(): Promise<ExactBuild> {
  const sha = process.env.GITHUB_SHA?.trim();
  if (!sha || !/^[0-9a-f]{40}$/i.test(sha)) {
    throw new Error(`GITHUB_SHA must be a full 40-character Git SHA; received ${sha || 'missing'}`);
  }
  const result = await nfFetch<R>(projectApiPath(GPU_PROJECT_ID, `/services/${SERVICE_ID}/build`), {
    method: 'POST', body: JSON.stringify({ sha }),
  });
  if (!result.id) throw new Error('Northflank accepted the build request but returned no build ID');
  log('Exact-SHA build triggered', { buildId: result.id, sha: result.sha || sha });
  return { buildId: String(result.id), sha };
}

async function logBuildFailure(buildId: string, build: R): Promise<void> {
  log('Build failure detail', {
    id: build.id || buildId,
    status: build.status,
    message: build.message || null,
    concluded: build.concluded,
  });
  try {
    const query = new URLSearchParams({
      buildId,
      queryType: 'range',
      duration: '3600',
      lineLimit: '500',
      direction: 'forward',
    });
    const entries = arrayFrom(
      await nfFetch<R[]>(projectApiPath(GPU_PROJECT_ID, `/services/${SERVICE_ID}/build-logs?${query}`)),
    );
    const diagnosticPattern = /error|failed|failure|denied|not found|no space|unauthorized|manifest|timeout|timed out|tls|certificate|rate limit|\b429\b|\b5\d\d\b/i;
    const safeLines = entries
      .map((entry) => String(entry.log || '').replace(/^(stdout|stderr)\s+[A-Z]\s+/, ''))
      .filter((line) => diagnosticPattern.test(line))
      .slice(-80)
      .map((line) => line
        .replace(/https?:\/\/\S+/gi, '[url-redacted]')
        .replace(/bearer\s+\S+/gi, 'Bearer [redacted]')
        .replace(/\b(token|secret|password|api[_-]?key)\s*[=:]\s*\S+/gi, '$1=[redacted]')
        .replace(/\b[0-9a-f]{32,}\b/gi, '[identifier-redacted]')
        .replace(/[\r\n\t]+/g, ' ')
        .slice(0, 1200));
    safeLines.forEach((line) => console.error(`[gpu-build-diagnostic] ${line}`));
  } catch (error) {
    log('Unable to retrieve Northflank build logs', error instanceof Error ? error.message : String(error));
  }
}

async function waitForExactBuild({ buildId, sha }: ExactBuild): Promise<void> {
  const deadline = Date.now() + BUILD_TIMEOUT_MS;
  const failed = new Set(['FAILURE', 'FAILED', 'ERROR', 'CRASHED', 'ABORTED', 'SUBMISSION_FAILURE', 'TIMEOUT']);
  let previous = '';
  while (Date.now() < deadline) {
    const response = await nfFetch<R>(projectApiPath(GPU_PROJECT_ID, `/services/${SERVICE_ID}/build/${buildId}`));
    const build = response.data || response;
    const status = String(build.status || 'unknown').toUpperCase();
    if (status !== previous) { log(`Exact build ${buildId} status ${status}`); previous = status; }
    if (failed.has(status)) {
      await logBuildFailure(buildId, build);
      throw new Error(`GPU build ${buildId} failed: ${status}${build.message ? `: ${build.message}` : ''}`);
    }
    if (status === 'SUCCESS') {
      if (!build.sha || String(build.sha).toLowerCase() !== sha.toLowerCase()) {
        throw new Error(`GPU build SHA mismatch: expected ${sha}, received ${build.sha || 'missing'}`);
      }
      return;
    }
    await sleep(15_000);
  }
  throw new Error(`Timed out waiting for exact GPU build ${buildId}`);
}

async function deployExactBuild({ buildId, sha }: ExactBuild): Promise<void> {
  await nfFetch(projectApiPath(GPU_PROJECT_ID, `/services/${SERVICE_ID}/deployment`), {
    method: 'POST',
    body: JSON.stringify({
      internal: { id: SERVICE_ID, branch: 'main', buildId },
      docker: { configType: 'default' },
    }),
  });
  log('Exact build deployment accepted', { buildId, sha });
}

function deploymentStatus(service: R) { return service.status?.deployment?.status || service.deployment?.status || service.deploymentStatus; }

async function waitForDeployment(): Promise<R> {
  const deadline = Date.now() + BUILD_TIMEOUT_MS;
  const failed = new Set(['FAILURE', 'FAILED', 'ERROR', 'CRASHED']);
  let previous = '';
  while (Date.now() < deadline) {
    const service = await nfFetch<R>(projectApiPath(GPU_PROJECT_ID, `/services/${SERVICE_ID}`));
    const deployment = deploymentStatus(service);
    const status = deployment || 'unknown';
    if (status !== previous) { log(`Deployment status ${status}`); previous = status; }
    if (failed.has(deployment || '')) throw new Error(`GPU deployment failed: ${status}`);
    if (deployment === 'COMPLETED') return service;
    await sleep(15_000);
  }
  throw new Error('Timed out waiting for GPU deployment');
}

function collectStrings(value: unknown, output: string[] = []): string[] {
  if (typeof value === 'string') output.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, output));
  else if (value && typeof value === 'object') Object.values(value as R).forEach((item) => collectStrings(item, output));
  return output;
}

function discoverPublicUrl(service: R): string | null {
  for (const value of collectStrings(service)) {
    if (/^https?:\/\//i.test(value) && !value.includes('github.com')) return value.replace(/\/$/, '');
  }
  for (const value of collectStrings(service)) {
    const host = value.replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (/^[a-z0-9.-]+\.(code\.run|northflank\.app)$/i.test(host)) return `https://${host}`;
  }
  return null;
}

async function waitForPublicUrl(): Promise<string> {
  for (let attempt = 0; attempt < 60; attempt++) {
    const url = discoverPublicUrl(await nfFetch<R>(projectApiPath(GPU_PROJECT_ID, `/services/${SERVICE_ID}`)));
    if (url) return url;
    await sleep(10_000);
  }
  throw new Error('GPU service deployed but no public endpoint became available');
}

async function upsertSecretGroup(projectId: string, id: string, serviceId: string, variables: Record<string, string>) {
  const payload = {
    name: id,
    description: 'Elevate GPU media runtime wiring',
    priority: 30,
    type: 'secret',
    secretType: 'environment',
    restrictions: { restricted: true, nfObjects: [{ id: serviceId, type: 'service' }], tagMatchCondition: 'or' },
    secrets: { variables },
  };
  try {
    await nfFetch(projectApiPath(projectId, `/secrets/${id}`));
    await nfFetch(projectApiPath(projectId, `/secrets/${id}`), { method: 'POST', body: JSON.stringify(payload) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/404|not found/i.test(message)) throw error;
    await nfFetch(projectApiPath(projectId, '/secrets'), { method: 'POST', body: JSON.stringify(payload) });
  }
}

async function restart(projectId: string, serviceId: string) {
  await nfFetch(projectApiPath(projectId, `/services/${serviceId}/restart`), { method: 'POST', body: '{}' });
}

async function wireSecrets(publicUrl: string, workerSecret: string) {
  await upsertSecretGroup(GPU_PROJECT_ID, 'elevate-gpu-worker-env', SERVICE_ID, { GPU_WORKER_SECRET: workerSecret });
  await upsertSecretGroup(WEB_PROJECT_ID, 'elevate-gpu-client-env', ADMIN_SERVICE_ID, {
    GPU_VIDEO_WORKER_URL: publicUrl,
    GPU_WORKER_SECRET: workerSecret,
    GPU_VIDEO_PROVIDER: 'wan',
    GPU_VIDEO_PUBLIC_ACCEPTANCE_URL: publicUrl,
  });
}

async function waitForReady(publicUrl: string, secret: string): Promise<R> {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${publicUrl}/ready`, {
        headers: { authorization: `Bearer ${secret}` }, signal: AbortSignal.timeout(10_000),
      });
      const body = await response.json() as R;
      log('Readiness', { ready: body.ready, gpu: body.gpu, vramBytes: body.vramBytes, wanInstalled: body.wanInstalled, wanModelReady: body.wanModelReady, bootstrap: body.bootstrap?.state });
      if (response.ok && body.ready === true) return body;
      if (body.bootstrap?.state === 'failed') throw new Error(`Model bootstrap failed: ${body.bootstrap?.detail || 'unknown error'}`);
    } catch (error) {
      log('Readiness waiting', error instanceof Error ? error.message : String(error));
    }
    await sleep(20_000);
  }
  throw new Error('Timed out waiting for CUDA/Wan model readiness');
}

async function acceptanceGenerate(publicUrl: string, secret: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ACCEPTANCE_TIMEOUT_MS);
  try {
    const response = await fetch(`${publicUrl}/v1/video/generate`, {
      method: 'POST',
      headers: { authorization: `Bearer ${secret}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        provider: 'wan',
        prompt: 'Professional educational cinematic scene of a small business owner reviewing a business plan at a clean desk, natural lighting, realistic motion, no text overlays',
        width: 1280, height: 704, duration_seconds: 5, seed: 42,
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Wan acceptance generation failed (${response.status}): ${(await response.text()).slice(0, 1000)}`);
    const generated = await response.json() as R;
    if (!generated.jobId || !generated.assetPath) throw new Error('Wan acceptance returned no asset');
    const asset = await fetch(`${publicUrl}${generated.assetPath}`, {
      headers: { authorization: `Bearer ${secret}` }, signal: AbortSignal.timeout(120_000),
    });
    if (!asset.ok) throw new Error(`Wan acceptance asset download failed (${asset.status})`);
    const contentType = asset.headers.get('content-type') || '';
    const bytes = Buffer.from(await asset.arrayBuffer());
    if (!contentType.startsWith('video/mp4') || bytes.length < 50_000) throw new Error(`Invalid acceptance MP4 (${contentType}, ${bytes.length} bytes)`);
    log('Real Wan MP4 acceptance passed', { bytes: bytes.length });
    await fetch(`${publicUrl}${generated.assetPath}`, { method: 'DELETE', headers: { authorization: `Bearer ${secret}` } }).catch(() => undefined);
  } finally { clearTimeout(timer); }
}

async function main() {
  const execute = process.argv.includes('--execute');
  await preflight();
  log('Target', {
    gpuProject: GPU_PROJECT_ID,
    service: SERVICE_ID,
    gpuPlan: GPU_DEPLOYMENT_PLAN,
    modelVolumeMb: MODEL_VOLUME_MB,
    modelStorageClass: MODEL_STORAGE_CLASS,
    modelAccessMode: MODEL_ACCESS_MODE,
    deploymentEphemeralMb: GPU_DEPLOYMENT_EPHEMERAL_MB,
  });
  if (!execute) return;

  const volumeId = await ensureVolume();
  await ensureService(volumeId);
  const exactBuild = await triggerExactBuild();
  await waitForExactBuild(exactBuild);
  await deployExactBuild(exactBuild);
  const deployed = await waitForDeployment();
  const publicUrl = discoverPublicUrl(deployed) || await waitForPublicUrl();
  const workerSecret = crypto.randomBytes(32).toString('hex');
  console.log(`::add-mask::${workerSecret}`);
  await wireSecrets(publicUrl, workerSecret);
  await Promise.all([restart(GPU_PROJECT_ID, SERVICE_ID), restart(WEB_PROJECT_ID, ADMIN_SERVICE_ID)]);
  await waitForReady(publicUrl, workerSecret);
  await acceptanceGenerate(publicUrl, workerSecret);
  log('GPU MEDIA ACCEPTANCE PASSED', { gpuProject: GPU_PROJECT_ID, service: SERVICE_ID, publicUrl, provider: 'wan' });
}

main().catch((error) => {
  console.error('[gpu-provision] FAILED', error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
