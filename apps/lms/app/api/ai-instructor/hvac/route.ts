import { aiChat } from '@/lib/ai/ai-service';
import { PARIS_SYSTEM_IDENTITY } from '@/lib/ai/paris-identity';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { logger } from '@/lib/logger';
/**
 * HVAC AI Instructor endpoint — Marcus Johnson
 *
 * Accepts a conversation history + lesson context.
 * Builds a lesson-specific system prompt so Marcus knows exactly
 * what he is teaching, then uses PARIS's shared inference gateway.
 */

import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { getErrorContext, normalizeError } from '@/lib/errors/normalize-error';
import {
  buildLessonContext,
  buildMarcusSystemPrompt,
  lessonContextSummary,
} from '@/lib/ai-instructor/hvac-instructor-prompt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}


async function handlePOST(req: NextRequest) {
  // Require authenticated session — prevents open AI quota drain
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  try {
    const body = await req.json();
    const {
      messages,
      lessonNumber,
      lessonTitle,
      isOpening = false,
    }: {
      messages: ChatMessage[];
      lessonNumber: number;
      lessonTitle: string;
      isOpening?: boolean;
    } = body;

    if (!lessonNumber || !lessonTitle) {
      return NextResponse.json(
        { error: 'lessonNumber and lessonTitle are required' },
        { status: 400 },
      );
    }

    const ctx = buildLessonContext(lessonNumber, lessonTitle);
    const systemPrompt = buildMarcusSystemPrompt(ctx);

    logger.info(`Marcus teaching: ${lessonContextSummary(ctx)}`);

    // For the opening message, send a trigger so Marcus introduces himself
    const conversationMessages: ChatMessage[] = isOpening
      ? [
          {
            role: 'user',
            content: `[LESSON START] I am starting Lesson ${lessonNumber}: ${lessonTitle}. Please introduce yourself and this lesson.`,
          },
        ]
      : Array.isArray(messages) ? messages.filter((message) => message && ['user','assistant'].includes(message.role) && typeof message.content === 'string').slice(-20).map(message => ({...message,content:message.content.slice(0,6000)})) : [];

    if (!conversationMessages.length) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
    }

    const response = await aiChat({
      messages:[{role:'system',content:PARIS_SYSTEM_IDENTITY+'\n\nHVAC teaching requirements:\n'+systemPrompt},...conversationMessages],
      temperature:0.7,maxTokens:1024,
    });
    const reply=response.content?.trim();
    if(!reply) return NextResponse.json({error:'Instructor returned no response.'},{status:503});

    return NextResponse.json({ message: reply });
  } catch (err) {
    logger.error('HVAC instructor route error', normalizeError(err, 'HVAC instructor error'), getErrorContext(err));
    return NextResponse.json({ error: 'Instructor unavailable' }, { status: 503 });
  }
}

export const POST=withApiAudit('/api/ai-instructor/hvac',handlePOST);
