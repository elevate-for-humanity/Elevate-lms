#!/usr/bin/env tsx
/** Ensure the dedicated Northflank GPU project exists and discover its L4 resources. */
import fs from 'node:fs';
import { nfFetch, projectApiPath } from './lib';

type R = Record<string, any>;
const PROJECT_ID = process.env.NORTHFLANK_GPU_PROJECT_ID || 'elevate-media-gpu';
const REGION = process.env.NORTHFLANK_GPU_REGION || 'us-central';
const GPU_COUNT = Number(process.env.NORTHFLANK_GPU_COUNT || '1');

function rows(value: unknown, key?: string): R[] {
  if (Array.isArray(value)) return value as R[];
  const obj = value as R | undefined;
  if (key && Array.isArray(obj?.[key])) return obj[key];
  if (key && Array.isArray(obj?.data?.[key])) return obj.data[key];
  if (Array.isArray(obj?.data)) return obj.data;
  return [];
}

function missing(error: unknown) {
  return /404|not found|does not exist/i.test(error instanceof Error ? error.message : String(error));
}

async function ensureProject() {
  try {
    const project = await nfFetch<R>(`/projects/${PROJECT_ID}`);
    const actual = project.deployment?.region || project.region;
    if (actual !== REGION) throw new Error(`GPU project ${PROJECT_ID} exists in ${actual}, expected ${REGION}`);
    return;
  } catch (error) {
    if (!missing(error)) throw error;
  }

  await nfFetch<R>('/projects', {
    method: 'POST',
    body: JSON.stringify({
      name: PROJECT_ID,
      description: 'Elevate isolated NVIDIA GPU media inference',
      color: '#4F46E5',
      region: REGION,
    }),
  });

  for (let i = 0; i < 30; i++) {
    try {
      const project = await nfFetch<R>(`/projects/${PROJECT_ID}`);
      const actual = project.deployment?.region || project.region;
      if (actual === REGION) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error(`GPU project ${PROJECT_ID} was created but did not become readable`);
}

function gpuMemoryMiB(gpu: R): number {
  return Number(gpu.memoryInfo?.sizeInMiB || gpu.memoryMiB || gpu.vramMiB || 0);
}

function canonicalGpuPlan(gpuType: string): string {
  const configured = process.env.NORTHFLANK_GPU_DEPLOYMENT_PLAN?.trim();
  if (configured) return configured;
  // Northflank's general /plans endpoint currently omits managed GPU plans even
  // when /regions exposes the GPU. The validated managed-GPU plan convention is
  // nf-gpu-<gpuType>-<count>g (for example nf-gpu-l4-24-1g).
  return `nf-gpu-${gpuType}-${GPU_COUNT}g`;
}

async function discover() {
  const regions = rows(await nfFetch<R>('/regions'), 'regions');
  const region = regions.find((item) => item.id === REGION || item.name === REGION);
  if (!region) throw new Error(`Northflank region ${REGION} is unavailable`);
  const devices = rows(region.gpuDevices || region.gpus || [], 'gpuDevices');
  const l4 = devices.find((gpu) => /(^|[^a-z])l4([^a-z]|$)/i.test(`${gpu.id || ''} ${gpu.name || ''}`) && gpuMemoryMiB(gpu) >= 24 * 1024)
    || devices.find((gpu) => /l4/i.test(`${gpu.id || ''} ${gpu.name || ''}`));
  if (!l4) throw new Error(`No NVIDIA L4 GPU is exposed in ${REGION}`);
  const gpuType = String(l4.id || l4.type || l4.name);
  if (!gpuType) throw new Error('Northflank returned an L4 GPU without a usable type identifier');

  let deploymentPlan = '';
  const planResponses: R[] = [];
  for (const path of [projectApiPath(PROJECT_ID, '/plans'), '/plans']) {
    try { planResponses.push(await nfFetch<R>(path)); } catch {}
  }
  const plans = planResponses.flatMap((value) => rows(value, 'plans'));
  const l4Plans = plans.filter((plan) => /l4/i.test(`${plan.id || ''} ${plan.name || ''}`) && (!Array.isArray(plan.type) || plan.type.includes('deployment')));
  const listedPlan = l4Plans.find((item) => String(item.id || '').includes(`${GPU_COUNT}g`)) || l4Plans[0];
  deploymentPlan = listedPlan?.id ? String(listedPlan.id) : canonicalGpuPlan(gpuType);

  return { gpuType, deploymentPlan, vramMiB: gpuMemoryMiB(l4), planSource: listedPlan?.id ? 'api' : 'canonical' };
}

function exportEnv(values: Record<string, string>) {
  const envFile = process.env.GITHUB_ENV;
  if (!envFile) return;
  fs.appendFileSync(envFile, Object.entries(values).map(([key, value]) => `${key}=${value}\n`).join(''));
}

async function main() {
  await ensureProject();
  const discovered = await discover();
  exportEnv({
    NORTHFLANK_GPU_TYPE: discovered.gpuType,
    NORTHFLANK_GPU_DEPLOYMENT_PLAN: discovered.deploymentPlan,
  });
  console.log('[gpu-project] ready', {
    project: PROJECT_ID,
    region: REGION,
    gpuType: discovered.gpuType,
    vramMiB: discovered.vramMiB,
    deploymentPlan: discovered.deploymentPlan,
    planSource: discovered.planSource,
  });
}

main().catch((error) => {
  console.error('[gpu-project] FAILED', error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
