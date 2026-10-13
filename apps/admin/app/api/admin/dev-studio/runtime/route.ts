import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { hydrateProcessEnv } from '@/lib/secrets';
import { requireAdminClient } from '@/lib/supabase/admin';
import { recordMasterStudioArtifact } from '@/lib/studio/master-runtime';

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
    : operation === 'terminal-output'
      ? `${url}/workspace/terminal/${encodeURIComponent(request.nextUrl.searchParams.get('sessionId') || '')}/output?after=${encodeURIComponent(request.nextUrl.searchParams.get('after') || '0')}`
      : `${url}/health`;
  const response = await fetch(target, {
    headers: operation === 'files' || operation === 'terminal-output' ? { 'x-studio-browser-secret': secret } : {},
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
  const operation = String(body.operation || 'exec');
  if (!['exec','repository-sync','terminal-create','terminal-input','terminal-stop','file-write'].includes(operation))
    return NextResponse.json({error:'Unsupported Studio runtime operation'},{status:400});
  const command = String(body.command || '').trim();
  if (operation === 'exec' && !command) return NextResponse.json({ error: 'command is required' }, { status: 400 });
  const runId = typeof body.studioRunId === 'string' ? body.studioRunId : '';
  const stepId = typeof body.studioRunStepId === 'string' ? body.studioRunStepId : undefined;
  if (runId) {
    const db=await requireAdminClient();
    const {data:ownedRun,error}=await db.from('studio_runs').select('id')
      .eq('id',runId).eq('user_id',auth.id).maybeSingle();
    if(error) return NextResponse.json({error:'Studio run lookup failed'},{status:503});
    if(!ownedRun) return NextResponse.json({error:'Studio run is not owned by this operator'},{status:403});
  }
  const { url, secret } = await runtimeConfig();
  const target = operation === 'file-write' ? `${url}/workspace/file`
    : operation === 'terminal-stop' ? `${url}/workspace/terminal/${encodeURIComponent(String(body.sessionId || ''))}`
    : operation === 'repository-sync'
    ? `${url}/workspace/repository/sync`
    : operation === 'terminal-create'
      ? `${url}/workspace/terminal`
      : operation === 'terminal-input'
        ? `${url}/workspace/terminal/${encodeURIComponent(String(body.sessionId || ''))}/input`
        : `${url}/workspace/exec`;
  const response = await fetch(target, {
    method: operation === 'file-write' ? 'PUT' : operation === 'terminal-stop' ? 'DELETE' : 'POST',
    headers: { 'content-type': 'application/json', 'x-studio-browser-secret': secret },
    body: operation === 'terminal-stop' ? undefined : JSON.stringify(operation === 'file-write' ? {path:body.path,content:body.content}
      : operation === 'repository-sync'
      ? { repoUrl: body.repoUrl, branch: body.branch }
      : operation === 'terminal-input'
        ? { data: body.data }
        : operation === 'terminal-create'
          ? {}
          : {
              command,
              args: Array.isArray(body.args) ? body.args : undefined,
              cwd: typeof body.cwd === 'string' ? body.cwd : '',
              timeoutMs: Number(body.timeoutMs || 30_000),
            }),
    signal: AbortSignal.timeout(120_000),
  });
  const payload = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
  if (response.ok && runId) {
    const db = await requireAdminClient();
    await recordMasterStudioArtifact(db, {
      runId,
      stepId,
      type: operation === 'repository-sync' ? 'repository-checkpoint' : operation.startsWith('terminal') ? 'terminal-checkpoint' : 'runtime-execution',
      name: operation,
      status: operation === 'exec' ? (payload.exitCode === 0 ? 'verified' : 'failed')
        : operation.startsWith('terminal') ? 'generated' : 'verified',
      metadata: {
        operation,
        command: operation === 'exec' ? command : undefined,
        result: payload,
      },
      evidence: [{ source: 'master-studio-runtime', captured_at: new Date().toISOString() }],
    }).catch(() => undefined);
  }
  return NextResponse.json(payload, { status: response.status });
}
