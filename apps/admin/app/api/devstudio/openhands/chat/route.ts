import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';

function getOpenHandsConfig() {
  const apiKey = process.env.OPENHANDS_API_KEY;
  const baseUrl = (process.env.OPENHANDS_API_URL || 'https://app.all-hands.dev/api/v1').replace(/\/$/, '');
  const model = process.env.OPENHANDS_MODEL || process.env.OPENAI_MODEL || 'gpt-4.1';
  return { apiKey, baseUrl, model };
}

export async function POST(request: NextRequest) {
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  try {
    const { message, conversationId } = await request.json();
    if (typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    const { apiKey, baseUrl, model } = getOpenHandsConfig();
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenHands not configured' }, { status: 503 });
    }

    const headers = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };

    if (conversationId) {
      const res = await fetch(`${baseUrl}/conversations/${encodeURIComponent(conversationId)}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: message.trim() }),
        signal: AbortSignal.timeout(60_000),
      });
      if (!res.ok) {
        return NextResponse.json({ error: 'OpenHands message failed' }, { status: res.status });
      }
      return NextResponse.json({ success: true, conversationId });
    }

    const startRes = await fetch(`${baseUrl}/conversations`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ model }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!startRes.ok) {
      return NextResponse.json({ error: 'Failed to start OpenHands conversation' }, { status: startRes.status });
    }

    const conv = await startRes.json();
    if (!conv?.id) {
      return NextResponse.json({ error: 'OpenHands returned no conversation id' }, { status: 502 });
    }

    const messageRes = await fetch(`${baseUrl}/conversations/${encodeURIComponent(conv.id)}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message: message.trim() }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!messageRes.ok) {
      return NextResponse.json({ error: 'OpenHands message failed' }, { status: messageRes.status });
    }

    return NextResponse.json({ success: true, conversationId: conv.id });
  } catch {
    return NextResponse.json({ error: 'OpenHands chat failed' }, { status: 502 });
  }
}

export async function GET(request: NextRequest) {
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const { apiKey, baseUrl, model } = getOpenHandsConfig();
  return NextResponse.json({
    configured: !!apiKey,
    provider: 'openhands',
    baseUrl,
    model,
    endpoint: '/api/devstudio/openhands/chat',
  });
}
