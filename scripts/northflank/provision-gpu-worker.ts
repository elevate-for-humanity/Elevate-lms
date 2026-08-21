#!/usr/bin/env tsx
/** Provision the self-hosted Elevate GPU video worker on Northflank. */
import crypto from 'node:crypto';
import { nfFetch, combinedServiceCreatePath, combinedServicePatchPath, projectApiPath } from './lib';

const SOURCE_PROJECT = process.env.NORTHFLANK_PROJECT_ID || 'elevate-platform';
const SOURCE_SECRET_GROUP = process.env.NORTHFLANK_SECRET_GROUP_ID || 'elevate-production-env';
const GPU_PROJECT = process.env.NORTHFLANK_GPU_PROJECT_ID || SOURCE_PROJECT;
const GPU_SERVICE = process.env.NORTHFLANK_GPU_SERVICE_ID || 'elevate-media-gpu-worker';
const GPU_VOLUME = process.env.NORTHFLANK_GPU_VOLUME_ID || 'elevate-gpu-models';
const GPU_PLAN = process.env.NORTHFLANK_GPU_DEPLOYMENT_PLAN || 'nf-gpu-a100-80-1g';
const GPU_TYPE = process.env.NORTHFLANK_GPU_TYPE || 'a100-80';
const GPU_COUNT = Number(process.env.NORTHFLANK_GPU_COUNT || '1');
const MODEL_VOLUME_MB = Number(process.env.NORTHFLANK_GPU_MODEL_VOLUME_MB || '153600');
const ADMIN_SERVICE = process.env.NORTHFLANK_ADMIN_SERVICE_ID || 'elevate-admin';
const REPO = 'https://github.com/elevate-for-humanity/Elevate-lms';
const BRANCH = process.env.NORTHFLANK_GIT_BRANCH || 'main';
const DOCKERFILE = '/services/media-gpu-worker/Dockerfile';
const PORT = 8080;

async function exists(path: string) { try { await nfFetch(path); return true; } catch { return false; } }
async function ensureProject() { if (await exists(`/projects/${GPU_PROJECT}`)) return; throw new Error(`Northflank project ${GPU_PROJECT} is outside this token scope.`); }

async function sourceRuntimeSecrets(): Promise<Record<string, string>> {
  const group = await nfFetch<any>(projectApiPath(SOURCE_PROJECT, `/secrets/${SOURCE_SECRET_GROUP}`));
  const variables = group?.secrets?.variables || group?.data?.secrets?.variables || {};
  const keep = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'HF_TOKEN'];
  const out: Record<string, string> = {};
  for (const key of keep) if (typeof variables[key] === 'string' && variables[key]) out[key] = variables[key];
  if (!out.NEXT_PUBLIC_SUPABASE_URL || !out.SUPABASE_SERVICE_ROLE_KEY) throw new Error('GPU worker requires Supabase URL/service-role credentials from the production secret group');
  return out;
}

async function ensureVolume() {
  const path = projectApiPath(GPU_PROJECT, `/volumes/${GPU_VOLUME}`);
  if (await exists(path)) {
    await nfFetch(path, { method: 'POST', body: JSON.stringify({ mounts: [{ volumeMountPath: '', containerMountPath: '/models' }], spec: { storageSize: MODEL_VOLUME_MB } }) });
    return;
  }
  await nfFetch(projectApiPath(GPU_PROJECT, '/volumes'), { method: 'POST', body: JSON.stringify({ name: GPU_VOLUME, mounts: [{ volumeMountPath: '', containerMountPath: '/models' }], spec: { storageClassName: 'nf-multi-rw', storageSize: MODEL_VOLUME_MB } }) });
}

function servicePayload(secret: string, sourceSecrets: Record<string, string>) {
  return {
    name: GPU_SERVICE, description: 'Elevate self-hosted generative video GPU worker',
    billing: { deploymentPlan: GPU_PLAN, buildPlan: 'nf-compute-800-8', gpu: { enabled: true, configuration: { gpuType: GPU_TYPE, gpuCount: GPU_COUNT, timesliced: false } } },
    infrastructure: { architecture: 'x86' },
    deployment: { instances: 1, docker: { configType: 'default' }, gpu: { enabled: true, configuration: { gpuType: GPU_TYPE, gpuCount: GPU_COUNT, timesliced: false } }, storage: { ephemeralStorage: { storageSize: 65536 }, shmSize: Number(process.env.NORTHFLANK_GPU_SHM_MB || '81920') } },
    ports: [{ name: 'gpu', internalPort: PORT, public: true, protocol: 'HTTP' }],
    buildSource: 'git', vcsData: { projectUrl: REPO, projectType: 'github', projectBranch: BRANCH }, disabledCI: true,
    buildSettings: { dockerfile: { buildEngine: 'buildkit', dockerFilePath: DOCKERFILE, dockerWorkDir: '/', buildkit: { useCache: true, cacheStorageSize: 32768 } } },
    buildConfiguration: { isAllowList: true, pathIgnoreRules: ['services/media-gpu-worker/**','lib/video/gpu-video-client.ts','lib/video/process-video-job.ts','scripts/northflank/provision-gpu-worker.ts','.github/workflows/gpu-worker.yml'], ciIgnoreFlagsEnabled: true, ciIgnoreFlags: ['[skip ci]','[ci skip]','[northflank skip]','[skip northflank]'] },
    runtimeEnvironment: { ...sourceSecrets, SERVICE_ROLE: 'gpu-media-worker', GPU_WORKER_SECRET: secret, GPU_VIDEO_PROVIDER: process.env.GPU_VIDEO_PROVIDER || 'wan', GPU_MAX_CONCURRENCY: process.env.GPU_MAX_CONCURRENCY || '1', GPU_JOB_TIMEOUT_SECONDS: process.env.GPU_JOB_TIMEOUT_SECONDS || '1800', GPU_OUTPUT_DIR: '/data/output', MODEL_RUNTIME_ROOT: '/models/runtime', WAN_REPO: '/models/runtime/wan2.2', WAN_VENV: '/models/runtime/wan-venv', WAN_PYTHON: '/models/runtime/wan-venv/bin/python', WAN_CHECKPOINT_DIR: '/models/Wan2.2-TI2V-5B', LTX_REPO: '/models/runtime/ltx-video', HF_HOME: '/models/huggingface', MODEL_BOOTSTRAP_ENABLED: 'true' },
    healthChecks: [
      { protocol: 'HTTP', type: 'startupProbe', path: '/health', port: PORT, initialDelaySeconds: 15, periodSeconds: 15, timeoutSeconds: 5, failureThreshold: 80 },
      { protocol: 'HTTP', type: 'readinessProbe', path: '/ready', port: PORT, initialDelaySeconds: 30, periodSeconds: 20, timeoutSeconds: 5, failureThreshold: 120, successThreshold: 1 },
      { protocol: 'HTTP', type: 'livenessProbe', path: '/health', port: PORT, initialDelaySeconds: 120, periodSeconds: 30, timeoutSeconds: 5, failureThreshold: 5 },
    ],
    createOptions: { volumesToAttach: [GPU_VOLUME] },
  };
}

function findPublicUrl(value: unknown): string | null {
  if (typeof value === 'string' && /^https:\/\//.test(value)) return value.replace(/\/$/, '');
  if (Array.isArray(value)) for (const item of value) { const found = findPublicUrl(item); if (found) return found; }
  if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (/domain|url/i.test(key)) { const found = findPublicUrl(item); if (found) return found; if (typeof item === 'string' && item.includes('.')) return `https://${item.replace(/^https?:\/\//, '')}`; }
    }
    for (const item of Object.values(value as Record<string, unknown>)) { const found = findPublicUrl(item); if (found) return found; }
  }
  return null;
}

async function ensureService(secret: string, sourceSecrets: Record<string, string>) {
  const payload = servicePayload(secret, sourceSecrets);
  if (await exists(projectApiPath(GPU_PROJECT, `/services/${GPU_SERVICE}`))) await nfFetch(combinedServicePatchPath(GPU_PROJECT, GPU_SERVICE), { method: 'PATCH', body: JSON.stringify(payload) });
  else await nfFetch(combinedServiceCreatePath(GPU_PROJECT), { method: 'POST', body: JSON.stringify(payload) });
  await nfFetch(projectApiPath(GPU_PROJECT, `/volumes/${GPU_VOLUME}/attach`), { method: 'POST', body: JSON.stringify({ nfObject: { id: GPU_SERVICE, type: 'service' } }) }).catch(() => {});
}

async function waitForUrl() {
  for (let i = 0; i < 60; i++) {
    const service = await nfFetch<Record<string, unknown>>(projectApiPath(GPU_PROJECT, `/services/${GPU_SERVICE}`));
    const url = findPublicUrl(service); if (url) return url;
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error('GPU service created but no public HTTPS endpoint was reported by Northflank');
}

async function wireAdmin(url: string, secret: string) {
  await nfFetch(combinedServicePatchPath(SOURCE_PROJECT, ADMIN_SERVICE), { method: 'PATCH', body: JSON.stringify({ runtimeEnvironment: { GPU_VIDEO_WORKER_URL: url, GPU_WORKER_SECRET: secret, GPU_VIDEO_PROVIDER: process.env.GPU_VIDEO_PROVIDER || 'wan', GPU_VIDEO_REQUEST_TIMEOUT_MS: '1800000' } }) });
}

async function main() {
  const execute = process.argv.includes('--execute');
  const secret = process.env.GPU_WORKER_SECRET || crypto.randomBytes(32).toString('hex');
  console.log(`${execute ? 'EXECUTE' : 'DRY RUN'} GPU project=${GPU_PROJECT} service=${GPU_SERVICE} plan=${GPU_PLAN} gpu=${GPU_TYPE}x${GPU_COUNT} volumeMB=${MODEL_VOLUME_MB}`);
  if (!execute) return;
  const sourceSecrets = await sourceRuntimeSecrets(); await ensureProject(); await ensureVolume(); await ensureService(secret, sourceSecrets);
  const url = await waitForUrl(); await wireAdmin(url, secret);
  console.log(`GPU worker provisioned and Admin wired: ${url}`); console.log('GPU_WORKER_SECRET generated/applied without printing its value.');
}

main().catch((error) => { console.error(error); process.exit(1); });
