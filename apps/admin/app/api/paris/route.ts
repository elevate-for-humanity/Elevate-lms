/**
 * PARIS — internal Admin career/admissions guidance route.
 * Public prospect chat lives on Marketing; this Admin endpoint requires auth.
 */

import { NextRequest, NextResponse } from 'next/server';
import { executeAiTask } from '@/lib/ai/execute-ai-task';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { apiAuthGuard } from '@/lib/admin/guards';
import type { ChatMessage } from '@/lib/ai/types';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    const auth = await apiAuthGuard(req);
    if (auth.error) return auth.error;

    const { message, history = [], sessionId } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: 'Message too long (max 2000 characters)' }, { status: 400 });
    }

    const contextUserId = auth.id;
    let userContext = '';
    try {
      const supabase = await createClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, role')
        .eq('id', contextUserId)
        .maybeSingle();
      if (profile) userContext = `Authenticated staff user: ${profile.full_name ?? profile.email ?? contextUserId}.`;
    } catch (error) {
      logger.debug('[paris] Could not load staff profile context', { error: String(error) });
    }

    const conversationHistory: ChatMessage[] = Array.isArray(history)
      ? history
          .filter((item: any) => item && ['user', 'assistant'].includes(item.role) && typeof item.content === 'string')
          .slice(-20)
          .map((item: any) => ({ role: item.role, content: item.content.slice(0, 4000) }))
      : [];

    const enrichedMessage = `${userContext}\nYou are PARIS, supporting admissions and career guidance. Do not invent approvals, funding eligibility, enrollment status, prices or program facts.\n\n${message}`;

    const result = await executeAiTask({
      task: 'career_counseling',
      prompt: enrichedMessage,
      context: {
        history: conversationHistory,
        userId: contextUserId,
        sessionId,
      },
    });

    logger.info('[paris] Admin guidance message processed', {
      userId: contextUserId,
      sessionId,
      messageLength: message.length,
      responseLength: result.content.length,
      tokensUsed: result.tokensUsed,
    });

    return NextResponse.json({
      response: result.content,
      sessionId,
      provider: result.provider,
    });
  } catch (error) {
    logger.error('[paris] Admin guidance error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Something went wrong. Please try again or contact support@elevateforhumanity.org' },
      { status: 500 },
    );
  }
}

export const POST = withApiAudit('/api/paris', _POST);
