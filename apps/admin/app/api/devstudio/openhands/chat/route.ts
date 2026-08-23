import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import {
  getOpenHandsConfig,
  getOpenHandsLifecycle,
  startOpenHandsTask,
} from '@/lib/devstudio/openhands/client';

export async function POST(request: NextRequest) {
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    const repository = typeof body?.repository === 'string' ? body.repository.trim() : undefined;
    const conversationId = typeof body?.conversationId === 'string' ? body.conversationId.trim() : '';

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    if (conversationId) {
      // The current documented OpenHands Cloud V1 Bearer-key API exposes
      // conversation start/status, but not a documented continuation endpoint.
      // Refuse to fall back to the removed V0 /messages contract.
      return NextResponse.json(
        {
          error: 'OpenHands Cloud V1 conversation continuation is not exposed by the documented Bearer-key API. Start a new conversation instead.',
          status: 'unsupported',
          conversationId,
        },
        { status: 409 },
      );
    }

    const config = getOpenHandsConfig();
    if (!config.configured) {
      return NextResponse.json({ error: 'OpenHands not configured' }, { status: 503 });
    }

    const start = await startOpenHandsTask({
      message,
      repository,
      traceId: request.headers.get('x-correlation-id') || crypto.randomUUID(),
      tags: ['chat'],
    });

    return NextResponse.json(
      {
        success: true,
        provider: 'openhands',
        apiVersion: 'v1',
        startTaskId: start.id,
        conversationId: start.app_conversation_id ?? null,
        status: String(start.status).toUpperCase() === 'READY' ? 'running' : 'queued',
      },
      { status: 202 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'OpenHands chat failed' },
      { status: 502 },
    );
  }
}

export async function GET(request: NextRequest) {
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const config = getOpenHandsConfig();
  const url = new URL(request.url);
  const startTaskId = url.searchParams.get('startTaskId');
  const conversationId = url.searchParams.get('conversationId');

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
    provider: 'openhands',
    apiVersion: 'v1',
    baseUrl: config.origin,
    repository: config.configuredRepository,
    model: config.model,
    endpoint: '/api/devstudio/openhands/chat',
    continuationSupported: false,
  });
}
