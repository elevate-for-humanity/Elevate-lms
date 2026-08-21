#!/usr/bin/env tsx
/**
 * Provision and certify the dedicated Elevate GPU media service on Northflank.
 *
 * This is intentionally separate from elevate-platform. The existing Marketing,
 * LMS and Admin services remain CPU-only. Admin receives only the worker URL and
 * a shared bearer secret through a dedicated restricted secret group.
 */
import crypto from 'node:crypto';
import { nfFetch, projectApiPath } from './lib';

const WEB_PROJECT_ID = process.env.NORTHFLANK_PROJECT_ID || 'elevate-platform';
const ADMIN_SERVICE_ID = process.env.NORTHFLANK_ADMIN_SERVICE_ID || 'elevate-admin';
const GPU_PROJECT_NAME = process.env.NORTHFLANK_GPU_PROJECT_NAME || 'Elevate Media GPU';
const GPU_PROJECT_REGION = process.env.NORTHFLANK_GPU_REGION || 'us-central';
const GPU_SERVICE_ID = process.env.NORTHFLANK_GPU_SERVICE_ID || 'elevate-media-gpu-worker';
const GPU_SERVICE_NAME = process.env.NORTHFLANK_GPU_SERVICE_NAME || 'Elevate Media GPU Worker';
const GPU_TYPE = process.env.NORTHFLANK_GPU_TYPE || 'l4';
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(message: string, detail?: unknown) {
  if (detail === undefined) console.log(`[gpu-provision] ${message}`);
  else console.log(`[gpu-provision] ${message}`, detail);
}

async function listProjects(): Promise<AnyRecord[]> {
  const response = await nfFetch<AnyRecord>('/projects');
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.projects)) return response.projects;
  if (Array.isArray(response.data?.projects)) return response.data.projects;
  return [];
}

async function ensureGpuProject(): Promise<string> {
  const projects = await listProjects();
  const existing = projects.find(
    (project) => project.name === GPU_PROJECT_NAME || project.id === 'elevate-media-gpu',
  );
  if (existing?.id) {
    const details = await nfFetch<AnyRecord>(`/projects/${existing.id}`);
    const region = details.deployment?.region || details.region;
    if (region && region !== GPU_PROJECT_REGION) {
      throw new Error(
        `Existing GPU project ${existing.id} is in ${region}, expected ${GPU_PROJECT_REGION}`,
      );
    }
    log(`Using GPU project ${existing.id} (${region || GPU_PROJECT_REGION})`);
    return existing.id;
  }

  log(`Creating GPU-enabled project in ${GPU_PROJECT_REGION}`);
  const created = await nfFetch<AnyRecord>('/projects', {
    method: 'POST',
    body: JSON.stringify({
      name: GPU_PROJECT_NAME,
      description: 'Dedicated NVIDIA GPU inference for Elevate course video generation',
      color: '#2563EB',
      region: GPU_PROJECT_REGION,
    }),
  });
  if (!created?.id) throw new Error('Northflank project creation returned no project id');
  log(`Created GPU project ${created.id}`);
  return created.id;
}

async function resolveComputePlans(projectId: string) {
  const response = await nfFetch<AnyRecord>(projectApiPath(projectId, '/plans'));
  const plans: AnyRecord[] = response.plans || response.data?.plans || [];
  const deploymentCandidates = plans
    .filter((plan) => Array.isArray(plan.type) && plan.type.includes('deployment'))
    .sort((a, b) => Number(a.amountPerHour || 0) - Number(b.amountPerHour || 0));

  const preferredDeployment = deploymentCandidates.find(
    (plan) => Number(plan.cpuResource) >= 8 && Number(plan.ramResource) >= 32768,
  ) || deploymentCandidates.find(
    (plan) => Number(plan.cpuResource) >= 4 && Number(plan.ramResource) >= 16384,
  );
  if (!preferredDeployment?.id) {
    throw new Error('No suitable Northflank deployment compute plan (>=4 vCPU / 16GB RAM) is available');
  }

  const buildCandidates = plans
    .filter((plan) => Array.isArray(plan.type) && plan.type.includes('build'))
    .sort((a, b) => Number(a.amountPerHour || 0) - Number(b.amountPerHour || 0));
  const preferredBuild = buildCandidates.find((plan) => Number(plan.cpuResource) >= 4) || {
    id: 'nf-compute-400-16',
  };
  return { deploymentPlan: preferredDeployment.id, buildPlan: preferredBuild.id };
}

async function serviceExists(projectId: string, serviceId: string): Promise<boolean> {
  try {
    await nfFetch(projectApiPath(projectId, `/services/${serviceId}`));
    return true;
  } catch {
    return false;
  }
}

function gpuServicePayload(plans: { deploymentPlan: string; buildPlan: string }) {
  const gpu = {
    enabled: true,
    configuration: { gpuType: GPU_TYPE, gpuCount: GPU_COUNT, timesliced: false },
  };
  return {
    name: GPU_SERVICE_NAME,
    description: 'Self-hosted Wan and LTX generative video inference worker',
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
    vcsData: {
      projectUrl: REPO,
      projectType: 'github',
      projectBranch: process.env.NORTHFLANK_GIT_BRANCH || 'main',
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
      isAllowList: true,
      pathIgnoreRules: [
        'services/media-gpu-worker/**',
        'scripts/northflank/provision-gpu-media.ts',
        '.github/workflows/provision-gpu-media.yml',
      ],
      ciIgnoreFlagsEnabled: true,
      ciIgnoreFlags: ['[skip ci]', '[ci skip]', '[northflank skip]', '[skip northflank]'],
      storage: { ephemeralStorage: { storageSize: 32768 } },
    },
    runtimeEnvironment: {
      SERVICE_ROLE: 'media-gpu-worker',
      PORT: String(RUNTIME_PORT),
      GPU_VIDEO_PROVIDER: 'wan',
      GPU_MAX_CONCURRENCY: '1',
      GPU_JOB_TIMEOUT_SECONDS: '1800',
      GPU_ASSET_TTL_SECONDS: '7200',
      WAN_MIN_VRAM_GB: '22',
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
    },
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

async function ensureGpuService(projectId: string) {
  const plans = await resolveComputePlans(projectId);
  const payload = gpuServicePayload(plans);
  const exists = await serviceExists(projectId, GPU_SERVICE_ID);
  log(`${exists ? 'Updating' : 'Creating'} GPU service ${GPU_SERVICE_ID}`, {
    deploymentPlan: plans.deploymentPlan,
    buildPlan: plans.buildPlan,
    gpu: `${GPU_TYPE} x${GPU_COUNT}`,
    modelVolumeMb: MODEL_VOLUME_MB,
  });
  if (exists) {
    await nfFetch(projectApiPath(projectId, `/services/combined/${GPU_SERVICE_ID}`), {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  } else {
    await nfFetch(projectApiPath(projectId, '/services/combined'), {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

async function forceBuild(projectId: string): Promise<void> {
  try {
    const result = await nfFetch<AnyRecord>(
      projectApiPath(projectId, `/services/${GPU_SERVICE_ID}/build`),
      {
        method: 'POST',
        body: JSON.stringify({ branch: process.env.NORTHFLANK_GIT_BRANCH || 'main' }),
      },
    );
    log(`GPU build triggered${result?.id ? `: ${result.id}` : ''}`);
  } catch (error) {
    log(`Explicit build trigger not required/accepted: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function readBuildStatus(service: AnyRecord): string | undefined {
  return service.status?.build?.status || service.build?.status || service.buildStatus;
}

function readDeploymentStatus(service: AnyRecord): string | undefined {
  return service.status?.deployment?.status || service.deployment?.status || service.deploymentStatus;
}

async function waitForDeployment(projectId: string) {
  const deadline = Date.now() + BUILD_TIMEOUT_MS;
  let last = '';
  while (Date.now() < deadline) {
    const service = await nfFetch<AnyRecord>(projectApiPath(projectId, `/services/${GPU_SERVICE_ID}`));
    const build = readBuildStatus(service);
    const deployment = readDeploymentStatus(service);
    const summary = `${build || 'unknown'}/${deployment || 'unknown'}`;
    if (summary !== last) {
      log(`Northflank GPU service status ${summary}`);
      last = summary;
    }
    if (build === 'FAILURE' || build === 'CRASHED' || deployment === 'FAILED') {
      throw new Error(`GPU service failed: build=${build}, deployment=${deployment}`);
    }
    if (build === 'SUCCESS' && deployment === 'COMPLETED') return service;
    await sleep(15_000);
  }
  throw new Error('Timed out waiting for GPU build/deployment');
}

function collectStrings(value: unknown, output: string[] = []): string[] {
  if (typeof value === 'string') {
    output.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, output);
  } else if (value && typeof value === 'object') {
    for (const child of Object.values(value as AnyRecord)) collectStrings(child, output);
  }
  return output;
}

function discoverPublicUrl(service: AnyRecord): string | null {
  const directCandidates = [service.url, service.publicUrl, service.publicURL];
  for (const candidate of directCandidates) {
    if (typeof candidate === 'string' && /^https?:\/\//.test(candidate)) return candidate.replace(/\/$/, '');
  }
  const strings = collectStrings(service);
  for (const value of strings) {
    if (/^https?:\/\//.test(value) && !value.includes('github.com')) return value.replace(/\/$/, '');
  }
  for (const value of strings) {
    const host = value.replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (/^[a-z0-9.-]+\.(code\.run|northflank\.app|northflank\.com)$/i.test(host)) {
      return `https://${host}`;
    }
  }
  return null;
}

async function waitForPublicUrl(projectId: string): Promise<string> {
  const deadline = Date.now() + 10 * 60 * 1000;
  while (Date.now() < deadline) {
    const service = await nfFetch<AnyRecord>(projectApiPath(projectId, `/services/${GPU_SERVICE_ID}`));
    const url = discoverPublicUrl(service);
    if (url) return url;
    await sleep(10_000);
  }
  throw new Error('GPU service deployed but no public service URL was discoverable');
}

async function upsertSecretGroup(
  projectId: string,
  groupId: string,
  description: string,
  serviceIds: string[],
  variables: Record<string, string>,
) {
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
    await nfFetch(projectApiPath(projectId, `/secrets/${groupId}`));
    await nfFetch(projectApiPath(projectId, `/secrets/${groupId}`), {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch {
    await nfFetch(projectApiPath(projectId, '/secrets'), {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

async function wireSecrets(gpuProjectId: string, workerUrl: string, workerSecret: string) {
  await upsertSecretGroup(
    gpuProjectId,
    'elevate-gpu-worker-env',
    'GPU worker authentication only',
    [GPU_SERVICE_ID],
    { GPU_WORKER_SECRET: workerSecret },
  );
  await upsertSecretGroup(
    WEB_PROJECT_ID,
    'elevate-gpu-client-env',
    'Admin access to the dedicated GPU inference service',
    [ADMIN_SERVICE_ID],
    {
      GPU_VIDEO_WORKER_URL: workerUrl,
      GPU_WORKER_SECRET: workerSecret,
      GPU_VIDEO_PROVIDER: 'wan',
    },
  );
  log('GPU worker and Admin secret groups synchronized');
}

async function waitForReady(url: string, secret: string) {
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

async function acceptanceGenerate(url: string, secret: string) {
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
      webProject: WEB_PROJECT_ID,
      gpuProject: GPU_PROJECT_NAME,
      region: GPU_PROJECT_REGION,
      service: GPU_SERVICE_ID,
      gpu: `${GPU_TYPE} x${GPU_COUNT}`,
      modelVolumeMb: MODEL_VOLUME_MB,
      dockerfile: DOCKERFILE,
      wanRef: WAN_GIT_REF,
    });
    return;
  }

  const gpuProjectId = await ensureGpuProject();
  await ensureGpuService(gpuProjectId);
  await forceBuild(gpuProjectId);
  const service = await waitForDeployment(gpuProjectId);
  const workerUrl = discoverPublicUrl(service) || (await waitForPublicUrl(gpuProjectId));
  log(`GPU service endpoint discovered: ${workerUrl}`);

  const workerSecret = crypto.randomBytes(32).toString('hex');
  console.log(`::add-mask::${workerSecret}`);
  await wireSecrets(gpuProjectId, workerUrl, workerSecret);

  // Secret changes require a replacement workload in order to enter the worker
  // process environment. A patch to the runtime environment triggers a restart
  // without changing the model volume.
  await nfFetch(projectApiPath(gpuProjectId, `/services/combined/${GPU_SERVICE_ID}`), {
    method: 'PATCH',
    body: JSON.stringify({ runtimeEnvironment: gpuServicePayload(await resolveComputePlans(gpuProjectId)).runtimeEnvironment }),
  });

  await waitForReady(workerUrl, workerSecret);
  await acceptanceGenerate(workerUrl, workerSecret);

  log('GPU MEDIA ACCEPTANCE PASSED');
  log(`Project=${gpuProjectId} Service=${GPU_SERVICE_ID} Provider=wan GPU=${GPU_TYPE}`);
}

main().catch((error) => {
  console.error('[gpu-provision] FAILED', error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
