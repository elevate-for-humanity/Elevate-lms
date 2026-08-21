import 'server-only';

import { getSecret } from '@/lib/secrets';
import type { MediaOperation } from './media-director';

export type GpuVideoProvider = 'wan' | 'ltx';

export interface GpuVideoRequest {
  prompt: string;
  provider?: GpuVideoProvider;
  operation?: MediaOperation;
  width?: number;
  height?: number;
  durationSeconds?: number;
  seed?: number;
  imageUrl?: string;
  sourceVideoUrl?: string;
  negativePrompt?: string;
}

export interface GpuVideoResult {
  ok: boolean;
  provider: GpuVideoProvider;
  operation?: MediaOperation;
  jobId: string;
  assetPath: string;
  bytes?: number;
  durationSeconds?: number;
}

type GpuConfig = { baseUrl: string; secret: string };

async function config(): Promise<GpuConfig | null> {
  const baseUrl = (
    process.env.GPU_VIDEO_WORKER_URL ||
    (await getSecret('GPU_VIDEO_WORKER_URL')) ||
    ''
  ).replace(/\/$/, '');
  const secret = process.env.GPU_WORKER_SECRET || (await getSecret('GPU_WORKER_SECRET')) || '';
  if (!baseUrl || !secret) return null;
  if (!/^https?:\/\//i.test(baseUrl)) throw new Error('GPU_VIDEO_WORKER_URL must be an http(s) URL');
  return { baseUrl, secret };
}

function authorizedHeaders(cfg: GpuConfig): Record<string, string> {
  return { authorization: `Bearer ${cfg.secret}` };
}

function assetUrl(cfg: GpuConfig, result: GpuVideoResult): string {
  if (!result.assetPath.startsWith('/v1/video/')) throw new Error('GPU worker returned an invalid asset path');
  return `${cfg.baseUrl}${result.assetPath}`;
}

export async function gpuVideoAvailable(): Promise<boolean> {
  const cfg = await config();
  if (!cfg) return false;
  try {
    const response = await fetch(`${cfg.baseUrl}/ready`, {
      headers: authorizedHeaders(cfg),
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
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
    headers: { ...authorizedHeaders(cfg), 'content-type': 'application/json' },
    body: JSON.stringify({
      prompt: input.prompt,
      provider: input.provider || (process.env.GPU_VIDEO_PROVIDER as GpuVideoProvider) || 'wan',
      operation: input.operation || (input.sourceVideoUrl ? 'videoToVideo' : input.imageUrl ? 'imageToVideo' : 'textToVideo'),
      width: input.width ?? 1280,
      height: input.height ?? 704,
      duration_seconds: input.durationSeconds ?? 5,
      seed: input.seed,
      image_url: input.imageUrl,
      source_video_url: input.sourceVideoUrl,
      negative_prompt: input.negativePrompt,
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(Number(process.env.GPU_VIDEO_REQUEST_TIMEOUT_MS || 1_800_000)),
  });
  if (!response.ok) {
    throw new Error(`GPU video worker returned ${response.status}: ${(await response.text()).slice(0, 500)}`);
  }
  const result = (await response.json()) as GpuVideoResult;
  if (!result.ok || !result.jobId || !result.assetPath) throw new Error('GPU worker returned an incomplete generation result');
  return result;
}

export async function downloadGpuVideoAsset(result: GpuVideoResult): Promise<Buffer> {
  const cfg = await config();
  if (!cfg) throw new Error('GPU video worker is not configured');
  const response = await fetch(assetUrl(cfg, result), {
    headers: authorizedHeaders(cfg),
    cache: 'no-store',
    signal: AbortSignal.timeout(Number(process.env.GPU_VIDEO_DOWNLOAD_TIMEOUT_MS || 120_000)),
  });
  if (!response.ok) throw new Error(`GPU asset download returned ${response.status}`);
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().startsWith('video/mp4')) {
    throw new Error(`GPU asset returned unexpected content type: ${contentType || 'missing'}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  const maxBytes = Number(process.env.GPU_VIDEO_MAX_BYTES || 150 * 1024 * 1024);
  if (!bytes.length) throw new Error('GPU asset download was empty');
  if (bytes.length > maxBytes) throw new Error(`GPU asset exceeded maximum size (${bytes.length} > ${maxBytes})`);
  return bytes;
}

export async function deleteGpuVideoAsset(result: GpuVideoResult): Promise<void> {
  const cfg = await config();
  if (!cfg) return;
  await fetch(assetUrl(cfg, result), {
    method: 'DELETE',
    headers: authorizedHeaders(cfg),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  }).catch(() => undefined);
}
