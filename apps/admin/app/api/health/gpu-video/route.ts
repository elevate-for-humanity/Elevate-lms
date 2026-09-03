import { NextResponse } from 'next/server';
import { gpuVideoAvailable } from '@/lib/video/gpu-video-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Public, sanitized operational health only. The worker URL, secret, GPU model
 * details, and diagnostic response are intentionally not exposed here.
 */
export async function GET() {
  const ready = await gpuVideoAvailable().catch(() => false);
  return NextResponse.json(
    { ok: true, service: 'admin-gpu-video-client', ready },
    { status: ready ? 200 : 503, headers: { 'cache-control': 'no-store' } },
  );
}
