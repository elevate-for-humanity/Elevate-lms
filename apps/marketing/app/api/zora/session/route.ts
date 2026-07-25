/**
 * ZORA Session Management (simplified)
 * Manages career guidance chat sessions on the marketing site.
 * Uses lightweight in-memory sessions — no database required.
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Simple in-memory session store (per-deployment, marketing site)
// For persistent sessions, upgrade to Supabase-backed sessions.
const sessions = new Map<string, { id: string; messages: unknown[]; createdAt: string }>();

// GET /api/zora/session — Get or create a session
async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');

  try {
    if (sessionId && sessions.has(sessionId)) {
      const session = sessions.get(sessionId)!;
      return NextResponse.json({ session, messages: session.messages });
    }

    // Create a new lightweight session
    const id = `zora-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const session = { id, messages: [], createdAt: new Date().toISOString() };
    sessions.set(id, session);

    logger.info('[zora] New session created', { sessionId: id });

    return NextResponse.json({ session, messages: [] });

  } catch (error) {
    logger.error('[zora] Session error', { error });
    return NextResponse.json({ error: 'Failed to access session' }, { status: 500 });
  }
}

export { _GET as GET };
