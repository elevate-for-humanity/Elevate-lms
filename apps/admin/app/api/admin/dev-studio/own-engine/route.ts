/**
 * POST /api/admin/dev-studio/own-engine
 *
 * Run the owned engine end to end, without OpenHands:
 *   prompt (owned model) -> verify -> retry -> hands (draft PR + CI check).
 *
 * GET  — returns the own-engine descriptor and the capability registry.
 * POST — { action: 'plan', goal, branch, title, ... } returns the planned
 *        steps (no model call, no ledger write).
 *        { action: 'execute', goal, branch, title, ... } runs the loop.
 *        repairId is optional: when omitted, a PARIS ledger row is created
 *        for this repair first (fails closed when the PARIS autopilot
 *        policy is disabled).
 *
 * Auth: admin/super_admin (apiRequireDevStudio) AND the access_dev_tools
 * permission, same gate as the muse-loop route. Never merges to main and
 * never writes to production.
 */

import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { hasPermission, normalizeRoles } from '@/lib/rbac/role-matrix';
import { runAITask } from '@/lib/ai/orchestrator';
import { runMuseLoop } from '@/lib/devstudio/muse-loop';
import { getCapabilityRegistry } from '@/lib/devstudio/capability-registry';
import {
  OWN_ENGINE_MAX_ATTEMPTS,
  planOwnEngineLoop,
  runOwnEngineLoop,
  type OwnEngineTaskInput,
} from '@/lib/devstudio/own-engine/agent-loop';
import {
  createOwnEngineRepair,
  createParisOwnEngineLedger,
} from '@/lib/devstudio/own-engine/paris-ledger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// One owned-model call can take up to 210s; two attempts plus the
// branch/commit/PR calls fit in 300s. Deeper retries re-invoke the route.
export const maxDuration = 300;

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
    engine: {
      id: 'own-engine',
      brain: 'elevate-local (Qwen2.5-7B-Instruct Q4_K_M, owned CPU worker)',
      router: "runAITask({ task: 'code_repair' }, providerPolicy 'owned-only')",
      loop: 'lib/devstudio/own-engine/agent-loop.ts',
      gate: 'PARIS approval (paris_autopilot_policy + paris_code_repairs)',
      hands: 'lib/devstudio/muse-loop.ts (draft PR only, never merges)',
      openhands: 'removed; the owned engine is the only repair engine',
    },
    capabilities: getCapabilityRegistry(),
  });
}

function parseBody(body: unknown): { input?: OwnEngineTaskInput; repairId?: string; error?: string } {
  if (!body || typeof body !== 'object') return { error: 'OWN_ENGINE_BODY_REQUIRED' };
  const record = body as Record<string, unknown>;
  const goal = typeof record.goal === 'string' ? record.goal.trim() : '';
  const branch = typeof record.branch === 'string' ? record.branch.trim() : '';
  const title = typeof record.title === 'string' ? record.title.trim() : '';
  const repairId = typeof record.repairId === 'string' ? record.repairId.trim() : '';
  if (!goal) return { error: 'OWN_ENGINE_GOAL_REQUIRED' };
  if (!branch) return { error: 'OWN_ENGINE_INVALID_BRANCH' };
  if (!title) return { error: 'OWN_ENGINE_TITLE_REQUIRED' };
  const maxAttempts =
    typeof record.maxAttempts === 'number' && Number.isFinite(record.maxAttempts)
      ? Math.min(OWN_ENGINE_MAX_ATTEMPTS, Math.max(1, Math.floor(record.maxAttempts)))
      : 2;
  return {
    repairId: repairId || undefined,
    input: {
      goal,
      // Filled in by the POST handler once the ledger row exists.
      repairId: repairId || 'pending',
      actorId: 'pending',
      branch,
      title,
      body: typeof record.body === 'string' ? record.body : undefined,
      message: typeof record.message === 'string' ? record.message : undefined,
      base: typeof record.base === 'string' ? record.base : undefined,
      repoContext: typeof record.repoContext === 'string' ? record.repoContext : undefined,
      maxAttempts,
    },
  };
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
    return NextResponse.json({ error: 'OWN_ENGINE_ACTION_REQUIRED' }, { status: 400 });
  }

  const { input, repairId, error } = parseBody(body);
  if (error || !input) {
    return NextResponse.json({ error: error ?? 'OWN_ENGINE_INVALID_INPUT' }, { status: 400 });
  }

  try {
    if (action === 'plan') {
      return NextResponse.json({ ok: true, action: 'plan', steps: planOwnEngineLoop(input) });
    }

    // Execute: create the PARIS ledger row first when the caller did not
    // supply one, then run the loop against it. The policy check inside
    // createOwnEngineRepair fails closed when PARIS approval is disabled.
    const resolvedRepairId =
      repairId ?? (await createOwnEngineRepair({ goal: input.goal, actorId: auth.userId, branch: input.branch }));
    const result = await runOwnEngineLoop(
      { ...input, repairId: resolvedRepairId, actorId: auth.userId },
      {
        runTask: runAITask,
        executeHands: runMuseLoop,
        ledger: createParisOwnEngineLedger(),
      },
    );
    return NextResponse.json({ ok: true, action: 'execute', result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'OWN_ENGINE_FAILED';
    const status = message.startsWith('OWN_ENGINE_MODEL_NOT_CONFIGURED') ||
      message.startsWith('OWN_ENGINE_PROVIDER_NOT_OWNED')
      ? 503
      : message.startsWith('OWN_ENGINE_APPROVAL_REQUIRED')
        ? 409
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
