/**
 * HVAC AI Instructor endpoint — Marcus Johnson
 *
 * Accepts a conversation history + lesson context.
 * Builds a lesson-specific system prompt so Marcus knows exactly
 * what he's teaching, then calls Gemini and returns his response.
 */

import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { buildLessonContext, buildMarcusSystemPrompt, lessonContextSummary } from '@/lib/ai-instructor/hvac-instructor-prompt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

async function callGemini(
  messages: ChatMessage[],
  systemPrompt: string,
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
  };

  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
      );
      if (!res.ok) {
        if (res.status === 429) continue; // rate limited — try next model
        logger.error(`Gemini ${model} error: ${res.status}`);
        continue;
      }
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text.trim();
    } catch (err) {
      logger.error(`Gemini ${model} exception`, err as Error);
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
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
      return NextResponse.json({ error: 'lessonNumber and lessonTitle are required' }, { status: 400 });
    }

    const ctx = buildLessonContext(lessonNumber, lessonTitle);
    const systemPrompt = buildMarcusSystemPrompt(ctx);

    logger.info(`Marcus teaching: ${lessonContextSummary(ctx)}`);

    // For the opening message, send a trigger so Marcus introduces himself
    const conversationMessages: ChatMessage[] = isOpening
      ? [{ role: 'user', content: `[LESSON START] I am starting Lesson ${lessonNumber}: ${lessonTitle}. Please introduce yourself and this lesson.` }]
      : messages;

    if (!conversationMessages.length) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
    }

    const reply = await callGemini(conversationMessages, systemPrompt);

    if (!reply) {
      // Gemini unavailable — return a useful fallback so the lesson still works
      const fallback = isOpening
        ? `I'm Marcus Johnson, your HVAC instructor. Today we're covering "${lessonTitle}". Before I dive in — what do you already know about this topic? Even if the answer is nothing, that's fine. Tell me where you're starting from.`
        : `I'm having trouble connecting right now. Review the lesson content above, then come back and ask me a specific question about what you don't understand.`;
      return NextResponse.json({ message: fallback, fallback: true });
    }

    return NextResponse.json({ message: reply });
  } catch (err) {
    logger.error('HVAC instructor route error', err as Error);
    return NextResponse.json({ error: 'Instructor unavailable' }, { status: 500 });
  }
}
