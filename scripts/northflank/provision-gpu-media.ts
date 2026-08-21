#!/usr/bin/env tsx
/**
 * Canonical Northflank GPU media provisioner.
 *
 * Owns the complete infrastructure acceptance path for the self-hosted Elevate
 * video generator without modifying Marketing/LMS compute resources:
 *   validate region/GPU -> create/update L4 worker -> exact-SHA build ->
 *   persistent model volume -> restricted auth secrets -> worker restart ->
 *   CUDA/model readiness -> real Wan MP4 generation.
 */
import crypto from 'node:crypto';
import { nfFetch, projectApiPath } from './lib';

const PROJECT_ID = process.env.NORTHFLANK_GPU_PROJECT_ID || process.env.NORTHFLANK_PROJECT_ID || 'elevate-platform';
const EXPECTED_REGION = process.env.NORTHFLANK_GPU_REGION || 'us-east1';
const ADMIN_SERVICE_ID = process.env.NORTHFLANK_ADMIN_SERVICE_ID || 'elevate-admin';
const GPU_SERVICE_ID = process.env.NORTHFLANK_GPU_SERVICE_ID || 'elevate-media-gpu-worker';
const GPU_SERVICE_NAME = process.env.NORTHFLANK_GPU_SERVICE_NAME || 'Elevate Media GPU Worker';
const GPU_TYPE = process.env.NORTHFLANK_GPU_TYPE || 'l4-24';
const GPU_COUNT = Number(process.env.NORTHFLANK_GPU_COUNT || '1');
const MODEL_VOLUME_MB = Number(process.env.NORTHFLANK_GPU_MODEL_VOLUME_MB || '153600');
const RUNTIME_PORT = 8080;
const REPO = 'https://github.com/elevate-for-humanity/Elevate-lms';
const DOCKERFILE = '/services/media-gpu-worker/Dockerfile';
const WAN_GIT_REF = '42bf4cfaa384bc21833865abc2f9e6c0e67233dc';
const BUILD_TIMEOUT_MS = Number(process.env.GPU_PROVISION_BUILD_TIMEOUT_MS || 45 * 60 * 1000);
const READY_TIMEOUT_MS = Number(process.env.GPU_PROVISION_READY_TIMEOUT_MS || 75 * 60 * 1000);
const ACCEPTANCE_TIMEOUT_MS = Number(process.env.GPU_PROVISION_ACCEPTANCE_TIMEOUT_MS || 25 * 60 * 1000);

type AnyRecord = Record<string, any>;

type Plans = {
  deploymentPlan: string;
  buildPlan: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(message: string, detail?: unknown) {
  if (detail === undefined) console.log(`[gpu-provision] ${message}`);
  else console.log(`[gpu-provision] ${message}`, detail);
}

function arrayFrom<T = AnyRecord>(value: unknown, key: string): T[] {
  if (Array.isArray(value)) return value as T[];
  const object = value as AnyRecord | null;
  if (Array.isArray(object?.[key])) return object[key] as T[];
  if (Array.isArray(object?.data?.[key])) return object.data[key] as T[];
  return [];
}

async function validateProjectAndGpu(): Promise<void> {
  const project = await nfFetch<AnyRecord>(`/projects/${PROJECT_ID}`);
  const region = project.deployment?.region || project.region;
  if (!region) throw new Error(`Northflank project ${PROJECT_ID} did not report a region`);
  if (region !== EXPECTED_REGION) {
    throw new Error(`Northflank project ${PROJECT_ID} is in ${region}; expected ${EXPECTED_REGION}`);
  }

  const regionResponse = await nfFetch<AnyRecord>('/regions');
  const regions = arrayFrom(regionResponse, 'regions');
  const selected = regions.find((entry) => entry.id === region);
  if (!selected) throw new Error(`Northflank region ${region} is not available to this account`);
  const gpu = (selected.gpuDevices || []).find((entry: AnyRecord) => entry.id === GPU_TYPE);
  if (!gpu) {
    throw new Error(
      `GPU ${GPU_TYPE} is not exposed in ${region}. Northflank GPU access may require account credit/entitlement.`,
    );
  }
  if (!Array.isArray(gpu.countOptions) || !gpu.countOptions.includes(GPU_COUNT)) {
    throw new Error(`GPU ${GPU_TYPE} does not support gpuCount=${GPU_COUNT} in ${region}`);
  }
  const memoryMiB = Number(gpu.memoryInfo?.sizeInMiB || 0);
  if (memoryMiB < 22 * 1024) {
    throw new Error(`GPU ${GPU_TYPE} exposes only ${memoryMiB} MiB VRAM; Wan baseline requires >=22 GiB`);
  }
  log(`Validated ${GPU_TYPE} x${GPU_COUNT} in ${region}`, {
    memoryMiB,
    onDemand: gpu.pricing?.onDemand,
  });
}

async function resolveComputePlans(): Promise<Plans> {
  // Northflank's compute catalog is account-scoped, not /projects/{id}/plans.
  const response = await nfFetch<AnyRecord>('/plans');
  const plans = arrayFrom(response, 'plans');
  const deploymentCandidates = plans
    .filter((plan) => Array.isArray(plan.type) && plan.type.includes('deployment'))
    .sort((a, b) => Number(a.amountPerHour || 0) - Number(b.amountPerHour || 0));

  // Wan TI2V offloads text/model components to host RAM on the 24GB L4. Prefer
  // 8 vCPU / 32GB for reliable first-pass acceptance, with a 4/16 floor only as
  // a fallback if the account catalog changes.
  const preferredDeployment =
    deploymentCandidates.find(
      (plan) => Number(plan.cpuResource) >= 8 && Number(plan.ramResource) >= 32768,
    ) ||
    deploymentCandidates.find(
      (plan) => Number(plan.cpuResource) >= 4 && Number(plan.ramResource) >= 16384,
    );
  if (!preferredDeployment?.id) {
    throw new Error('No Northflank deployment plan with at least 4 vCPU / 16GB RAM is available');
  }

  const buildCandidates = plans
    .filter((plan) => Array.isArray(plan.type) && plan.type.includes('build'))
    .sort((a, b) => Number(a.amountPerHour || 0) - Number(b.amountPerHour || 0));
  const preferredBuild =
    buildCandidates.find((plan) => Number(plan.cpuResource) >= 4 && Number(plan.ramResource) >= 16384) ||
    buildCandidates.find((plan) => Number(plan.cpuResource) >= 4);
  if (!preferredBuild?.id) throw new Error('No valid Northflank build plan is available');

  log('Resolved GPU host compute plans', {
    deploymentPlan: preferredDeployment.id,
    deploymentCpu: preferredDeployment.cpuResource,
    deploymentRamMb: preferredDeployment.ramResource,
    buildPlan: preferredBuild.id,
  });
  return { deploymentPlan: preferredDeployment.id, buildPlan: preferredBuild.id };
}

async function serviceExists(): Promise<boolean> {
  try {
    await nfFetch(projectApiPath(PROJECT_ID, `/services/${GPU_SERVICE_ID}`));
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('404') || message.includes('Could not find service')) return false;
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
    WAN_GIT_REF,
    HF_HOME: '/models/huggingface',
    GPU_OUTPUT_DIR: '/data/output',
  };
}

function gpuServicePayload(plans: Plans) {
  const gpu = {
    enabled: true,
    configuration: { gpuType: GPU_TYPE, gpuCount: GPU_COUNT, timesliced: false },
  };
  return {
    name: GPU_SERVICE_NAME,
    description: 'Self-hosted Wan generative video inference worker for Elevate Course Factory',
    billing: {
      deploymentPlan: plans.deploymentPlan,
      buildPlan: plans.buildPlan,
      gpu,
    },
    infrastructure: { architecture: 'x86' },
    deployment: {
      type: 'deployment',
      instances: 1,
      docker: { configType: 'default' },
      gpu,
      storage: {
        shmSize: 16384,
        ephemeralStorage: { storageSize: 32768 },
      },
      volumes: [
        {
          id: 'models',
          mounts: [{ volumeMountPath: '', containerMountPath: '/models' }],
          spec: { storageClassName: 'ssd', storageSize: MODEL_VOLUME_MB },
        },
      ],
      strategy: { type: 'recreate' },
      gracePeriodSeconds: 180,
    },
    ports: [
      {
        name: 'gpu',
        internalPort: RUNTIME_PORT,
        protocol: 'HTTP',
        public: true,
      },
    ],
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
    runtimeEnvironment: runtimeEnvironment(),
    healthChecks: [
      {
        protocol: 'HTTP',
        type: 'startupProbe',
        path: '/health',
        port: RUNTIME_PORT,
        initialDelaySeconds: 15,
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

async function ensureGpuService(plans: Plans): Promise<void> {
  const payload = gpuServicePayload(plans);
  const exists = await serviceExists();
  log(`${exists ? 'Updating' : 'Creating'} GPU service ${GPU_SERVICE_ID}`, {
    deploymentPlan: plans.deploymentPlan,
    buildPlan: plans.buildPlan,
    gpu: `${GPU_TYPE} x${GPU_COUNT}`,
    modelVolumeMb: MODEL_VOLUME_MB,
  });
  await nfFetch(
    projectApiPath(PROJECT_ID, exists ? `/services/combined/${GPU_SERVICE_ID}` : '/services/combined'),
    {
      method: exists ? 'PATCH' : 'POST',
      body: JSON.stringify(payload),
    },
  );
}

async function startExactBuild(): Promise<string | undefined> {
  const sha = process.env.GITHUB_SHA?.trim();
  const body = sha && /^[0-9a-f]{40}$/i.test(sha) ? { sha } : {};
  const result = await nfFetch<AnyRecord>(projectApiPath(PROJECT_ID, `/services/${GPU_SERVICE_ID}/build`), {
    method: 'POST',
    body: JSON.stringify(body),
  });
  log('GPU build triggered', { buildId: result?.id, sha: result?.sha || sha || 'latest' });
  return result?.id;
}

function readBuildStatus(service: AnyRecord): string | undefined {
  return service.status?.build?.status || service.build?.status || service.buildStatus;
}

function readDeploymentStatus(service: AnyRecord): string | undefined {
  return service.status?.deployment?.status || service.deployment?.status || service.deploymentStatus;
}

async function waitForDeployment(): Promise<AnyRecord> {
  const deadline = Date.now() + BUILD_TIMEOUT_MS;
  let last = '';
  const failed = new Set(['FAILURE', 'FAILED', 'CRASHED', 'ERROR']);
  while (Date.now() < deadline) {
    const service = await nfFetch<AnyRecord>(projectApiPath(PROJECT_ID, `/services/${GPU_SERVICE_ID}`));
    const build = readBuildStatus(service);
    const deployment = readDeploymentStatus(service);
    const summary = `${build || 'unknown'}/${deployment || 'unknown'}`;
    if (summary !== last) {
      log(`Northflank GPU service status ${summary}`);
      last = summary;
    }
    if ((build && failed.has(build)) || (deployment && failed.has(deployment))) {
      throw new Error(`GPU service failed: build=${build}, deployment=${deployment}`);
    }
    if (build === 'SUCCESS' && deployment === 'COMPLETED') return service;
    await sleep(15_000);
  }
  throw new Error('Timed out waiting for GPU build/deployment');
}

function collectStrings(value: unknown, output: string[] = []): string[] {
  if (typeof value === 'string') output.push(value);
  else if (Array.isArray(value)) for (const item of value) collectStrings(item, output);
  else if (value && typeof value === 'object') {
    for (const child of Object.values(value as AnyRecord)) collectStrings(child, output);
  }
  return output;
}

function discoverPublicUrl(service: AnyRecord): string | null {
  for (const candidate of [service.url, service.publicUrl, service.publicURL]) {
    if (typeof candidate === 'string' && /^https?:\/\//.test(candidate)) return candidate.replace(/\/$/, '');
  }
  const strings = collectStrings(service);
  for (const value of strings) {
    if (/^https?:\/\//.test(value) && !value.includes('github.com')) return value.replace(/\/$/, '');
  }
  for (const value of strings) {
    const host = value.replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (/^[a-z0-9.-]+\.(code\.run|northflank\.app|northflank\.com)$/i.test(host)) return `https://${host}`;
  }
  return null;
}

async function waitForPublicUrl(): Promise<string> {
  const deadline = Date.now() + 10 * 60 * 1000;
  while (Date.now() < deadline) {
    const service = await nfFetch<AnyRecord>(projectApiPath(PROJECT_ID, `/services/${GPU_SERVICE_ID}`));
    const url = discoverPublicUrl(service);
    if (url) return url;
    await sleep(10_000);
  }
  throw new Error('GPU service deployed but no public service URL was discoverable');
}

async function upsertSecretGroup(
  groupId: string,
  description: string,
  serviceIds: string[],
  variables: Record<string, string>,
): Promise<void> {
  const payload = {
    name: groupId,
    description,
    priority: 20,
    type: 'secret',
    secretType: 'environment',
    restrictions: {
      restricted: true,
      nfObjects: serviceIds.map((id) => ({ id, type: 'service' })),
      tagMatchCondition: 'or',
    },
    secrets: { variables },
  };
  try {
    await nfFetch(projectApiPath(PROJECT_ID, `/secrets/${groupId}`));
    await nfFetch(projectApiPath(PROJECT_ID, `/secrets/${groupId}`), {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes('404') && !message.includes('not found')) throw error;
    await nfFetch(projectApiPath(PROJECT_ID, '/secrets'), {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

async function wireSecrets(publicUrl: string, workerSecret: string): Promise<void> {
  await upsertSecretGroup(
    'elevate-gpu-worker-env',
    'GPU worker authentication only',
    [GPU_SERVICE_ID],
    { GPU_WORKER_SECRET: workerSecret },
  );
  // Admin uses the private service-mesh address; only CI acceptance uses the
  // public endpoint. This keeps normal course traffic inside Northflank.
  const internalUrl = `http://${GPU_SERVICE_ID}:${RUNTIME_PORT}`;
  await upsertSecretGroup(
    'elevate-gpu-client-env',
    'Admin access to the dedicated GPU inference service',
    [ADMIN_SERVICE_ID],
    {
      GPU_VIDEO_WORKER_URL: internalUrl,
      GPU_WORKER_SECRET: workerSecret,
      GPU_VIDEO_PROVIDER: 'wan',
      GPU_VIDEO_PUBLIC_ACCEPTANCE_URL: publicUrl,
    },
  );
  log('GPU worker and Admin secret groups synchronized', { internalUrl });
}

async function restartService(serviceId: string): Promise<void> {
  await nfFetch(projectApiPath(PROJECT_ID, `/services/${serviceId}/restart`), {
    method: 'POST',
    body: JSON.stringify({}),
  });
  log(`Restart requested for ${serviceId}`);
}

async function waitForReady(url: string, secret: string): Promise<AnyRecord> {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  let last = '';
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${url}/ready`, {
        headers: { authorization: `Bearer ${secret}` },
        signal: AbortSignal.timeout(10_000),
      });
      const body = (await response.json()) as AnyRecord;
      const summary = JSON.stringify({
        ready: body.ready,
        gpu: body.gpu,
        vramBytes: body.vramBytes,
        wanInstalled: body.wanInstalled,
        wanModelReady: body.wanModelReady,
        wanVramReady: body.wanVramReady,
        bootstrap: body.bootstrap?.state,
      });
      if (summary !== last) {
        log(`GPU readiness ${summary}`);
        last = summary;
      }
      if (response.ok && body.ready === true) return body;
      if (body.bootstrap?.state === 'failed') {
        throw new Error(`Model bootstrap failed: ${body.bootstrap?.detail || 'unknown error'}`);
      }
    } catch (error) {
      log(`GPU readiness check waiting: ${error instanceof Error ? error.message : String(error)}`);
    }
    await sleep(20_000);
  }
  throw new Error('Timed out waiting for CUDA/Wan model readiness');
}

async function acceptanceGenerate(url: string, secret: string): Promise<void> {
  log('Starting real Wan acceptance render (5 seconds, 720p)');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ACCEPTANCE_TIMEOUT_MS);
  try {
    const response = await fetch(`${url}/v1/video/generate`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${secret}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'wan',
        prompt:
          'Professional educational cinematic scene of a small business owner reviewing a business plan at a clean desk, natural lighting, realistic motion, no text overlays',
        width: 1280,
        height: 704,
        duration_seconds: 5,
        seed: 42,
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Wan acceptance generation failed (${response.status}): ${(await response.text()).slice(0, 1000)}`);
    }
    const generated = (await response.json()) as AnyRecord;
    if (!generated.jobId || !generated.assetPath) throw new Error('Wan acceptance returned no asset');

    const asset = await fetch(`${url}${generated.assetPath}`, {
      headers: { authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(120_000),
    });
    if (!asset.ok) throw new Error(`Wan acceptance asset download failed (${asset.status})`);
    const contentType = asset.headers.get('content-type') || '';
    const bytes = Buffer.from(await asset.arrayBuffer());
    if (!contentType.startsWith('video/mp4') || bytes.length < 50_000) {
      throw new Error(`Wan acceptance produced an invalid MP4 (${contentType}, ${bytes.length} bytes)`);
    }
    log(`Wan acceptance MP4 verified (${bytes.length} bytes)`);

    await fetch(`${url}${generated.assetPath}`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(10_000),
    }).catch(() => undefined);
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const execute = process.argv.includes('--execute');
  if (!execute) {
    console.log('DRY RUN: pass --execute to create/update GPU infrastructure.');
    console.log({
      project: PROJECT_ID,
      region: EXPECTED_REGION,
      service: GPU_SERVICE_ID,
      gpu: `${GPU_TYPE} x${GPU_COUNT}`,
      modelVolumeMb: MODEL_VOLUME_MB,
      dockerfile: DOCKERFILE,
      wanRef: WAN_GIT_REF,
    });
    return;
  }

  await validateProjectAndGpu();
  const plans = await resolveComputePlans();
  await ensureGpuService(plans);
  await startExactBuild();
  const service = await waitForDeployment();
  const workerUrl = discoverPublicUrl(service) || (await waitForPublicUrl());
  log(`GPU service endpoint discovered: ${workerUrl}`);

  const workerSecret = crypto.randomBytes(32).toString('hex');
  console.log(`::add-mask::${workerSecret}`);
  await wireSecrets(workerUrl, workerSecret);
  await restartService(GPU_SERVICE_ID);

  await waitForReady(workerUrl, workerSecret);
  await acceptanceGenerate(workerUrl, workerSecret);

  log('GPU MEDIA ACCEPTANCE PASSED');
  log(`Project=${PROJECT_ID} Service=${GPU_SERVICE_ID} Provider=wan GPU=${GPU_TYPE}`);
}

main().catch((error) => {
  console.error('[gpu-provision] FAILED', error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
