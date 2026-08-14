import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { hasPermission } from '@/lib/rbac/role-matrix';

function getOpenHandsConfig() {
  const apiKey = process.env.OPENHANDS_API_KEY;
  const baseUrl = (process.env.OPENHANDS_API_URL || 'https://app.all-hands.dev/api/v1').replace(/\/$/, '');
  const model = process.env.OPENHANDS_MODEL || process.env.OPENAI_MODEL || 'gpt-4.1';
  return { apiKey, baseUrl, model };
}

export async function POST(request: NextRequest) {
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  // Autonomous repository execution is a dev-tool capability. Keep it
  // super-admin-only even though read/chat Studio access is available to admin.
  if (!hasPermission(auth.role, 'access_dev_tools')) {
    return NextResponse.json({ error: 'Super admin required for autonomous agent execution' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const task = typeof body?.task === 'string' ? body.task.trim() : '';
    const workspace = typeof body?.workspace === 'string' && body.workspace.trim()
      ? body.workspace.trim()
      : '/workspace';

    if (!task) {
      return NextResponse.json({ error: 'task is required' }, { status: 400 });
    }

    const { apiKey, baseUrl, model: configuredModel } = getOpenHandsConfig();
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenHands API key not configured' }, { status: 503 });
    }

    const headers = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };

    const startRes = await fetch(`${baseUrl}/conversations`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ model: configuredModel, workspace }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!startRes.ok) {
      return NextResponse.json({ error: 'Failed to start OpenHands conversation' }, { status: startRes.status });
    }

    const conversation = await startRes.json();
    if (!conversation?.id) {
      return NextResponse.json({ error: 'OpenHands returned no conversation id' }, { status: 502 });
    }

    const msgRes = await fetch(`${baseUrl}/conversations/${encodeURIComponent(conversation.id)}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message: task }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!msgRes.ok) {
      return NextResponse.json({ error: 'Failed to submit OpenHands task' }, { status: msgRes.status });
    }

    return NextResponse.json({
      success: true,
      conversationId: conversation.id,
      status: 'running',
      provider: 'openhands',
    });
  } catch {
    return NextResponse.json({ error: 'OpenHands connection failed' }, { status: 502 });
  }
}

export async function GET(request: NextRequest) {
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const { apiKey, baseUrl, model } = getOpenHandsConfig();
  return NextResponse.json({
    configured: !!apiKey,
    executable: hasPermission(auth.role, 'access_dev_tools'),
    provider: 'openhands',
    baseUrl,
    model,
    capabilities: ['code_generation', 'code_review', 'bug_fixing', 'refactoring', 'testing'],
  });
}
