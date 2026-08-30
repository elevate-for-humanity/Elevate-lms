#!/usr/bin/env tsx
/**
 * Canonical Northflank provisioner for Elevate's self-hosted LLM inference worker.
 *
 * Deploys services/llm-gpu-worker (vLLM, OpenAI-compatible API) onto a managed
 * L4 GPU, then wires ELEVATE_LLM_URL / ELEVATE_LLM_SECRET into the
 * elevate-platform project so the AI router can select the `elevate` provider.
 *
 * Run with --execute to apply. Without it, only preflight runs.
 */
import crypto from 'node:crypto';
import { deploymentServiceCreatePath, deploymentServicePatchPath, nfFetch, projectApiPath } from './lib';

const WEB_PROJECT_ID = process.env.NORTHFLANK_PROJECT_ID || 'elevate-platform';
const GPU_PROJECT_ID = process.env.NORTHFLANK_LLM_PROJECT_ID || 'elevate-media-gpu';
const GPU_REGION = process.env.NORTHFLANK_GPU_REGION || 'us-central';
const SERVICE_ID = process.env.NORTHFLANK_LLM_SERVICE_ID || 'elevate-llm-worker';
const ADMIN_SERVICE_ID = process.env.NORTHFLANK_ADMIN_SERVICE_ID || 'elevate-admin';
const MODEL_VOLUME_ID = process.env.NORTHFLANK_LLM_MODEL_VOLUME_ID || 'elevate-llm-models';
const MODEL_VOLUME_MB = Number(process.env.NORTHFLANK_LLM_MODEL_VOLUME_MB || '81920');
const MODEL_STORAGE_CLASS = process.env.NORTHFLANK_GPU_MODEL_STORAGE_CLASS || 'nvme';
const GPU_TYPE = process.env.NORTHFLANK_GPU_TYPE || 'l4-24';
const GPU_COUNT = Number(process.env.NORTHFLANK_GPU_COUNT || '1');
const GPU_DEPLOYMENT_PLAN = process.env.NORTHFLANK_LLM_DEPLOYMENT_PLAN || `nf-gpu-${GPU_TYPE}-${GPU_COUNT}g`;
const BUILD_PLAN = process.env.NORTHFLANK_GPU_BUILD_PLAN || 'nf-compute-800-16';
const GPU_DEPLOYMENT_EPHEMERAL_MB = Number(process.env.NORTHFLANK_GPU_EPHEMERAL_MB || '256000');
const BUILD_EPHEMERAL_MB = Number(process.env.NORTHFLANK_GPU_BUILD_EPHEMERAL_MB || '65536');
const LLM_MODEL = process.env.LLM_MODEL || 'Qwen/Qwen2.5-7B-Instruct';
const RUNTIME_PORT = 8080;
const REPO = 'https://github.com/elevate-for-humanity/Elevate-lms';
const VLLM_IMAGE = process.env.NORTHFLANK_LLM_IMAGE || 'vllm/vllm-openai:v0.10.1.1';
const BUILD_TIMEOUT_MS = Number(process.env.LLM_PROVISION_BUILD_TIMEOUT_MS || 60 * 60 * 1000);
const READY_TIMEOUT_MS = Number(process.env.LLM_PROVISION_READY_TIMEOUT_MS || 60 * 60 * 1000);

type R = Record<string, any>;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const log = (message: string, detail?: unknown) => detail === undefined
  ? console.log(`[llm-provision] ${message}`)
  : console.log(`[llm-provision] ${message}`, detail);

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

  const plans = arrayFrom(await nfFetch<R>('/plans'), 'plans');
  if (!plans.some((plan) => plan.id === BUILD_PLAN && Array.isArray(plan.type) && plan.type.includes('build'))) {
    throw new Error(`Build plan ${BUILD_PLAN} is not available`);
  }
  log('Preflight passed', { gpuProject: GPU_PROJECT_ID, region, gpu: GPU_TYPE, gpuPlan: GPU_DEPLOYMENT_PLAN, model: LLM_MODEL });
}

async function ensureVolume(): Promise<string> {
  const volumes = arrayFrom(await nfFetch<R>(projectApiPath(GPU_PROJECT_ID, '/volumes')), 'volumes');
  let volume = volumes.find((item) => item.id === MODEL_VOLUME_ID || item.name === 'Elevate LLM Models');
  if (!volume) {
    volume = await nfFetch<R>(projectApiPath(GPU_PROJECT_ID, '/volumes'), {
      method: 'POST',
      body: JSON.stringify({
        name: 'Elevate LLM Models',
        mounts: [{ volumeMountPath: '', containerMountPath: '/models' }],
        spec: { storageClassName: MODEL_STORAGE_CLASS, storageSize: MODEL_VOLUME_MB },
      }),
    });
    log('Created model volume', { id: volume.id, storageSize: MODEL_VOLUME_MB });
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

async function waitForServiceDeletion() {
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      await nfFetch(projectApiPath(GPU_PROJECT_ID, `/services/${SERVICE_ID}`));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/404|not found/i.test(message)) return;
      throw error;
    }
    await sleep(2_000);
  }
  throw new Error(`Timed out waiting for Northflank to release service id ${SERVICE_ID}`);
}

function deploymentPayload(volumeId: string): R {
  const gpu = { enabled: true, configuration: { gpuType: GPU_TYPE, gpuCount: GPU_COUNT, timesliced: false } };
  const command = [
    '-lc',
    'exec python3 -m vllm.entrypoints.openai.api_server' +
      ' --model "$LLM_MODEL"' +
      ' --served-model-name elevate-local' +
      ' --api-key "$LLM_WORKER_SECRET"' +
      ' --host 0.0.0.0 --port "$PORT"' +
      ' --gpu-memory-utilization "${GPU_MEMORY_UTILIZATION:-0.90}"' +
      ' --max-model-len "${MAX_MODEL_LEN:-8192}"' +
      ' --download-dir "$HF_HOME"' +
      ' ${VLLM_EXTRA_ARGS:-}',
  ].join(' ');
  return {
    name: SERVICE_ID,
    description: 'Elevate self-hosted LLM inference worker (vLLM, OpenAI-compatible)',
    billing: { deploymentPlan: GPU_DEPLOYMENT_PLAN, gpu },
    infrastructure: { architecture: 'x86' },
    deployment: {
      type: 'deployment',
      instances: 1,
      external: { imagePath: VLLM_IMAGE },
      docker: {
        configType: 'customEntrypointCustomCommand',
        customEntrypoint: '/bin/bash',
        customCommand: command,
      },
      gpu,
      storage: { shmSize: 16384, ephemeralStorage: { storageSize: GPU_DEPLOYMENT_EPHEMERAL_MB } },
      strategy: { type: 'recreate' },
      gracePeriodSeconds: 180,
    },
    createOptions: { volumesToAttach: [volumeId] },
    ports: [{ name: 'llm', internalPort: RUNTIME_PORT, protocol: 'HTTP', public: true }],
    runtimeEnvironment: {
      SERVICE_ROLE: 'llm-gpu-worker',
      PORT: String(RUNTIME_PORT),
      LLM_MODEL,
      HF_HOME: '/models/huggingface',
    },
  };
}

async function ensureService(volumeId: string) {
  const payload = deploymentPayload(volumeId);
  let existing: R | null = null;
  try {
    existing = await nfFetch<R>(projectApiPath(GPU_PROJECT_ID, `/services/${SERVICE_ID}`));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/404|not found/i.test(message)) throw error;
  }

  const isBuildBacked = Boolean(
    existing?.buildSource ||
    existing?.vcsData ||
    existing?.buildSettings ||
    existing?.billing?.buildPlan,
  );
  if (existing && isBuildBacked) {
    await nfFetch(projectApiPath(GPU_PROJECT_ID, `/services/${SERVICE_ID}`), { method: 'DELETE' });
    await waitForServiceDeletion();
    existing = null;
    log('Removed failed build-backed LLM service; persistent model volume retained');
  }

  if (existing) {
    await nfFetch(deploymentServicePatchPath(GPU_PROJECT_ID, SERVICE_ID), {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    log('Updated deployment-only LLM worker service');
  } else {
    await nfFetch(deploymentServiceCreatePath(GPU_PROJECT_ID), {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    log('Created deployment-only LLM worker service');
  }
}
async function triggerBuild(): Promise<string | undefined> {
  const result = await nfFetch<R>(projectApiPath(GPU_PROJECT_ID, `/services/${SERVICE_ID}/build`), { method: 'POST', body: '{}' });
  log('Triggered build', result);
  return typeof result.id === 'string' ? result.id : undefined;
}

async function reportBuildFailure(buildId?: string) {
  const query = new URLSearchParams({ queryType: 'range', lineLimit: '250', direction: 'backward' });
  if (buildId) query.set('buildId', buildId);
  try {
    const entries = arrayFrom(
      await nfFetch<R>(projectApiPath(GPU_PROJECT_ID, `/services/${SERVICE_ID}/build-logs?${query}`)),
    );
    const lines = entries
      .map((entry) => typeof entry.log === 'string' ? entry.log : '')
      .filter(Boolean)
      .reverse();
    if (lines.length) {
      console.error('[llm-provision] Northflank build log tail:\n' + lines.join('\n'));
    } else {
      console.error('[llm-provision] Northflank returned no build log lines');
    }
  } catch (error) {
    console.error('[llm-provision] Unable to retrieve Northflank build logs',
      error instanceof Error ? error.message : String(error));
  }
}

function buildStatus(service: R) { return service.status?.build?.status || service.build?.status || service.buildStatus; }
function deploymentStatus(service: R) { return service.status?.deployment?.status || service.deployment?.status || service.deploymentStatus; }

async function waitForDeployment(): Promise<R> {
  const deadline = Date.now() + BUILD_TIMEOUT_MS;
  const failed = new Set(['FAILURE', 'FAILED', 'ERROR', 'CRASHED']);
  let previous = '';
  while (Date.now() < deadline) {
    const service = await nfFetch<R>(projectApiPath(GPU_PROJECT_ID, `/services/${SERVICE_ID}`));
    const status = `${buildStatus(service) || 'unknown'}/${deploymentStatus(service) || 'unknown'}`;
    if (status !== previous) { log(`Service status ${status}`); previous = status; }
    if (failed.has(deploymentStatus(service) || '')) {
      throw new Error(`LLM service failed: ${status}`);
    }
    const build = buildStatus(service);
    if ((!build || build === 'SUCCESS') && deploymentStatus(service) === 'COMPLETED') return service;
    await sleep(15_000);
  }
  throw new Error('Timed out waiting for LLM build/deployment');
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
  throw new Error('LLM service deployed but no public endpoint became available');
}

async function upsertSecretGroup(projectId: string, id: string, serviceId: string, variables: Record<string, string>) {
  const payload = {
    name: id,
    description: 'Elevate LLM worker runtime wiring',
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
  await upsertSecretGroup(GPU_PROJECT_ID, 'elevate-llm-worker-env', SERVICE_ID, { LLM_WORKER_SECRET: workerSecret });
  await upsertSecretGroup(WEB_PROJECT_ID, 'elevate-llm-client-env', ADMIN_SERVICE_ID, {
    ELEVATE_LLM_URL: publicUrl,
    ELEVATE_LLM_SECRET: workerSecret,
  });
}

async function acceptanceChat(publicUrl: string, secret: string) {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  for (;;) {
    try {
      const response = await fetch(`${publicUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { authorization: `Bearer ${secret}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model: 'elevate-local',
          messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
          max_tokens: 8,
        }),
        signal: AbortSignal.timeout(120_000),
      });
      if (response.ok) {
        const payload = (await response.json()) as R;
        const content = payload.choices?.[0]?.message?.content;
        if (typeof content === 'string' && content.trim()) {
          log('LLM acceptance passed', { model: payload.model, content: content.trim().slice(0, 40) });
          return;
        }
      }
      log('Acceptance waiting', { status: response.status });
    } catch (error) {
      log('Acceptance waiting', error instanceof Error ? error.message : String(error));
    }
    if (Date.now() > deadline) throw new Error('Timed out waiting for LLM inference acceptance');
    await sleep(30_000);
  }
}

async function main() {
  const execute = process.argv.includes('--execute');
  await preflight();
  log('Target', { gpuProject: GPU_PROJECT_ID, service: SERVICE_ID, gpuPlan: GPU_DEPLOYMENT_PLAN, model: LLM_MODEL });
  if (!execute) return;

  const volumeId = await ensureVolume();
  const workerSecret = crypto.randomBytes(32).toString('hex');
  console.log(`::add-mask::${workerSecret}`);
  await upsertSecretGroup(GPU_PROJECT_ID, 'elevate-llm-worker-env', SERVICE_ID, {
    LLM_WORKER_SECRET: workerSecret,
  });
  await ensureService(volumeId);
  const deployed = await waitForDeployment();
  const publicUrl = discoverPublicUrl(deployed) || await waitForPublicUrl();
  await upsertSecretGroup(WEB_PROJECT_ID, 'elevate-llm-client-env', ADMIN_SERVICE_ID, {
    ELEVATE_LLM_URL: publicUrl,
    ELEVATE_LLM_SECRET: workerSecret,
  });
  await restart(WEB_PROJECT_ID, ADMIN_SERVICE_ID);
  await acceptanceChat(publicUrl, workerSecret);
  log('LLM INFERENCE ACCEPTANCE PASSED', { gpuProject: GPU_PROJECT_ID, service: SERVICE_ID, publicUrl, model: LLM_MODEL });
}

main().catch((error) => {
  console.error('[llm-provision] FAILED', error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
