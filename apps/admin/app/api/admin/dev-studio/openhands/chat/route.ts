import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { hasPermission, normalizeRoles } from '@/lib/rbac/role-matrix';
import {
  getHydratedOpenHandsConfig,
  sendOpenHandsMessage,
} from '@/lib/devstudio/openhands/client';
import { dispatchOpenHandsTask, refreshOpenHandsTask } from '@/lib/devstudio/openhands/runtime';
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

  try {
    const body = await request.json();
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    const repository = typeof body?.repository === 'string' ? body.repository.trim() : undefined;
    const conversationId = typeof body?.conversationId === 'string' ? body.conversationId.trim() : '';
    const taskId = typeof body?.taskId === 'string' ? body.taskId.trim() : '';

    if (!message) return NextResponse.json({ error: 'message is required' }, { status: 400 });

    const config = await getHydratedOpenHandsConfig();
    if (!config.configured) {
      return NextResponse.json({ error: 'OpenHands not configured' }, { status: 503 });
    }

    if (conversationId) {
      // A provider conversation ID is not an access token. Require the same
      // authenticated owner and the exact persisted external conversation.
      const task = await findOwnedOpenHandsTask({ actorId: auth.userId, taskId, conversationId });
      if (!task) return NextResponse.json({ error: 'OpenHands task not found' }, { status: 404 });
      if (!['running', 'queued'].includes(task.status)) {
        return NextResponse.json({
          error: 'This OpenHands task is not active; a new approved run is required',
        }, { status: 409 });
      }
      const result = await sendOpenHandsMessage(conversationId, message);
      return NextResponse.json({
        success: true,
        provider: 'openhands',
        apiVersion: 'v1',
        taskId: task.taskId,
        conversationId,
        status: 'running',
        sandboxStatus: result.sandbox_status ?? null,
        message: result.message ?? null,
      });
    }

    if (taskId) {
      return NextResponse.json({ error: 'conversationId is required to continue a task' }, { status: 400 });
    }

    // Chat must create the same canonical task record as Admin engineering
    // dispatch. Direct Cloud starts created unowned, untracked conversations.
    const dispatched = await dispatchOpenHandsTask({
      actorId: auth.userId,
      task: message,
      repository,
      correlationId: request.headers.get('idempotency-key') ||
        request.headers.get('x-correlation-id') ||
        crypto.randomUUID(),
      tenantId: null,
    });
    return NextResponse.json({
      success: true,
      provider: 'openhands',
      apiVersion: 'v1',
      taskId: dispatched.taskId,
      startTaskId: dispatched.startTaskId,
      conversationId: dispatched.conversationId ?? null,
      status: dispatched.status,
    }, { status: 202 });
  } catch {
    return NextResponse.json(
      { error: 'OpenHands chat failed' },
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
    continuationSupported: true,
  });
}
