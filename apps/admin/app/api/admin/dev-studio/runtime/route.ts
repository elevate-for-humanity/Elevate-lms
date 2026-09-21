import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { hydrateProcessEnv } from '@/lib/secrets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

async function runtimeConfig() {
  await hydrateProcessEnv().catch(() => undefined);
  const url = String(process.env.STUDIO_BROWSER_URL || '').replace(/\/$/, '');
  const secret = String(process.env.STUDIO_BROWSER_SECRET || '');
  if (!url || !secret) throw new Error('Master Studio runtime is not configured');
  return { url, secret };
}

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;
  const operation = request.nextUrl.searchParams.get('operation') || 'health';
  const { url, secret } = await runtimeConfig();
  const target = operation === 'files'
    ? `${url}/workspace/files?path=${encodeURIComponent(request.nextUrl.searchParams.get('path') || '')}`
    : `${url}/health`;
  const response = await fetch(target, {
    headers: operation === 'files' ? { 'x-studio-browser-secret': secret } : {},
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  });
  const payload = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
  return NextResponse.json(payload, { status: response.status });
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;
  const body = await request.json().catch(() => ({}));
  const command = String(body.command || '').trim();
  if (!command) return NextResponse.json({ error: 'command is required' }, { status: 400 });
  const { url, secret } = await runtimeConfig();
  const response = await fetch(`${url}/workspace/exec`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-studio-browser-secret': secret },
    body: JSON.stringify({
      command,
      args: Array.isArray(body.args) ? body.args : undefined,
      cwd: typeof body.cwd === 'string' ? body.cwd : '',
      timeoutMs: Number(body.timeoutMs || 30_000),
    }),
    signal: AbortSignal.timeout(120_000),
  });
  const payload = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
  return NextResponse.json(payload, { status: response.status });
}
