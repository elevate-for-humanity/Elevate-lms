#!/usr/bin/env tsx
/**
 * Production acceptance for the self-hosted GPU worker.
 * Requires a real CUDA/model-ready worker and proves generation + MP4 transfer.
 */

import crypto from 'node:crypto';
import { getToken } from './lib';

const GPU_PROJECT_ID = process.env.NORTHFLANK_GPU_PROJECT_ID || 'elevate-media-gpu';
const GPU_SERVICE_ID = process.env.NORTHFLANK_GPU_SERVICE_ID || 'elevate-gpu-worker';
const baseUrl = (process.env.GPU_VIDEO_WORKER_URL || process.argv[2] || '').replace(/\/$/, '');

function secret(): string {
  const explicit = process.env.GPU_WORKER_SECRET?.trim();
  if (explicit) return explicit;
  return crypto
    .createHmac('sha256', getToken())
    .update(`elevate-gpu-worker-v1:${GPU_PROJECT_ID}:${GPU_SERVICE_ID}`)
    .digest('hex');
}

async function waitForReady(url: string): Promise<void> {
  const deadline = Date.now() + Number(process.env.GPU_READY_TIMEOUT_MS || 7_200_000);
  let attempt = 0;
  while (Date.now() < deadline) {
    attempt += 1;
    try {
      const response = await fetch(`${url}/health/ready`, { cache: 'no-store', signal: AbortSignal.timeout(10_000) });
      const text = await response.text();
      if (response.ok) {
        const body = JSON.parse(text) as { ready?: boolean; bootstrapState?: string };
        if (body.ready === true) {
          console.log(`GPU worker model readiness passed after ${attempt} checks.`);
          return;
        }
        console.log(`GPU bootstrap state: ${body.bootstrapState || 'unknown'} (${attempt})`);
      } else {
        console.log(`GPU readiness HTTP ${response.status} (${attempt})`);
      }
    } catch (error) {
      console.log(`GPU readiness pending (${attempt}): ${error instanceof Error ? error.message : String(error)}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 30_000));
  }
  throw new Error('Timed out waiting for GPU/model readiness.');
}

async function main() {
  if (!/^https?:\/\//i.test(baseUrl)) throw new Error('Pass GPU_VIDEO_WORKER_URL or the worker URL as argv[2].');

  const health = await fetch(`${baseUrl}/health`, { cache: 'no-store', signal: AbortSignal.timeout(10_000) });
  if (!health.ok) throw new Error(`GPU liveness failed HTTP ${health.status}`);
  const healthBody = (await health.json()) as { ok?: boolean };
  if (healthBody.ok !== true) throw new Error('GPU liveness did not return ok=true.');

  await waitForReady(baseUrl);
  const authorization = `Bearer ${secret()}`;

  const diagnostic = await fetch(`${baseUrl}/ready`, {
    headers: { authorization },
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  if (!diagnostic.ok) throw new Error(`Authenticated GPU diagnostics failed HTTP ${diagnostic.status}`);
  const diagnosticBody = (await diagnostic.json()) as { ready?: boolean; cuda?: boolean; wanModelReady?: boolean; wanVramReady?: boolean; ffmpeg?: boolean };
  if (!diagnosticBody.ready || !diagnosticBody.cuda || !diagnosticBody.wanModelReady || !diagnosticBody.wanVramReady || !diagnosticBody.ffmpeg) {
    throw new Error(`GPU diagnostics failed readiness contract: ${JSON.stringify(diagnosticBody)}`);
  }

  console.log('Starting real Wan acceptance generation...');
  const generated = await fetch(`${baseUrl}/v1/video/generate`, {
    method: 'POST',
    headers: { authorization, 'content-type': 'application/json' },
    body: JSON.stringify({
      provider: 'wan',
      prompt: 'A professional adult learner studies a small business plan at a clean modern desk, natural daylight, realistic educational training footage, gentle camera movement, no text or logos.',
      width: 1280,
      height: 704,
      duration_seconds: 1,
      seed: 20260821,
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(Number(process.env.GPU_GENERATION_TIMEOUT_MS || 2_400_000)),
  });
  const generatedText = await generated.text();
  if (!generated.ok) throw new Error(`Wan acceptance generation failed HTTP ${generated.status}: ${generatedText.slice(0, 1000)}`);
  const result = JSON.parse(generatedText) as { ok?: boolean; jobId?: string; assetPath?: string; bytes?: number };
  if (!result.ok || !result.jobId || !result.assetPath) throw new Error('GPU generation returned an incomplete result.');

  try {
    const asset = await fetch(`${baseUrl}${result.assetPath}`, {
      headers: { authorization },
      cache: 'no-store',
      signal: AbortSignal.timeout(120_000),
    });
    if (!asset.ok) throw new Error(`GPU generated asset failed HTTP ${asset.status}`);
    const contentType = asset.headers.get('content-type') || '';
    if (!contentType.toLowerCase().startsWith('video/mp4')) throw new Error(`Expected video/mp4, received ${contentType || 'missing'}`);
    const bytes = Buffer.from(await asset.arrayBuffer());
    if (bytes.length < 100_000) throw new Error(`Generated MP4 is unexpectedly small (${bytes.length} bytes).`);
    if (result.bytes && Math.abs(result.bytes - bytes.length) > 1024) {
      throw new Error(`Generated asset size mismatch (${result.bytes} vs ${bytes.length}).`);
    }
    console.log(`GPU acceptance MP4 passed: ${bytes.length} bytes.`);
  } finally {
    await fetch(`${baseUrl}${result.assetPath}`, {
      method: 'DELETE',
      headers: { authorization },
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    }).catch(() => undefined);
  }

  console.log('GPU production acceptance PASSED: CUDA + Wan model + generation + authenticated MP4 transfer.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
