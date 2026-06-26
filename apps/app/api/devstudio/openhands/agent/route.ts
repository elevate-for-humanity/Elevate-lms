import { NextRequest, NextResponse } from 'next/server';

const OPENHANDS_API_URL = 'https://app.all-hands.dev/api/v1';

export async function POST(request: NextRequest) {
  try {
    const { task, workspace = '/workspace', model = 'gpt-4.5' } = await request.json();

    const apiKey = process.env.OPENHANDS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenHands API key not configured' }, { status: 500 });
    }

    // Start conversation
    const startRes = await fetch(`${OPENHANDS_API_URL}/conversations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, workspace }),
    });

    if (!startRes.ok) {
      return NextResponse.json({ error: 'Failed to start conversation' }, { status: startRes.status });
    }

    const conversation = await startRes.json();

    // Send task
    const msgRes = await fetch(`${OPENHANDS_API_URL}/conversations/${conversation.id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: task }),
    });

    return NextResponse.json({
      success: true,
      conversationId: conversation.id,
      status: 'running',
    });
  } catch (error) {
    return NextResponse.json({ error: 'OpenHands connection failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    configured: !!process.env.OPENHANDS_API_KEY,
    capabilities: ['code_generation', 'code_review', 'bug_fixing', 'refactoring', 'testing'],
  });
}