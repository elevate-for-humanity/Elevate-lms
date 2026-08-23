import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { hasPermission } from '@/lib/rbac/role-matrix';
import { requiresApproval } from '@/lib/devstudio/os/risk';
import { getOpenHandsConfig, getOpenHandsLifecycle } from '@/lib/devstudio/openhands/client';
import { dispatchOpenHandsTask, refreshOpenHandsTask } from '@/lib/devstudio/openhands/runtime';

const CONFIRMATION = 'CONFIRM OPENHANDS EXECUTION';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  // Autonomous repository execution is a dev-tool capability. Keep it
  // privileged even though read/chat Studio access is available to admins.
  if (!hasPermission(auth.role, 'access_dev_tools')) {
    return NextResponse.json({ error: 'Super admin required for autonomous agent execution' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const task = typeof body?.task === 'string' ? body.task.trim() : '';
    const repository = typeof body?.repository === 'string' ? body.repository.trim() : undefined;
    const confirmationText = typeof body?.confirmationText === 'string' ? body.confirmationText : '';

    if (!task) {
      return NextResponse.json({ error: 'task is required' }, { status: 400 });
    }

    const config = getOpenHandsConfig();
    if (!config.configured) {
      return NextResponse.json({ error: 'OpenHands API key not configured' }, { status: 503 });
    }

    // High-impact repository work must still pass Elevate's approval boundary.
    if (requiresApproval(task) && confirmationText !== CONFIRMATION) {
      return NextResponse.json(
        {
          error: 'Human approval is required for this OpenHands engineering task.',
          status: 'approval_required',
          requiredConfirmation: CONFIRMATION,
        },
        { status: 409 },
      );
    }

    const correlationId =
      request.headers.get('x-correlation-id') ||
      request.headers.get('idempotency-key') ||
      crypto.randomUUID();

    const dispatched = await dispatchOpenHandsTask({
      actorId: auth.userId,
      task,
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
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'OpenHands connection failed' },
      { status: 502 },
    );
  }
}

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const config = getOpenHandsConfig();
  const url = new URL(request.url);
  const taskId = url.searchParams.get('taskId');
  const startTaskId = url.searchParams.get('startTaskId');
  const conversationId = url.searchParams.get('conversationId');

  if (taskId) {
    if (!hasPermission(auth.role, 'access_dev_tools')) {
      return NextResponse.json({ error: 'Super admin required for autonomous agent status' }, { status: 403 });
    }
    try {
      const lifecycle = await refreshOpenHandsTask({ taskId, actorId: auth.userId });
      return NextResponse.json({ success: true, taskId, provider: 'openhands', lifecycle });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'OpenHands status refresh failed' },
        { status: 502 },
      );
    }
  }

  if (startTaskId || conversationId) {
    try {
      const lifecycle = await getOpenHandsLifecycle({ startTaskId, conversationId });
      return NextResponse.json({ success: true, provider: 'openhands', lifecycle });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'OpenHands status lookup failed' },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({
    configured: config.configured,
    executable: hasPermission(auth.role, 'access_dev_tools'),
    provider: 'openhands',
    apiVersion: 'v1',
    baseUrl: config.origin,
    repository: config.configuredRepository,
    model: config.model,
    capabilities: ['code_generation', 'code_review', 'bug_fixing', 'refactoring', 'testing', 'status_polling'],
    endpoint: '/api/devstudio/openhands/agent',
  });
}
