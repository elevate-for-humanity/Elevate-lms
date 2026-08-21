#!/usr/bin/env tsx
/**
 * Canonical Elevate GPU worker provisioner for Northflank managed cloud.
 *
 * Flow:
 *   choose an L4-capable region/project -> ensure persistent /models volume ->
 *   create/update GPU service -> exact-SHA build/deploy -> wire worker/Admin
 *   secrets -> CUDA/model readiness -> real Wan MP4 acceptance.
 */
import crypto from 'node:crypto';
import { nfFetch, projectApiPath } from './lib';

const WEB_PROJECT_ID = process.env.NORTHFLANK_PROJECT_ID || 'elevate-platform';
const REQUESTED_GPU_PROJECT_ID = process.env.NORTHFLANK_GPU_PROJECT_ID?.trim() || '';
const GPU_PROJECT_NAME = process.env.NORTHFLANK_GPU_PROJECT_NAME || 'elevate-media-gpu';
const SERVICE_ID = process.env.NORTHFLANK_GPU_SERVICE_ID || 'elevate-gpu-worker';
const ADMIN_SERVICE_ID = process.env.NORTHFLANK_ADMIN_SERVICE_ID || 'elevate-admin';
const MODEL_VOLUME_ID = process.env.NORTHFLANK_GPU_MODEL_VOLUME_ID || 'elevate-gpu-models';
const MODEL_VOLUME_NAME = 'Elevate GPU Models';
const MODEL_VOLUME_MB = Number(process.env.NORTHFLANK_GPU_MODEL_VOLUME_MB || '153600');
const GPU_COUNT = Number(process.env.NORTHFLANK_GPU_COUNT || '1');
const RUNTIME_PORT = 8080;
const REPO = 'https://github.com/elevate-for-humanity/Elevate-lms';
const DOCKERFILE = '/services/media-gpu-worker/Dockerfile';
const BUILD_TIMEOUT_MS = Number(process.env.GPU_PROVISION_BUILD_TIMEOUT_MS || 60 * 60 * 1000);
const READY_TIMEOUT_MS = Number(process.env.GPU_PROVISION_READY_TIMEOUT_MS || 90 * 60 * 1000);
const ACCEPTANCE_TIMEOUT_MS = Number(process.env.GPU_PROVISION_ACCEPTANCE_TIMEOUT_MS || 30 * 60 * 1000);

type R = Record<string, any>;
type GpuDevice = { id: string; name?: string; manufacturer?: string; memoryInfo?: { sizeInMiB?: number }; countOptions?: number[]; pricing?: { onDemand?: number } };
type Region = { id: string; name?: string; gpuDevices?: GpuDevice[] };
type Plans = { deploymentPlan: string; buildPlan: string };
type GpuTarget = { projectId: string; region: Region; gpu: GpuDevice };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const log = (message: string, detail?: unknown) => detail === undefined
  ? console.log(`[gpu-provision] ${message}`)
  : console.log(`[gpu-provision] ${message}`, detail);

function arrayFrom(value: unknown, key?: string): R[] {
  if (Array.isArray(value)) return value as R[];
  const obj = value as R | null;
  if (key && Array.isArray(obj?.[key])) return obj[key] as R[];
  if (key && Array.isArray(obj?.data?.[key])) return obj.data[key] as R[];
  if (Array.isArray(obj?.data)) return obj.data as R[];
  return [];
}

function projectRegion(project: R): string | undefined {
  return project.deployment?.region || project.region;
}

function l4InRegion(region: Region): GpuDevice | null {
  const devices = Array.isArray(region.gpuDevices) ? region.gpuDevices : [];
  return devices
    .filter((gpu) => (gpu.manufacturer || 'NVIDIA').toLowerCase() === 'nvidia')
    .filter((gpu) => /(^|\s|-)l4($|\s|-)/i.test(`${gpu.id} ${gpu.name || ''}`))
    .filter((gpu) => Number(gpu.memoryInfo?.sizeInMiB || 0) >= 24 * 1024)
    .filter((gpu) => !Array.isArray(gpu.countOptions) || gpu.countOptions.includes(GPU_COUNT))
    .sort((a, b) => Number(a.pricing?.onDemand ?? Infinity) - Number(b.pricing?.onDemand ?? Infinity))[0] || null;
}

async function projectOrNull(id: string): Promise<R | null> {
  try { return await nfFetch<R>(`/projects/${id}`); }
  catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (/404|not found/i.test(msg)) return null;
    throw error;
  }
}

async function selectGpuTarget(): Promise<GpuTarget> {
  const regionResponse = await nfFetch<R>('/regions');
  const regions = arrayFrom(regionResponse, 'regions') as Region[];
  const eligible = regions
    .map((region) => ({ region, gpu: l4InRegion(region) }))
    .filter((entry): entry is { region: Region; gpu: GpuDevice } => Boolean(entry.gpu))
    .sort((a, b) => Number(a.gpu.pricing?.onDemand ?? Infinity) - Number(b.gpu.pricing?.onDemand ?? Infinity));
  if (!eligible.length) {
    throw new Error('No Northflank NVIDIA L4 >=24GB is exposed to this account. Managed GPU access also requires sufficient account credit.');
  }

  const webProject = await nfFetch<R>(`/projects/${WEB_PROJECT_ID}`);
  const webRegion = regions.find((region) => region.id === projectRegion(webProject));
  const webGpu = webRegion ? l4InRegion(webRegion) : null;
  if (!REQUESTED_GPU_PROJECT_ID && webRegion && webGpu) {
    log('Using existing web project for GPU worker', { projectId: WEB_PROJECT_ID, region: webRegion.id, gpu: webGpu.id });
    return { projectId: WEB_PROJECT_ID, region: webRegion, gpu: webGpu };
  }

  if (REQUESTED_GPU_PROJECT_ID) {
    const requested = await projectOrNull(REQUESTED_GPU_PROJECT_ID);
    if (!requested) throw new Error(`Requested GPU project ${REQUESTED_GPU_PROJECT_ID} does not exist.`);
    const region = regions.find((item) => item.id === projectRegion(requested));
    const gpu = region ? l4InRegion(region) : null;
    if (!region || !gpu) throw new Error(`Requested GPU project ${REQUESTED_GPU_PROJECT_ID} is not in an L4-capable region.`);
    return { projectId: REQUESTED_GPU_PROJECT_ID, region, gpu };
  }

  const projectsResponse = await nfFetch<R>('/projects');
  const projects = arrayFrom(projectsResponse, 'projects');
  const existing = projects.find((project) => project.id === GPU_PROJECT_NAME || project.name === GPU_PROJECT_NAME);
  if (existing?.id) {
    const details = await nfFetch<R>(`/projects/${existing.id}`);
    const region = regions.find((item) => item.id === projectRegion(details));
    const gpu = region ? l4InRegion(region) : null;
    if (!region || !gpu) throw new Error(`Existing GPU project ${existing.id} is not in an L4-capable region.`);
    return { projectId: existing.id, region, gpu };
  }

  const selected = eligible[0]!;
  const created = await nfFetch<R>('/projects', {
    method: 'POST',
    body: JSON.stringify({
      name: GPU_PROJECT_NAME,
      description: 'Elevate isolated self-hosted generative video GPU workloads',
      color: '#111827',
      region: selected.region.id,
    }),
  });
  const id = created.id || GPU_PROJECT_NAME;
  log('Created isolated GPU project', { projectId: id, region: selected.region.id, gpu: selected.gpu.id });
  return { projectId: id, region: selected.region, gpu: selected.gpu };
}

async function resolvePlans(): Promise<Plans> {
  const response = await nfFetch<R>('/plans');
  const plans = arrayFrom(response, 'plans');
  const deployment = plans
    .filter((p) => Array.isArray(p.type) && p.type.includes('deployment'))
    .filter((p) => Number(p.cpuResource) >= 4 && Number(p.ramResource) >= 32768)
    .sort((a, b) => Number(a.amountPerHour ?? Infinity) - Number(b.amountPerHour ?? Infinity))[0];
  const build = plans
    .filter((p) => Array.isArray(p.type) && p.type.includes('build'))
    .filter((p) => Number(p.cpuResource) >= 4 && Number(p.ramResource) >= 16384)
    .sort((a, b) => Number(a.amountPerHour ?? Infinity) - Number(b.amountPerHour ?? Infinity))[0];
  if (!deployment?.id) throw new Error('No Northflank deployment plan with >=4 vCPU / 32GB RAM is available.');
  if (!build?.id) throw new Error('No Northflank build plan with >=4 vCPU / 16GB RAM is available.');
  return { deploymentPlan: deployment.id, buildPlan: build.id };
}

async function ensureModelVolume(projectId: string): Promise<string> {
  const response = await nfFetch<R>(projectApiPath(projectId, '/volumes'));
  const volumes = arrayFrom(response, 'volumes');
  let volume = volumes.find((item) => item.id === MODEL_VOLUME_ID || item.name === MODEL_VOLUME_NAME);
  if (!volume) {
    volume = await nfFetch<R>(projectApiPath(projectId, '/volumes'), {
      method: 'POST',
      body: JSON.stringify({
        name: MODEL_VOLUME_NAME,
        mounts: [{ volumeMountPath: '', containerMountPath: '/models' }],
        spec: { storageClassName: 'ssd', storageSize: MODEL_VOLUME_MB },
      }),
    });
    log('Created persistent model volume', { id: volume.id, storageSize: MODEL_VOLUME_MB });
  } else if (Number(volume.spec?.storageSize || 0) < MODEL_VOLUME_MB) {
    await nfFetch(projectApiPath(projectId, `/volumes/${volume.id}`), {
      method: 'POST',
      body: JSON.stringify({
        mounts: [{ volumeMountPath: '', containerMountPath: '/models' }],
        spec: { storageSize: MODEL_VOLUME_MB },
      }),
    });
    log('Expanded persistent model volume', { id: volume.id, storageSize: MODEL_VOLUME_MB });
  }
  return String(volume.id || MODEL_VOLUME_ID);
}

async function serviceExists(projectId: string): Promise<boolean> {
  try { await nfFetch(projectApiPath(projectId, `/services/${SERVICE_ID}`)); return true; }
  catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (/404|not found/i.test(msg)) return false;
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
    WAN_GIT_REF: '42bf4cfaa384bc21833865abc2f9e6c0e67233dc',
    HF_HOME: '/models/huggingface',
    GPU_OUTPUT_DIR: '/data/output',
  };
}

function servicePayload(plans: Plans, gpu: GpuDevice, volumeId: string): R {
  const gpuConfig = { enabled: true, configuration: { gpuType: gpu.id, gpuCount: GPU_COUNT, timesliced: false } };
  return {
    name: SERVICE_ID,
    description: 'Elevate self-hosted Wan generative video GPU worker',
    billing: { deploymentPlan: plans.deploymentPlan, buildPlan: plans.buildPlan, gpu: gpuConfig },
    infrastructure: { architecture: 'x86' },
    buildSource: 'git',
    disabledCI: true,
    vcsData: { projectUrl: REPO, projectType: 'github', projectBranch: 'main' },
    buildSettings: {
      storage: { ephemeralStorage: { storageSize: 32768 } },
      dockerfile: { buildEngine: 'buildkit', dockerFilePath: DOCKERFILE, dockerWorkDir: '/', buildkit: { useCache: true, cacheStorageSize: 16384 } },
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
      storage: { shmSize: 16384, ephemeralStorage: { storageSize: 32768 } },
      strategy: { type: 'recreate' },
      gracePeriodSeconds: 180,
    },
    createOptions: { volumesToAttach: [volumeId] },
    ports: [{ name: 'gpu', internalPort: RUNTIME_PORT, protocol: 'HTTP', public: true }],
    runtimeEnvironment: runtimeEnvironment(),
    healthChecks: [
      { protocol: 'HTTP', type: 'startupProbe', path: '/health', port: RUNTIME_PORT, initialDelaySeconds: 20, periodSeconds: 15, timeoutSeconds: 5, failureThreshold: 40 },
      { protocol: 'HTTP', type: 'livenessProbe', path: '/health', port: RUNTIME_PORT, initialDelaySeconds: 60, periodSeconds: 30, timeoutSeconds: 5, failureThreshold: 5 },
    ],
  };
}

async function ensureService(projectId: string, plans: Plans, gpu: GpuDevice, volumeId: string) {
  const exists = await serviceExists(projectId);
  await nfFetch(projectApiPath(projectId, exists ? `/services/combined/${SERVICE_ID}` : '/services/combined'), {
    method: exists ? 'PATCH' : 'POST',
    body: JSON.stringify(servicePayload(plans, gpu, volumeId)),
  });
  if (exists) {
    try {
      await nfFetch(projectApiPath(projectId, `/volumes/${volumeId}/attach`), {
        method: 'POST', body: JSON.stringify({ nfObject: { id: SERVICE_ID, type: 'service' } }),
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (!/already|attached|conflict/i.test(msg)) throw error;
    }
  }
}

async function triggerExactBuild(projectId: string) {
  const sha = process.env.GITHUB_SHA?.trim();
  const body = sha && /^[0-9a-f]{40}$/i.test(sha) ? { sha } : {};
  const response = await nfFetch<R>(projectApiPath(projectId, `/services/${SERVICE_ID}/build`), { method: 'POST', body: JSON.stringify(body) });
  log('Exact GPU build triggered', { buildId: response.id, sha: response.sha || sha || 'latest' });
}

function buildStatus(service: R): string | undefined { return service.status?.build?.status || service.build?.status || service.buildStatus; }
function deployStatus(service: R): string | undefined { return service.status?.deployment?.status || service.deployment?.status || service.deploymentStatus; }

async function waitForDeployment(projectId: string): Promise<R> {
  const deadline = Date.now() + BUILD_TIMEOUT_MS;
  const failed = new Set(['FAILURE', 'FAILED', 'ERROR', 'CRASHED']);
  while (Date.now() < deadline) {
    const service = await nfFetch<R>(projectApiPath(projectId, `/services/${SERVICE_ID}`));
    const build = buildStatus(service);
    const deploy = deployStatus(service);
    log('GPU service status', { build, deploy });
    if (failed.has(build || '') || failed.has(deploy || '')) throw new Error(`GPU service failed: ${build}/${deploy}`);
    if (build === 'SUCCESS' && deploy === 'COMPLETED') return service;
    await sleep(15_000);
  }
  throw new Error('Timed out waiting for GPU build/deployment.');
}

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, out));
  else if (value && typeof value === 'object') Object.values(value as R).forEach((item) => collectStrings(item, out));
  return out;
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

async function waitForPublicUrl(projectId: string): Promise<string> {
  const deadline = Date.now() + 10 * 60 * 1000;
  while (Date.now() < deadline) {
    const service = await nfFetch<R>(projectApiPath(projectId, `/services/${SERVICE_ID}`));
    const url = discoverPublicUrl(service);
    if (url) return url;
    await sleep(10_000);
  }
  throw new Error('GPU service has no public URL.');
}

async function upsertSecretGroup(projectId: string, id: string, serviceIds: string[], variables: Record<string, string>) {
  const payload = {
    name: id,
    description: 'Elevate GPU media runtime wiring',
    priority: 30,
    type: 'secret',
    secretType: 'environment',
    restrictions: { restricted: true, nfObjects: serviceIds.map((serviceId) => ({ id: serviceId, type: 'service' })), tagMatchCondition: 'or' },
    secrets: { variables },
  };
  try {
    await nfFetch(projectApiPath(projectId, `/secrets/${id}`));
    await nfFetch(projectApiPath(projectId, `/secrets/${id}`), { method: 'POST', body: JSON.stringify(payload) });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (!/404|not found/i.test(msg)) throw error;
    await nfFetch(projectApiPath(projectId, '/secrets'), { method: 'POST', body: JSON.stringify(payload) });
  }
}

async function restart(projectId: string, serviceId: string) {
  await nfFetch(projectApiPath(projectId, `/services/${serviceId}/restart`), { method: 'POST', body: '{}' });
}

async function wireSecrets(target: GpuTarget, publicUrl: string, workerSecret: string) {
  await upsertSecretGroup(target.projectId, 'elevate-gpu-worker-env', [SERVICE_ID], { GPU_WORKER_SECRET: workerSecret });
  const clientUrl = target.projectId === WEB_PROJECT_ID ? `http://${SERVICE_ID}:${RUNTIME_PORT}` : publicUrl;
  await upsertSecretGroup(WEB_PROJECT_ID, 'elevate-gpu-client-env', [ADMIN_SERVICE_ID], {
    GPU_VIDEO_WORKER_URL: clientUrl,
    GPU_WORKER_SECRET: workerSecret,
    GPU_VIDEO_PROVIDER: 'wan',
    GPU_VIDEO_PUBLIC_ACCEPTANCE_URL: publicUrl,
  });
  log('GPU/Admin secret wiring synchronized', { clientUrl, publicUrl });
}

async function waitForReady(publicUrl: string, secret: string): Promise<R> {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${publicUrl}/ready`, { headers: { authorization: `Bearer ${secret}` }, signal: AbortSignal.timeout(10_000) });
      const body = await response.json() as R;
      log('GPU readiness', { ready: body.ready, gpu: body.gpu, wanInstalled: body.wanInstalled, wanModelReady: body.wanModelReady, bootstrap: body.bootstrap?.state });
      if (response.ok && body.ready === true) return body;
      if (body.bootstrap?.state === 'failed') throw new Error(`Model bootstrap failed: ${body.bootstrap?.detail || 'unknown'}`);
    } catch (error) {
      log('GPU readiness waiting', error instanceof Error ? error.message : String(error));
    }
    await sleep(20_000);
  }
  throw new Error('Timed out waiting for CUDA/Wan model readiness.');
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
    if (!generated.jobId || !generated.assetPath) throw new Error('Wan acceptance returned no generated asset.');
    const asset = await fetch(`${publicUrl}${generated.assetPath}`, { headers: { authorization: `Bearer ${secret}` }, signal: AbortSignal.timeout(120_000) });
    if (!asset.ok) throw new Error(`Wan acceptance asset failed (${asset.status}).`);
    const contentType = asset.headers.get('content-type') || '';
    const bytes = Buffer.from(await asset.arrayBuffer());
    if (!contentType.startsWith('video/mp4') || bytes.length < 50_000) throw new Error(`Invalid acceptance MP4 (${contentType}, ${bytes.length} bytes).`);
    log('Real Wan MP4 acceptance passed', { bytes: bytes.length });
    await fetch(`${publicUrl}${generated.assetPath}`, { method: 'DELETE', headers: { authorization: `Bearer ${secret}` } }).catch(() => undefined);
  } finally { clearTimeout(timer); }
}

async function main() {
  const execute = process.argv.includes('--execute');
  const target = await selectGpuTarget();
  const plans = await resolvePlans();
  log('Resolved GPU target', { projectId: target.projectId, region: target.region.id, gpu: target.gpu.id, deploymentPlan: plans.deploymentPlan, buildPlan: plans.buildPlan });
  if (!execute) return;

  const volumeId = await ensureModelVolume(target.projectId);
  await ensureService(target.projectId, plans, target.gpu, volumeId);
  await triggerExactBuild(target.projectId);
  const deployed = await waitForDeployment(target.projectId);
  const publicUrl = discoverPublicUrl(deployed) || await waitForPublicUrl(target.projectId);
  const workerSecret = crypto.randomBytes(32).toString('hex');
  console.log(`::add-mask::${workerSecret}`);
  await wireSecrets(target, publicUrl, workerSecret);
  await Promise.all([restart(target.projectId, SERVICE_ID), restart(WEB_PROJECT_ID, ADMIN_SERVICE_ID)]);
  await waitForReady(publicUrl, workerSecret);
  await acceptanceGenerate(publicUrl, workerSecret);
  log('GPU MEDIA ACCEPTANCE PASSED', { projectId: target.projectId, serviceId: SERVICE_ID, publicUrl, provider: 'wan' });
}

main().catch((error) => {
  console.error('[gpu-provision] FAILED', error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
