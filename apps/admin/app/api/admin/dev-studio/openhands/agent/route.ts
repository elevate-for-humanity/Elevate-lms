import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { hasPermission, normalizeRoles } from '@/lib/rbac/role-matrix';
import { buildOpenHandsContextPrompt } from '@/lib/devstudio/openhands/context';
import {
  getHydratedOpenHandsConfig,
} from '@/lib/devstudio/openhands/client';
import { dispatchOpenHandsTask, refreshOpenHandsTask } from '@/lib/devstudio/openhands/runtime';
import { findOwnedOpenHandsTask } from '@/lib/devstudio/openhands/task-access';
import { publicOpenHandsLifecycle } from '@/lib/devstudio/openhands/public-lifecycle';
import { isOpenHandsOptedIn } from '@/lib/devstudio/openhands-opt-in';

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

  // OpenHands is opt-in-only (PARIS_REPAIR_ENGINE=openhands). New dispatches
  // fail closed without the opt-in; use the owned engine instead.
  if (!isOpenHandsOptedIn()) {
    return NextResponse.json(
      { error: 'OpenHands is opt-in only; set PARIS_REPAIR_ENGINE=openhands to enable it' },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const task = typeof body?.task === 'string' ? body.task.trim() : '';
    const repository = typeof body?.repository === 'string' ? body.repository.trim() : undefined;

    if (!task) {
      return NextResponse.json({ error: 'task is required' }, { status: 400 });
    }

    const config = await getHydratedOpenHandsConfig();
    if (!config.configured) {
      return NextResponse.json({ error: 'OpenHands API key not configured' }, { status: 503 });
    }

    const correlationId =
      request.headers.get('x-correlation-id') ||
      request.headers.get('idempotency-key') ||
      crypto.randomUUID();
    const contextPrompt = await buildOpenHandsContextPrompt({
      goal: task,
      actorId: auth.userId,
      tenantId: null,
    });
    const governedTask = `${task}\n\n${contextPrompt}`;

    const dispatched = await dispatchOpenHandsTask({
      actorId: auth.userId,
      task: governedTask,
      repository,
      correlationId,
      tenantId: null,
    });

    return NextResponse.json(
      {
        success: true,
        taskId: dispatched.taskId,
        startTaskId: dispatched.startTaskId,
        conversationId: dispatched.conversationId ?? null,
        status: dispatched.status,
        provider: 'openhands',
        apiVersion: 'v1',
      },
      { status: 202 },
    );
  } catch {
    return NextResponse.json(
      { error: 'OpenHands connection failed' },
      { status: 502 },
    );
  }
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
    // Executable only with the explicit OpenHands opt-in; otherwise the
    // owned engine is the execution path and this route reports status only.
    executable: canAccessDevTools(auth.effectiveRoles) && isOpenHandsOptedIn(),
    optInRequired: !isOpenHandsOptedIn(),
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
