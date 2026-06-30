// POST /api/admin/ai-assistant  — Ellie, the admin AI operations assistant
// DELETE /api/admin/ai-assistant — clear session history
//
// Wired to Ellie in dashboard command center + Dev Studio preview.
// Uses runAITask() → aiChat() with RAG context + knowledge graph injection.
// Conversation history is stored in ai_conversation_memory (keyed by sessionId).

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { runAITask } from '@/lib/ai/orchestrator';
import { getRAGContext } from '@/lib/platform/rag';
import { getKnowledgeGraphContext } from '@/lib/platform/knowledge-graph';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ─── Conversation memory helpers ─────────────────────────────────────────────

interface MemoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

async function loadHistory(sessionId: string): Promise<MemoryMessage[]> {
  try {
    const db = await requireAdminClient();
    const { data } = await db
      .from('ai_conversation_memory')
      .select('messages')
      .eq('session_id', sessionId)
      .maybeSingle();
    return (data?.messages as MemoryMessage[]) ?? [];
  } catch {
    return [];
  }
}

async function saveHistory(
  sessionId: string,
  messages: MemoryMessage[],
  userId: string,
): Promise<void> {
  try {
    const db = await requireAdminClient();
    await db.from('ai_conversation_memory').upsert(
      {
        session_id: sessionId,
        messages,
        user_id: userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'session_id' },
    );
  } catch (err) {
    logger.warn('[ai-assistant] Failed to save conversation history', { err });
  }
}

async function clearHistory(sessionId: string): Promise<void> {
  try {
    const db = await requireAdminClient();
    await db.from('ai_conversation_memory').delete().eq('session_id', sessionId);
  } catch {
    // non-fatal
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  let body: { message?: string; sessionId?: string; provider?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { message, sessionId, provider } = body;
  if (!message?.trim()) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }
  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
  }

  const userId = auth.user.id;

  // Load conversation history
  const history = await loadHistory(sessionId);

  // Retrieve RAG context + knowledge graph for this query (parallel, non-blocking)
  const [ragCtx, kgCtx] = await Promise.allSettled([
    getRAGContext(message),
    Promise.resolve(getKnowledgeGraphContext()),
  ]);

  const ragContext  = ragCtx.status  === 'fulfilled' ? ragCtx.value  : '';
  const kgContext   = kgCtx.status   === 'fulfilled' ? kgCtx.value   : '';

  // Build context object for the orchestrator
  const context: Record<string, unknown> = {
    conversationHistory: history.slice(-10), // last 10 turns
    platformKnowledge: ragContext || undefined,
    knowledgeGraph: kgContext || undefined,
    adminUserId: userId,
  };

  try {
    const result = await runAITask({
      task: 'general_chat',
      prompt: message,
      context,
      userId,
      contextKey: sessionId,
      ...(provider ? { preferredProvider: provider } : {}),
    } as any);

    // Persist updated history
    const updatedHistory: MemoryMessage[] = [
      ...history,
      { role: 'user', content: message },
      { role: 'assistant', content: result.content },
    ];
    // Keep last 40 messages to avoid unbounded growth
    const trimmed = updatedHistory.slice(-40);
    void saveHistory(sessionId, trimmed, userId);

    return NextResponse.json({
      reply: result.content,
      provider: result.provider,
      fromCache: result.fromCache ?? false,
    });
  } catch (err) {
    logger.error('[ai-assistant] runAITask failed', undefined, { err });
    return NextResponse.json(
      { error: 'AI service unavailable. Check provider keys in Dev Studio → Secrets.' },
      { status: 503 },
    );
  }
}

// ─── DELETE — clear session history ──────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  let body: { sessionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (body.sessionId) {
    await clearHistory(body.sessionId);
  }

  return NextResponse.json({ ok: true });
}
