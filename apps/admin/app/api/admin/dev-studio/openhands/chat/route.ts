import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { hasPermission, normalizeRoles } from '@/lib/rbac/role-matrix';
import {
  getHydratedOpenHandsConfig,
} from '@/lib/devstudio/openhands/client';
import { refreshOpenHandsTask } from '@/lib/devstudio/openhands/runtime';
import { findOwnedOpenHandsTask } from '@/lib/devstudio/openhands/task-access';
import { publicOpenHandsLifecycle } from '@/lib/devstudio/openhands/public-lifecycle';

function canAccessDevTools(effectiveRoles: readonly string[]): boolean {
  return normalizeRoles([...effectiveRoles]).some(role =>
    hasPermission(role, 'access_dev_tools'),
  );
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;
  if (!canAccessDevTools(auth.effectiveRoles)) {
    return NextResponse.json({ error: 'Admin dev-tool access required' }, { status: 403 });
  }

  // OPENHANDS_REMOVED: OpenHands has been removed. No new OpenHands task
  // can be dispatched and no existing provider conversation can be
  // continued from this route (or anywhere else); the owned internal
  // engine is the only repair engine. This is permanent — no environment
  // variable re-enables it. Status reads for historical tasks remain
  // available through GET below.
  return NextResponse.json(
    {
      error: 'OpenHands has been removed; the owned internal engine is the only repair engine',
      code: 'OPENHANDS_REMOVED',
    },
    { status: 410 },
  );
}

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const config = await getHydratedOpenHandsConfig();
  const url = new URL(request.url);
  const startTaskId = url.searchParams.get('startTaskId');
  const conversationId = url.searchParams.get('conversationId');
  const taskId = url.searchParams.get('taskId');

  if (taskId || startTaskId || conversationId) {
    if (!canAccessDevTools(auth.effectiveRoles)) {
      return NextResponse.json({ error: 'Admin dev-tool access required' }, { status: 403 });
    }
    const owned = await findOwnedOpenHandsTask({
      actorId: auth.userId,
      taskId: taskId ?? '',
      startTaskId,
      conversationId,
    });
    if (!owned) return NextResponse.json({ error: 'OpenHands task not found' }, { status: 404 });
    if (!owned.startTaskId && !owned.conversationId) {
      return NextResponse.json({ error: 'OpenHands start is not confirmed' }, { status: 409 });
    }
    try {
      // Reconciliation persists the provider-issued conversation ID before
      // a later follow-up can prove ownership against the canonical ledger.
      const lifecycle = await refreshOpenHandsTask({
        taskId: owned.taskId,
        actorId: auth.userId,
      });
      return NextResponse.json({ success: true, provider: 'openhands', taskId: owned.taskId, lifecycle: publicOpenHandsLifecycle(lifecycle) },
        { headers: { 'Cache-Control': 'no-store' } });
    } catch {
      return NextResponse.json(
        { error: 'OpenHands status lookup failed' },
        { status: 502, headers: { 'Cache-Control': 'no-store' } },
      );
    }
  }

  return NextResponse.json({
    configured: config.configured,
    provider: 'openhands',
    apiVersion: 'v1',
    baseUrl: config.origin,
    repository: config.configuredRepository,
    model: config.model,
    endpoint: '/api/admin/dev-studio/openhands/chat',
    continuationSupported: false,
  });
}
