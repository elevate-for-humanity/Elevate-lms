import { NextRequest, NextResponse } from 'next/server';

const OPENHANDS_API_URL = 'https://app.all-hands.dev/api/v1';

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId } = await request.json();

    const apiKey = process.env.OPENHANDS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenHands not configured' }, { status: 500 });
    }

    if (conversationId) {
      // Continue existing conversation
      const res = await fetch(`${OPENHANDS_API_URL}/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      return NextResponse.json({ success: true, conversationId });
    } else {
      // Start new conversation
      const startRes = await fetch(`${OPENHANDS_API_URL}/conversations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: 'gpt-4.5' }),
      });
      const conv = await startRes.json();
      
      await fetch(`${OPENHANDS_API_URL}/conversations/${conv.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      
      return NextResponse.json({ success: true, conversationId: conv.id });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ready',
    endpoint: '/api/devstudio/openhands/chat',
  });
}