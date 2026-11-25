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
  return normalizeRoles([...effectiveRoles]).some((role) =>
    hasPermission(role, 'access_dev_tools'),
  );
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  // Autonomous repository execution is a dev-tool capability. Keep it
  // privileged even though read/chat Studio access is available to admins.
  if (!canAccessDevTools(auth.effectiveRoles)) {
    return NextResponse.json(
      { error: 'Admin dev-tool access is required for autonomous agent execution' },
      { status: 403 },
    );
  }

  // OPENHANDS_REMOVED: OpenHands has been removed. No new OpenHands task
  // can be dispatched from this route (or anywhere else); the owned
  // internal engine is the only repair engine. This is permanent — no
  // environment variable re-enables it. Status reads for historical tasks
  // remain available through GET below.
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
  const taskId = url.searchParams.get('taskId');
  const startTaskId = url.searchParams.get('startTaskId');
  const conversationId = url.searchParams.get('conversationId');

  if (taskId) {
    if (!canAccessDevTools(auth.effectiveRoles)) {
      return NextResponse.json(
        { error: 'Admin dev-tool access is required for autonomous agent status' },
        { status: 403 },
      );
    }
    // Reading a task also triggers a durable reconciliation write, so
    // authorization must be checked before calling the refresher.
    const owned = await findOwnedOpenHandsTask({ actorId: auth.userId, taskId });
    if (!owned) return NextResponse.json({ error: 'OpenHands task not found' }, { status: 404 });
    try {
      const lifecycle = await refreshOpenHandsTask({ taskId: owned.taskId, actorId: auth.userId });
      return NextResponse.json({ success: true, taskId, provider: 'openhands', lifecycle: publicOpenHandsLifecycle(lifecycle) },
        { headers: { 'Cache-Control': 'no-store' } });
    } catch {
      return NextResponse.json(
        { error: 'OpenHands status refresh failed' },
        { status: 502, headers: { 'Cache-Control': 'no-store' } },
      );
    }
  }

  if (startTaskId || conversationId) {
    // External conversation IDs are not scoped to the authenticated user.
    // Require the canonical, owner-scoped taskId instead.
    return NextResponse.json(
      { error: 'Use the owned taskId to query OpenHands status' },
      { status: 400 },
    );
  }

  return NextResponse.json({
    configured: config.configured,
    // Execution is permanently removed: this route reports status for
    // historical tasks only. New work runs on the owned internal engine.
    executable: false,
    removed: true,
    provider: 'openhands',
    apiVersion: 'v1',
    baseUrl: config.origin,
    repository: config.configuredRepository,
    model: config.model,
    capabilities: [
      'code_generation',
      'code_review',
      'bug_fixing',
      'refactoring',
      'testing',
      'status_polling',
    ],
    endpoint: '/api/admin/dev-studio/openhands/agent',
  });
}
