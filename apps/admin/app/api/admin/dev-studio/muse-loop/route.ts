/**
 * POST /api/admin/dev-studio/muse-loop
 *
 * Drive the Muse-style change loop from Dev Studio, without OpenHands:
 *   read base -> create branch -> commit files -> open (draft) PR -> check CI.
 *
 * GET  — returns the Muse integration descriptor and the capability registry.
 * POST — { action: 'plan', ...input } returns the planned steps (no writes).
 *        { action: 'execute', ...input } runs the loop and returns the PR + CI state.
 *
 * Auth: admin/super_admin (apiRequireDevStudio) AND the access_dev_tools
 * permission, same gate as the OpenHands chat route. Never merges to main
 * and never writes to production.
 */
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { hasPermission, normalizeRoles } from '@/lib/rbac/role-matrix';
import { getMuseIntegrationDescriptor } from '@/lib/devstudio/muse-integration';
import { getCapabilityRegistry } from '@/lib/devstudio/capability-registry';
import {
  planMuseLoop,
  runMuseLoop,
  validateMuseLoopInput,
  type MuseLoopInput,
} from '@/lib/devstudio/muse-loop';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

function canAccessDevTools(effectiveRoles: readonly string[]): boolean {
  return normalizeRoles([...effectiveRoles]).some((role) =>
    hasPermission(role, 'access_dev_tools'),
  );
}

export async function GET(request: NextRequest) {
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;
  return NextResponse.json({
    ok: true,
    muse: getMuseIntegrationDescriptor(),
    capabilities: getCapabilityRegistry(),
  });
}

function parseLoopInput(body: unknown): { input?: MuseLoopInput; error?: string } {
  if (!body || typeof body !== 'object') return { error: 'MUSE_LOOP_BODY_REQUIRED' };
  const { branch, title, body: prBody, message, files, base, draft } = body as Record<
    string,
    unknown
  >;
  const input: MuseLoopInput = {
    branch: typeof branch === 'string' ? branch : '',
    title: typeof title === 'string' ? title : '',
    body: typeof prBody === 'string' ? prBody : '',
    message: typeof message === 'string' ? message : '',
    files: Array.isArray(files) ? (files as MuseLoopInput['files']) : [],
    base: typeof base === 'string' ? base : undefined,
    draft: typeof draft === 'boolean' ? draft : undefined,
  };
  const errors = validateMuseLoopInput(input);
  if (errors.length > 0) return { error: errors[0] };
  return { input };
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;
  if (!canAccessDevTools(auth.effectiveRoles)) {
    return NextResponse.json({ error: 'Admin dev-tool access required' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const action = (body as { action?: unknown } | null)?.action;
  if (action !== 'plan' && action !== 'execute') {
    return NextResponse.json({ error: 'MUSE_LOOP_ACTION_REQUIRED' }, { status: 400 });
  }

  const { input, error } = parseLoopInput(body);
  if (error || !input) {
    return NextResponse.json({ error: error ?? 'MUSE_LOOP_INVALID_INPUT' }, { status: 400 });
  }

  try {
    if (action === 'plan') {
      return NextResponse.json({ ok: true, action: 'plan', steps: planMuseLoop(input) });
    }
    const result = await runMuseLoop(input);
    return NextResponse.json({ ok: true, action: 'execute', result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'MUSE_LOOP_FAILED';
    const status = message.startsWith('MUSE_LOOP_GITHUB_HTTP_') ? 502 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
