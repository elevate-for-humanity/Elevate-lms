#!/usr/bin/env tsx
/**
 * Idempotently provision the isolated Elevate GPU media project/service.
 *
 * This intentionally does NOT modify Marketing/LMS/Admin compute plans. The
 * expensive GPU is isolated in its own project so web workloads remain CPU-only.
 *
 * Required: NORTHFLANK_API_TOKEN (team-scoped token capable of creating projects)
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import {
  combinedServiceCreatePath,
  combinedServicePatchPath,
  getToken,
  nfFetch,
  projectApiPath,
} from './lib';

const GPU_PROJECT_ID = process.env.NORTHFLANK_GPU_PROJECT_ID || 'elevate-media-gpu';
const GPU_PROJECT_NAME = process.env.NORTHFLANK_GPU_PROJECT_NAME || 'Elevate Media GPU';
const GPU_REGION = process.env.NORTHFLANK_GPU_REGION || 'us-central';
const GPU_SERVICE_ID = process.env.NORTHFLANK_GPU_SERVICE_ID || 'elevate-media-gpu-worker';
const WEB_PROJECT_ID = process.env.NORTHFLANK_WEB_PROJECT_ID || process.env.NORTHFLANK_PROJECT_ID || 'elevate-platform';
const ADMIN_SERVICE_ID = process.env.NORTHFLANK_ADMIN_SERVICE_ID || 'elevate-admin';
const REPO = 'https://github.com/elevate-for-humanity/Elevate-lms';
const DOCKERFILE = '/services/media-gpu-worker/Dockerfile';
const PORT = 8080;
const REQUESTED_GPU_TYPE = process.env.NORTHFLANK_GPU_TYPE?.trim() || '';
const GPU_COUNT = Math.max(1, Number(process.env.NORTHFLANK_GPU_COUNT || '1'));
const GPU_PLAN = process.env.NORTHFLANK_GPU_COMPUTE_PLAN || 'nf-compute-800-32';
const BUILD_PLAN = process.env.NORTHFLANK_GPU_BUILD_PLAN || 'nf-compute-800-32';
const MODEL_VOLUME_ID = process.env.NORTHFLANK_GPU_MODEL_VOLUME_ID || 'elevate-gpu-models';
const MODEL_VOLUME_MB = Math.max(102400, Number(process.env.NORTHFLANK_GPU_MODEL_VOLUME_MB || '153600'));
const STORAGE_CLASS = process.env.NORTHFLANK_GPU_STORAGE_CLASS || 'ssd';
const BRANCH = process.env.NORTHFLANK_GIT_BRANCH || 'main';
const GPU_SECRET_GROUP = process.env.NORTHFLANK_GPU_SECRET_GROUP_ID || 'elevate-media-gpu-env';
const ADMIN_GPU_SECRET_GROUP = process.env.NORTHFLANK_ADMIN_GPU_SECRET_GROUP_ID || 'elevate-gpu-client-env';

interface GpuDevice {
  id: string;
  name: string;
  manufacturer: string;
  memoryInfo?: { sizeInMiB?: number };
  countOptions?: number[];
  pricing?: { onDemand?: number };
}

interface Region {
  id: string;
  name?: string;
  gpuDevices?: GpuDevice[];
}

interface RegionResponse {
  regions?: Region[];
}

interface VolumeRecord {
  id?: string;
  spec?: { storageSize?: number; storageClassName?: string };
  status?: string;
}

function gpuSecret(): string {
  const explicit = process.env.GPU_WORKER_SECRET?.trim();
  if (explicit) return explicit;
  return crypto
    .createHmac('sha256', getToken())
    .update(`elevate-gpu-worker-v1:${GPU_PROJECT_ID}:${GPU_SERVICE_ID}`)
    .digest('hex');
}

function gpuConfig(gpuType: string) {
  return { enabled: true, configuration: { gpuType, gpuCount: GPU_COUNT, timesliced: false } };
}

async function projectExists(projectId: string): Promise<boolean> {
  try {
    await nfFetch(`/projects/${projectId}`);
    return true;
  } catch {
    return false;
  }
}

async function ensureGpuProject(execute: boolean): Promise<void> {
  if (await projectExists(GPU_PROJECT_ID)) return;
  if (!execute) {
    console.log(`[dry-run] create project ${GPU_PROJECT_ID} region=${GPU_REGION}`);
    return;
  }
  console.log(`Creating isolated GPU project ${GPU_PROJECT_ID} in ${GPU_REGION}...`);
  const created = await nfFetch<Record<string, unknown>>('/projects', {
    method: 'POST',
    body: JSON.stringify({
      name: GPU_PROJECT_NAME,
      description: 'Isolated self-hosted Wan/LTX video inference',
      color: '#6D28D9',
      region: GPU_REGION,
    }),
  });
  if (!(await projectExists(GPU_PROJECT_ID))) {
    const returnedId = typeof created?.id === 'string' ? created.id : undefined;
    throw new Error(
      `Northflank created the GPU project but ${GPU_PROJECT_ID} was not addressable.` +
        (returnedId ? ` Returned project id: ${returnedId}.` : '') +
        ' Set NORTHFLANK_GPU_PROJECT_ID to the returned project id.',
    );
  }
}

async function resolveGpuDevice(): Promise<GpuDevice> {
  const response = await nfFetch<RegionResponse>('/regions');
  const region = (response.regions ?? []).find((item) => item.id === GPU_REGION);
  if (!region) throw new Error(`Northflank region ${GPU_REGION} is unavailable to this account.`);
  const devices = region.gpuDevices ?? [];
  if (!devices.length) throw new Error(`Northflank region ${GPU_REGION} currently advertises no GPU devices.`);

  let selected: GpuDevice | undefined;
  if (REQUESTED_GPU_TYPE) {
    selected = devices.find((device) => device.id === REQUESTED_GPU_TYPE);
    if (!selected) {
      throw new Error(`Requested GPU ${REQUESTED_GPU_TYPE} is not available in ${GPU_REGION}. Available: ${devices.map((d) => d.id).join(', ')}`);
    }
  } else {
    selected = devices
      .filter((device) => device.manufacturer.toLowerCase().includes('nvidia'))
      .filter((device) => (device.memoryInfo?.sizeInMiB ?? 0) >= 24 * 1024)
      .filter((device) => (device.countOptions?.length ? device.countOptions.includes(GPU_COUNT) : true))
      .sort((a, b) => {
        const aL4 = /\bl4\b/i.test(`${a.id} ${a.name}`) ? 0 : 1;
        const bL4 = /\bl4\b/i.test(`${b.id} ${b.name}`) ? 0 : 1;
        return aL4 - bL4 || (a.pricing?.onDemand ?? Number.MAX_SAFE_INTEGER) - (b.pricing?.onDemand ?? Number.MAX_SAFE_INTEGER);
      })[0];
  }

  if (!selected) throw new Error(`No NVIDIA GPU with at least 24 GB VRAM and count=${GPU_COUNT} is available in ${GPU_REGION}.`);
  if ((selected.memoryInfo?.sizeInMiB ?? 0) < 24 * 1024) {
    throw new Error(`GPU ${selected.id} has insufficient VRAM (${selected.memoryInfo?.sizeInMiB ?? 0} MiB); Wan requires a 24 GB class GPU.`);
  }
  console.log(`Selected GPU ${selected.name} (${selected.id}), VRAM=${selected.memoryInfo?.sizeInMiB ?? 0}MiB.`);
  return selected;
}

function servicePayload(gpuType: string) {
  return {
    name: GPU_SERVICE_ID,
    description: 'Elevate self-hosted Wan/LTX cinematic video worker',
    billing: {
      deploymentPlan: GPU_PLAN,
      buildPlan: BUILD_PLAN,
      gpu: gpuConfig(gpuType),
    },
    deployment: {
      type: 'deployment',
      instances: 1,
      docker: { configType: 'default' },
      gpu: gpuConfig(gpuType),
      gracePeriodSeconds: 60,
      storage: {
        shmSize: 8192,
        ephemeralStorage: { storageSize: 32768 },
      },
    },
    ports: [{ name: 'http', internalPort: PORT, protocol: 'HTTP', public: true }],
    buildSource: 'git',
    vcsData: { projectUrl: REPO, projectType: 'github', projectBranch: BRANCH },
    disabledCI: true,
    buildSettings: {
      dockerfile: {
        buildEngine: 'buildkit',
        dockerFilePath: DOCKERFILE,
        dockerWorkDir: '/',
        buildkit: { useCache: true, cacheStorageSize: 32768 },
      },
      storage: { ephemeralStorage: { storageSize: 32768 } },
    },
    buildConfiguration: {
      isAllowList: true,
      pathIgnoreRules: [
        'services/media-gpu-worker/**',
        'lib/video/gpu-video-client.ts',
        'lib/video/process-video-job.ts',
        'scripts/northflank/provision-media-gpu.ts',
        '.github/workflows/deploy-gpu-worker.yml',
        'pnpm-lock.yaml',
        'package.json',
      ],
      ciIgnoreFlagsEnabled: true,
      ciIgnoreFlags: ['[skip ci]', '[ci skip]', '[northflank skip]', '[skip northflank]'],
      storage: { ephemeralStorage: { storageSize: 32768 } },
    },
    runtimeEnvironment: {
      SERVICE_ROLE: 'media-gpu-worker',
      SERVICE_NAME: GPU_SERVICE_ID,
      GPU_VIDEO_PROVIDER: process.env.GPU_VIDEO_PROVIDER || 'wan',
      GPU_MAX_CONCURRENCY: process.env.GPU_MAX_CONCURRENCY || '1',
      GPU_JOB_TIMEOUT_SECONDS: process.env.GPU_JOB_TIMEOUT_SECONDS || '1800',
      GPU_ASSET_TTL_SECONDS: process.env.GPU_ASSET_TTL_SECONDS || '7200',
      WAN_MIN_VRAM_GB: process.env.WAN_MIN_VRAM_GB || '22',
      MODEL_BOOTSTRAP_ENABLED: 'true',
      WAN_MODEL_ID: process.env.WAN_MODEL_ID || 'Wan-AI/Wan2.2-TI2V-5B',
      WAN_GIT_REF: process.env.WAN_GIT_REF || '42bf4cfaa384bc21833865abc2f9e6c0e67233dc',
    },
    healthChecks: [
      {
        protocol: 'HTTP', type: 'startupProbe', path: '/health', port: PORT,
        initialDelaySeconds: 15, periodSeconds: 10, timeoutSeconds: 5, failureThreshold: 60,
      },
      {
        protocol: 'HTTP', type: 'readinessProbe', path: '/health/ready', port: PORT,
        initialDelaySeconds: 10, periodSeconds: 30, timeoutSeconds: 5, failureThreshold: 120, successThreshold: 1,
      },
      {
        protocol: 'HTTP', type: 'livenessProbe', path: '/health', port: PORT,
        initialDelaySeconds: 60, periodSeconds: 30, timeoutSeconds: 5, failureThreshold: 5,
      },
    ],
  };
}

async function serviceExists(): Promise<boolean> {
  try {
    await nfFetch(projectApiPath(GPU_PROJECT_ID, `/services/${GPU_SERVICE_ID}`));
    return true;
  } catch {
    return false;
  }
}

async function ensureService(execute: boolean, gpuType: string): Promise<void> {
  const payload = servicePayload(gpuType);
  const exists = await serviceExists();
  if (!execute) {
    console.log(`[dry-run] ${exists ? 'patch' : 'create'} ${GPU_PROJECT_ID}/${GPU_SERVICE_ID} gpu=${gpuType}x${GPU_COUNT}`);
    return;
  }
  if (exists) {
    await nfFetch(combinedServicePatchPath(GPU_PROJECT_ID, GPU_SERVICE_ID), { method: 'PATCH', body: JSON.stringify(payload) });
  } else {
    await nfFetch(combinedServiceCreatePath(GPU_PROJECT_ID), { method: 'POST', body: JSON.stringify(payload) });
  }
  console.log(`${exists ? 'Updated' : 'Created'} GPU service ${GPU_SERVICE_ID}.`);
}

async function getVolume(): Promise<VolumeRecord | null> {
  try {
    return await nfFetch<VolumeRecord>(projectApiPath(GPU_PROJECT_ID, `/volumes/${MODEL_VOLUME_ID}`));
  } catch {
    return null;
  }
}

async function ensureModelVolume(execute: boolean): Promise<void> {
  const existing = await getVolume();
  const mounts = [{ volumeMountPath: '', containerMountPath: '/models' }];
  if (!execute) {
    console.log(`[dry-run] ${existing ? 'update' : 'create'} volume ${MODEL_VOLUME_ID} size=${MODEL_VOLUME_MB}MB mount=/models`);
    return;
  }

  if (!existing) {
    await nfFetch(projectApiPath(GPU_PROJECT_ID, '/volumes'), {
      method: 'POST',
      body: JSON.stringify({
        name: MODEL_VOLUME_ID,
        mounts,
        spec: { storageClassName: STORAGE_CLASS, storageSize: MODEL_VOLUME_MB },
        attachedObjects: [{ id: GPU_SERVICE_ID, type: 'service' }],
      }),
    });
    console.log(`Created persistent model volume ${MODEL_VOLUME_ID} (${MODEL_VOLUME_MB}MB) mounted at /models.`);
    return;
  }

  const currentSize = Number(existing.spec?.storageSize || 0);
  const requestedSize = Math.max(currentSize, MODEL_VOLUME_MB);
  await nfFetch(projectApiPath(GPU_PROJECT_ID, `/volumes/${MODEL_VOLUME_ID}`), {
    method: 'POST',
    body: JSON.stringify({ mounts, spec: { storageSize: requestedSize } }),
  });
  console.log(`Verified persistent model volume ${MODEL_VOLUME_ID}: ${requestedSize}MB mounted at /models.`);
}

async function upsertSecretGroup(projectId: string, groupId: string, serviceId: string, variables: Record<string, string>): Promise<void> {
  const restrictions = {
    restricted: true,
    nfObjects: [{ id: serviceId, type: 'service' as const }],
    tagMatchCondition: 'or' as const,
  };
  let exists = true;
  try {
    await nfFetch(projectApiPath(projectId, `/secrets/${groupId}`));
  } catch {
    exists = false;
  }
  const body = JSON.stringify({
    name: groupId,
    description: 'Elevate GPU media runtime credentials',
    priority: 20,
    type: 'secret',
    secretType: 'environment',
    restrictions,
    secrets: { variables },
  });
  if (!exists) {
    await nfFetch(projectApiPath(projectId, '/secrets'), { method: 'POST', body });
  } else {
    await nfFetch(projectApiPath(projectId, `/secrets/${groupId}`), { method: 'POST', body });
  }
}

function collectStrings(value: unknown, out: string[]): void {
  if (typeof value === 'string') { out.push(value); return; }
  if (Array.isArray(value)) { value.forEach((item) => collectStrings(item, out)); return; }
  if (value && typeof value === 'object') Object.values(value as Record<string, unknown>).forEach((item) => collectStrings(item, out));
}

function candidateEndpoint(value: unknown): string | null {
  const strings: string[] = [];
  collectStrings(value, strings);
  for (const raw of strings) {
    const text = raw.trim();
    if (/^https:\/\/[^\s/]+$/i.test(text) && /(code\.run|northflank\.|app\.run)/i.test(text)) return text;
    if (/^[a-z0-9.-]+\.(code\.run|northflank\.app)$/i.test(text)) return `https://${text}`;
  }
  return null;
}

async function resolvePublicEndpoint(): Promise<string> {
  for (let attempt = 1; attempt <= 60; attempt += 1) {
    try {
      const ports = await nfFetch(projectApiPath(GPU_PROJECT_ID, `/services/${GPU_SERVICE_ID}/ports`));
      const found = candidateEndpoint(ports);
      if (found) return found.replace(/\/$/, '');
    } catch {
      // Some Northflank service variants expose generated endpoint data only on service GET.
    }
    const service = await nfFetch(projectApiPath(GPU_PROJECT_ID, `/services/${GPU_SERVICE_ID}`));
    const serviceUrl = candidateEndpoint(service);
    if (serviceUrl) return serviceUrl.replace(/\/$/, '');
    console.log(`Waiting for Northflank GPU public endpoint (${attempt}/60)...`);
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error(`Northflank did not expose a public endpoint for ${GPU_SERVICE_ID}.`);
}

async function main() {
  const execute = process.argv.includes('--execute');
  console.log(execute ? '=== PROVISION GPU MEDIA ===' : '=== GPU MEDIA DRY RUN ===');
  console.log(`GPU project: ${GPU_PROJECT_ID} (${GPU_REGION})`);
  console.log(`GPU service: ${GPU_SERVICE_ID}`);
  console.log(`Compute=${GPU_PLAN}; modelVolume=${MODEL_VOLUME_MB}MB; storageClass=${STORAGE_CLASS}`);
  console.log(`Web project remains CPU-only and unchanged: ${WEB_PROJECT_ID}`);

  const selected = await resolveGpuDevice();
  await ensureGpuProject(execute);
  await ensureService(execute, selected.id);
  await ensureModelVolume(execute);
  if (!execute) return;

  const secret = gpuSecret();
  await upsertSecretGroup(GPU_PROJECT_ID, GPU_SECRET_GROUP, GPU_SERVICE_ID, { GPU_WORKER_SECRET: secret });
  const endpoint = await resolvePublicEndpoint();
  await upsertSecretGroup(WEB_PROJECT_ID, ADMIN_GPU_SECRET_GROUP, ADMIN_SERVICE_ID, {
    GPU_VIDEO_WORKER_URL: endpoint,
    GPU_WORKER_SECRET: secret,
    GPU_VIDEO_PROVIDER: 'wan',
  });

  console.log(`GPU worker endpoint wired to Admin: ${endpoint}`);
  console.log('GPU worker secret synchronized without printing its value.');
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `gpu_project_id=${GPU_PROJECT_ID}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `gpu_service_id=${GPU_SERVICE_ID}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `gpu_worker_url=${endpoint}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `gpu_type=${selected.id}\n`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
