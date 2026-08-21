#!/usr/bin/env tsx
/**
 * Canonical Elevate GPU worker provisioner for Northflank managed cloud.
 *
 * Owns the full production path:
 * project/region validation -> L4 discovery -> persistent /models volume ->
 * combined service create/update -> exact-SHA build -> secret wiring ->
 * worker/Admin restart -> CUDA/Wan readiness -> real MP4 acceptance.
 *
 * Northflank native CI remains disabled. GitHub Actions is the deployment
 * controller and explicitly starts the exact commit SHA after provisioning.
 */
import crypto from 'node:crypto';
import { nfFetch, projectApiPath } from './lib';

const PROJECT_ID = process.env.NORTHFLANK_GPU_PROJECT_ID || process.env.NORTHFLANK_PROJECT_ID || 'elevate-platform';
const EXPECTED_REGION = process.env.NORTHFLANK_GPU_REGION || 'us-east1';
const SERVICE_ID = process.env.NORTHFLANK_GPU_SERVICE_ID || 'elevate-gpu-worker';
const ADMIN_SERVICE_ID = process.env.NORTHFLANK_ADMIN_SERVICE_ID || 'elevate-admin';
const MODEL_VOLUME_ID = process.env.NORTHFLANK_GPU_MODEL_VOLUME_ID || 'elevate-gpu-models';
const MODEL_VOLUME_MB = Number(process.env.NORTHFLANK_GPU_MODEL_VOLUME_MB || '153600');
const GPU_COUNT = Number(process.env.NORTHFLANK_GPU_COUNT || '1');
const RUNTIME_PORT = 8080;
const REPO = 'https://github.com/elevate-for-humanity/Elevate-lms';
const DOCKERFILE = '/services/media-gpu-worker/Dockerfile';
const BUILD_TIMEOUT_MS = Number(process.env.GPU_PROVISION_BUILD_TIMEOUT_MS || 60 * 60 * 1000);
const READY_TIMEOUT_MS = Number(process.env.GPU_PROVISION_READY_TIMEOUT_MS || 90 * 60 * 1000);
const ACCEPTANCE_TIMEOUT_MS = Number(process.env.GPU_PROVISION_ACCEPTANCE_TIMEOUT_MS || 30 * 60 * 1000);

type R = Record<string, any>;
type Plans = { deploymentPlan: string; buildPlan: string };
type GpuDevice = {
  id: string;
  name?: string;
  memoryInfo?: { sizeInMiB?: number };
  countOptions?: number[];
  pricing?: { onDemand?: number };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const log = (message: string, detail?: unknown) =>
  detail === undefined ? console.log(`[gpu-provision] ${message}`) : console.log(`[gpu-provision] ${message}`, detail);

function arrayFrom(value: unknown, key?: string): R[] {
  if (Array.isArray(value)) return value as R[];
  const obj = value as R | null;
  if (key && Array.isArray(obj?.[key])) return obj[key] as R[];
  if (key && Array.isArray(obj?.data?.[key])) return obj.data[key] as R[];
  if (Array.isArray(obj?.data)) return obj.data as R[];
  return [];
}

async function projectDetails(): Promise<R> {
  const project = await nfFetch<R>(`/projects/${PROJECT_ID}`);
  const region = project.deployment?.region || project.region;
  if (region !== EXPECTED_REGION) {
    throw new Error(`GPU project ${PROJECT_ID} is in ${region || 'unknown'}; expected ${EXPECTED_REGION}`);
  }
  return project;
}

async function discoverL4(): Promise<GpuDevice> {
  const response = await nfFetch<R>('/regions');
  const regions = arrayFrom(response, 'regions');
  const region = regions.find((item) => item.id === EXPECTED_REGION);
  if (!region) throw new Error(`Northflank region ${EXPECTED_REGION} is not exposed to this account`);

  const devices = Array.isArray(region.gpuDevices) ? (region.gpuDevices as GpuDevice[]) : [];
  const l4 = devices
    .filter((gpu) => /(^|\s|-)l4($|\s|-)/i.test(`${gpu.id} ${gpu.name || ''}`))
    .filter((gpu) => Number(gpu.memoryInfo?.sizeInMiB || 0) >= 24 * 1024)
    .sort((a, b) => Number(a.pricing?.onDemand || Infinity) - Number(b.pricing?.onDemand || Infinity))[0];

  if (!l4) {
    throw new Error(
      `No NVIDIA L4 >=24GB is exposed in ${EXPECTED_REGION}. Northflank managed GPU deployment requires a GPU-enabled project and at least $50 account credit.`,
    );
  }
  if (Array.isArray(l4.countOptions) && !l4.countOptions.includes(GPU_COUNT)) {
    throw new Error(`GPU ${l4.id} does not allow gpuCount=${GPU_COUNT}`);
  }
  log('L4 GPU discovered', {
    id: l4.id,
    name: l4.name,
    memoryMiB: l4.memoryInfo?.sizeInMiB,
    onDemand: l4.pricing?.onDemand,
  });
  return l4;
}

async function resolvePlans(gpu: GpuDevice): Promise<Plans> {
  const response = await nfFetch<R>('/plans');
  const plans = arrayFrom(response, 'plans');

  // Northflank managed GPU workloads require a dedicated GPU deployment plan;
  // ordinary nf-compute-* plans are rejected even when deployment.gpu is set.
  // The managed-cloud plan convention is nf-gpu-<gpuType>-<count>g.
  const derivedGpuPlan = `nf-gpu-${gpu.id}-${GPU_COUNT}g`;
  const requestedGpuPlan = process.env.NORTHFLANK_GPU_DEPLOYMENT_PLAN?.trim() || derivedGpuPlan;

  // If the account catalog exposes GPU plans, validate the requested plan. Some
  // accounts currently omit managed GPU plans from /plans even though /regions
  // exposes the GPU entitlement, so absence from the catalog is not fatal.
  const gpuPlans = plans.filter(
    (p) => typeof p.id === 'string' && (p.id.startsWith('nf-gpu-') || p.configuration?.resources?.gpu),
  );
  if (gpuPlans.length && !gpuPlans.some((p) => p.id === requestedGpuPlan)) {
    const compatible = gpuPlans.find((p) => String(p.id).includes(gpu.id));
    if (!compatible?.id) {
      throw new Error(
        `Northflank exposes GPU plans but none match ${gpu.id}. Available: ${gpuPlans.map((p) => p.id).join(', ')}`,
      );
    }
    log('Requested GPU plan not listed; using compatible account GPU plan', {
      requested: requestedGpuPlan,
      selected: compatible.id,
    });
    const build = plans
      .filter((p) => Array.isArray(p.type) && p.type.includes('build'))
      .filter((p) => Number(p.cpuResource) >= 4)
      .sort((a, b) => Number(a.amountPerHour || 0) - Number(b.amountPerHour || 0))[0];
    if (!build?.id) throw new Error('No valid Northflank build plan is available');
    return { deploymentPlan: compatible.id, buildPlan: build.id };
  }

  const build = plans
    .filter((p) => Array.isArray(p.type) && p.type.includes('build'))
    .filter((p) => Number(p.cpuResource) >= 4)
    .sort((a, b) => Number(a.amountPerHour || 0) - Number(b.amountPerHour || 0))[0];
  if (!build?.id) throw new Error('No valid Northflank build plan is available');

  log('GPU/build plans selected', {
    deploymentPlan: requestedGpuPlan,
    buildPlan: build.id,
  });
  return { deploymentPlan: requestedGpuPlan, buildPlan: build.id };
}

async function ensureModelVolume(): Promise<string> {
  try {
    const existing = await nfFetch<R>(projectApiPath(PROJECT_ID, `/volumes/${MODEL_VOLUME_ID}`));
    const size = Number(existing.spec?.storageSize || 0);
    if (size < MODEL_VOLUME_MB) {
      await nfFetch(projectApiPath(PROJECT_ID, `/volumes/${MODEL_VOLUME_ID}`), {
        method: 'POST',
        body: JSON.stringify({
          mounts: [{ volumeMountPath: '', containerMountPath: '/models' }],
          spec: { storageSize: MODEL_VOLUME_MB },
        }),
      });
      log('Expanded model volume', { id: MODEL_VOLUME_ID, storageSize: MODEL_VOLUME_MB });
    } else {
      log('Using existing model volume', { id: MODEL_VOLUME_ID, storageSize: size });
    }
    return MODEL_VOLUME_ID;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes('404') && !message.toLowerCase().includes('not found')) throw error;
  }

  const created = await nfFetch<R>(projectApiPath(PROJECT_ID, '/volumes'), {
    method: 'POST',
    body: JSON.stringify({
      name: 'Elevate GPU Models',
      mounts: [{ volumeMountPath: '', containerMountPath: '/models' }],
      spec: { storageClassName: 'ssd', storageSize: MODEL_VOLUME_MB },
    }),
  });
  const id = created.id || MODEL_VOLUME_ID;
  log('Created persistent model volume', { id, storageSize: MODEL_VOLUME_MB });
  return id;
}

async function serviceExists(): Promise<boolean> {
  try {
    await nfFetch(projectApiPath(PROJECT_ID, `/services/${SERVICE_ID}`));
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('404') || message.toLowerCase().includes('not found')) return false;
    throw error;
  }
}

function runtimeEnvironment(): Record<string, string> {
  return {
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
    HF_HOME: '/models/huggingface',
    GPU_OUTPUT_DIR: '/data/output',
  };
}

function servicePayload(plans: Plans, gpu: GpuDevice, volumeId: string): R {
  const gpuConfig = {
    enabled: true,
    configuration: { gpuType: gpu.id, gpuCount: GPU_COUNT, timesliced: false },
  };
  return {
    name: 'Elevate GPU Worker',
    description: 'Self-hosted Wan GPU video inference for Elevate Course Factory',
    billing: {
      deploymentPlan: plans.deploymentPlan,
      buildPlan: plans.buildPlan,
      gpu: gpuConfig,
    },
    infrastructure: { architecture: 'x86' },
    buildSource: 'git',
    disabledCI: true,
    vcsData: {
      projectUrl: REPO,
      projectType: 'github',
      projectBranch: 'main',
    },
    buildSettings: {
      storage: { ephemeralStorage: { storageSize: 32768 } },
      dockerfile: {
        buildEngine: 'buildkit',
        dockerFilePath: DOCKERFILE,
        dockerWorkDir: '/',
        buildkit: { useCache: true, cacheStorageSize: 16384 },
      },
    },
    buildConfiguration: {
      storage: { ephemeralStorage: { storageSize: 32768 } },
      ciIgnoreFlagsEnabled: true,
      ciIgnoreFlags: ['[skip ci]', '[ci skip]', '[northflank skip]', '[skip northflank]'],
    },
    deployment: {
      type: 'deployment',
      instances: 1,
      docker: { configType: 'default' },
      gpu: gpuConfig,
      storage: {
        shmSize: 16384,
        ephemeralStorage: { storageSize: 32768 },
      },
      strategy: { type: 'recreate' },
      gracePeriodSeconds: 180,
    },
    createOptions: { volumesToAttach: [volumeId] },
    ports: [{ name: 'gpu', internalPort: RUNTIME_PORT, protocol: 'HTTP', public: true }],
    runtimeEnvironment: runtimeEnvironment(),
    healthChecks: [
      {
        protocol: 'HTTP',
        type: 'startupProbe',
        path: '/health',
        port: RUNTIME_PORT,
        initialDelaySeconds: 20,
        periodSeconds: 15,
        timeoutSeconds: 5,
        failureThreshold: 40,
      },
      {
        protocol: 'HTTP',
        type: 'livenessProbe',
        path: '/health',
        port: RUNTIME_PORT,
        initialDelaySeconds: 60,
        periodSeconds: 30,
        timeoutSeconds: 5,
        failureThreshold: 5,
      },
    ],
  };
}

async function ensureService(plans: Plans, gpu: GpuDevice, volumeId: string): Promise<void> {
  const exists = await serviceExists();
  const endpoint = projectApiPath(PROJECT_ID, exists ? `/services/combined/${SERVICE_ID}` : '/services/combined');
  await nfFetch(endpoint, {
    method: exists ? 'PATCH' : 'POST',
    body: JSON.stringify(servicePayload(plans, gpu, volumeId)),
  });
  log(`${exists ? 'Updated' : 'Created'} ${SERVICE_ID}`);

  try {
    await nfFetch(projectApiPath(PROJECT_ID, `/volumes/${volumeId}/attach`), {
      method: 'POST',
      body: JSON.stringify({ nfObject: { id: SERVICE_ID, type: 'service' } }),
    });
    log('Model volume attached to GPU service', { volumeId });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/already|attached|conflict/i.test(message)) throw error;
    log('Model volume already attached', { volumeId });
  }
}

async function triggerExactBuild(): Promise<void> {
  const sha = process.env.GITHUB_SHA?.trim();
  const body = sha && /^[0-9a-f]{40}$/i.test(sha) ? { sha } : {};
  const response = await nfFetch<R>(projectApiPath(PROJECT_ID, `/services/${SERVICE_ID}/build`), {
    method: 'POST',
    body: JSON.stringify(body),
  });
  log('Exact GPU build triggered', { sha: response.sha || sha || 'latest', buildId: response.id });
}

function buildStatus(service: R): string | undefined {
  return service.status?.build?.status || service.build?.status || service.buildStatus;
}
function deployStatus(service: R): string | undefined {
  return service.status?.deployment?.status || service.deployment?.status || service.deploymentStatus;
}

async function waitForDeployment(): Promise<R> {
  const deadline = Date.now() + BUILD_TIMEOUT_MS;
  const failures = new Set(['FAILURE', 'FAILED', 'ERROR', 'CRASHED']);
  let previous = '';
  while (Date.now() < deadline) {
    const service = await nfFetch<R>(projectApiPath(PROJECT_ID, `/services/${SERVICE_ID}`));
    const state = `${buildStatus(service) || 'unknown'}/${deployStatus(service) || 'unknown'}`;
    if (state !== previous) {
      log(`GPU service ${state}`);
      previous = state;
    }
    if (failures.has(buildStatus(service) || '') || failures.has(deployStatus(service) || '')) {
      throw new Error(`GPU service failed: ${state}`);
    }
    if (buildStatus(service) === 'SUCCESS' && deployStatus(service) === 'COMPLETED') return service;
    await sleep(15_000);
  }
  throw new Error('Timed out waiting for GPU build/deployment');
}

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((x) => collectStrings(x, out));
  else if (value && typeof value === 'object') Object.values(value as R).forEach((x) => collectStrings(x, out));
  return out;
}

function publicUrl(service: R): string | null {
  for (const candidate of collectStrings(service)) {
    if (/^https?:\/\//i.test(candidate) && !candidate.includes('github.com')) return candidate.replace(/\/$/, '');
    const host = candidate.replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (/^[a-z0-9.-]+\.(code\.run|northflank\.app)$/i.test(host)) return `https://${host}`;
  }
  return null;
}

async function waitForUrl(): Promise<string> {
  const deadline = Date.now() + 10 * 60 * 1000;
  while (Date.now() < deadline) {
    const service = await nfFetch<R>(projectApiPath(PROJECT_ID, `/services/${SERVICE_ID}`));
    const url = publicUrl(service);
    if (url) return url;
    await sleep(10_000);
  }
  throw new Error('GPU service has no discoverable public endpoint');
}

async function upsertSecretGroup(id: string, description: string, serviceIds: string[], vars: Record<string, string>) {
  const payload = {
    name: id,
    description,
    priority: 20,
    type: 'secret',
    secretType: 'environment',
    restrictions: {
      restricted: true,
      nfObjects: serviceIds.map((serviceId) => ({ id: serviceId, type: 'service' })),
      tagMatchCondition: 'or',
    },
    secrets: { variables: vars },
  };
  try {
    await nfFetch(projectApiPath(PROJECT_ID, `/secrets/${id}`));
    await nfFetch(projectApiPath(PROJECT_ID, `/secrets/${id}`), { method: 'POST', body: JSON.stringify(payload) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes('404') && !message.toLowerCase().includes('not found')) throw error;
    await nfFetch(projectApiPath(PROJECT_ID, '/secrets'), { method: 'POST', body: JSON.stringify(payload) });
  }
}

async function wireSecrets(workerUrl: string, workerSecret: string): Promise<void> {
  await upsertSecretGroup('elevate-gpu-worker-env', 'GPU worker authentication', [SERVICE_ID], {
    GPU_WORKER_SECRET: workerSecret,
  });
  await upsertSecretGroup('elevate-gpu-client-env', 'Admin GPU client configuration', [ADMIN_SERVICE_ID], {
    GPU_VIDEO_WORKER_URL: `http://${SERVICE_ID}:${RUNTIME_PORT}`,
    GPU_VIDEO_PUBLIC_ACCEPTANCE_URL: workerUrl,
    GPU_WORKER_SECRET: workerSecret,
    GPU_VIDEO_PROVIDER: 'wan',
  });
  log('Worker/Admin GPU secrets wired');
}

async function restart(serviceId: string) {
  await nfFetch(projectApiPath(PROJECT_ID, `/services/${serviceId}/restart`), {
    method: 'POST',
    body: JSON.stringify({}),
  });
  log(`Restart requested: ${serviceId}`);
}

async function waitForReady(url: string, secret: string): Promise<void> {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  let previous = '';
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${url}/ready`, {
        headers: { authorization: `Bearer ${secret}` },
        signal: AbortSignal.timeout(10_000),
      });
      const body = (await response.json()) as R;
      const summary = JSON.stringify({
        ready: body.ready,
        gpu: body.gpu,
        vramBytes: body.vramBytes,
        wanInstalled: body.wanInstalled,
        wanModelReady: body.wanModelReady,
        bootstrap: body.bootstrap?.state,
      });
      if (summary !== previous) {
        log(`Readiness ${summary}`);
        previous = summary;
      }
      if (response.ok && body.ready === true) return;
      if (body.bootstrap?.state === 'failed') throw new Error(body.bootstrap?.detail || 'model bootstrap failed');
    } catch (error) {
      log(`Waiting for readiness: ${error instanceof Error ? error.message : String(error)}`);
    }
    await sleep(20_000);
  }
  throw new Error('Timed out waiting for CUDA/Wan readiness');
}

async function runAcceptance(url: string, secret: string): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ACCEPTANCE_TIMEOUT_MS);
  try {
    const response = await fetch(`${url}/v1/video/generate`, {
      method: 'POST',
      headers: { authorization: `Bearer ${secret}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        provider: 'wan',
        prompt: 'Professional educational cinematic scene of a small business owner reviewing a business plan at a clean desk, natural lighting, realistic motion, no text overlays',
        width: 1280,
        height: 704,
        duration_seconds: 5,
        seed: 42,
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Wan acceptance failed ${response.status}: ${(await response.text()).slice(0, 800)}`);
    const generated = (await response.json()) as R;
    if (!generated.jobId || !generated.assetPath) throw new Error('Wan acceptance returned no assetPath');

    const asset = await fetch(`${url}${generated.assetPath}`, {
      headers: { authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(120_000),
    });
    if (!asset.ok) throw new Error(`Wan asset download failed ${asset.status}`);
    const type = asset.headers.get('content-type') || '';
    const bytes = Buffer.from(await asset.arrayBuffer());
    if (!type.startsWith('video/mp4') || bytes.length < 50_000) {
      throw new Error(`Invalid acceptance MP4: ${type}, ${bytes.length} bytes`);
    }
    log('Real Wan MP4 acceptance passed', { bytes: bytes.length });
    await fetch(`${url}${generated.assetPath}`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(10_000),
    }).catch(() => undefined);
  } finally {
    clearTimeout(timeout);
  }
}

async function waitAdminHealth(): Promise<void> {
  for (let attempt = 1; attempt <= 36; attempt++) {
    try {
      const response = await fetch('https://admin.elevateforhumanity.org/api/health', {
        signal: AbortSignal.timeout(10_000),
      });
      if (response.ok) return;
    } catch {}
    await sleep(10_000);
  }
  throw new Error('Admin did not recover after GPU client wiring');
}

async function main() {
  const execute = process.argv.includes('--execute');
  if (!execute) {
    console.log('DRY RUN: pass --execute to provision and certify the GPU worker.');
    console.log({ project: PROJECT_ID, region: EXPECTED_REGION, service: SERVICE_ID, volume: MODEL_VOLUME_ID, volumeMb: MODEL_VOLUME_MB });
    return;
  }

  await projectDetails();
  const gpu = await discoverL4();
  const plans = await resolvePlans(gpu);
  const volumeId = await ensureModelVolume();
  await ensureService(plans, gpu, volumeId);
  await triggerExactBuild();
  const service = await waitForDeployment();
  const url = publicUrl(service) || (await waitForUrl());
  log(`Public GPU endpoint: ${url}`);

  const secret = crypto.randomBytes(32).toString('hex');
  console.log(`::add-mask::${secret}`);
  await wireSecrets(url, secret);
  await restart(SERVICE_ID);
  await restart(ADMIN_SERVICE_ID);
  await waitForReady(url, secret);
  await waitAdminHealth();
  await runAcceptance(url, secret);
  log('GPU MEDIA ACCEPTANCE PASSED');
}

main().catch((error) => {
  console.error('[gpu-provision] FAILED', error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
