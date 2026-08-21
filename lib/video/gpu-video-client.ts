import 'server-only';

import { getSecret } from '@/lib/secrets';

export type GpuVideoProvider = 'wan' | 'ltx';

export interface GpuVideoRequest {
  prompt: string;
  provider?: GpuVideoProvider;
  width?: number;
  height?: number;
  durationSeconds?: number;
  seed?: number;
  imageUrl?: string;
}

export interface GpuVideoResult {
  ok: boolean;
  provider: GpuVideoProvider;
  jobId: string;
  videoUrl: string;
  durationSeconds?: number;
}

async function config() {
  const baseUrl = (process.env.GPU_VIDEO_WORKER_URL || (await getSecret('GPU_VIDEO_WORKER_URL')) || '').replace(/\/$/, '');
  const secret = process.env.GPU_WORKER_SECRET || (await getSecret('GPU_WORKER_SECRET')) || '';
  if (!baseUrl || !secret) return null;
  return { baseUrl, secret };
}

export async function gpuVideoAvailable(): Promise<boolean> {
  const cfg = await config();
  if (!cfg) return false;
  try {
    const response = await fetch(`${cfg.baseUrl}/ready`, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
    if (!response.ok) return false;
    const body = (await response.json()) as { ready?: boolean };
    return body.ready === true;
  } catch {
    return false;
  }
}

export async function generateGpuVideo(input: GpuVideoRequest): Promise<GpuVideoResult | null> {
  const cfg = await config();
  if (!cfg) return null;
  const response = await fetch(`${cfg.baseUrl}/v1/video/generate`, {
    method: 'POST',
    headers: { authorization: `Bearer ${cfg.secret}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      prompt: input.prompt,
      provider: input.provider || (process.env.GPU_VIDEO_PROVIDER as GpuVideoProvider) || 'wan',
      width: input.width ?? 1280,
      height: input.height ?? 704,
      duration_seconds: input.durationSeconds ?? 5,
      seed: input.seed,
      image_url: input.imageUrl,
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(Number(process.env.GPU_VIDEO_REQUEST_TIMEOUT_MS || 1_800_000)),
  });
  if (!response.ok) throw new Error(`GPU video worker returned ${response.status}: ${(await response.text()).slice(0, 500)}`);
  return (await response.json()) as GpuVideoResult;
}
