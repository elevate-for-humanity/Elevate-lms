/**
 * POST /api/admin/studio/ai-chat
 *
 * Course-aware AI chat with tool execution.
 * Streams text deltas via SSE. When the AI calls a tool, emits a
 * tool_call event so the client can dispatch it to /api/admin/studio/tool-execute.
 *
 * SSE event types:
 *   data: {"type":"delta","content":"..."}
 *   data: {"type":"tool_call","name":"...","args":{...}}
 *   data: [DONE]
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { aiChatWithTools } from '@/lib/ai/ai-service';
import { STUDIO_TOOLS } from '@/lib/studio/tools';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM_BASE = `You are the AI operator embedded in the Elevate LMS Course Studio.
You do not just advise — you act. When a user asks you to create, generate, update, or publish,
call the appropriate tool immediately. Do not ask for confirmation unless the action is destructive.

Your tools:
- createCourse: create a brand-new empty course (draft)
- createLesson: add a lesson to the course
- createModule: add a module to the course
- generateQuiz: create quiz questions for a lesson
- attachVideo: attach a video URL to a lesson
- publishCourse: publish the course (only when explicitly requested)
- updateCourseTitle: update course title or description
- buildCourseFromBlueprint: build a full course from a blueprint (e.g. HVAC EPA 608)

Rules:
- Match content to the course context provided
- For HVAC/EPA/OSHA content, use accurate technical terminology
- After calling a tool, briefly confirm what was done
- If you need a lesson_id or module_id, use the IDs from the course context
- Keep text responses concise`;

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  let body: {
    courseId?: string;
    courseContext?: string;
    messages?: Array<{ role: string; content: string }>;
    activePanel?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { courseId, courseContext, messages = [], activePanel = 'blueprint' } = body;
  if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 });

  const systemPrompt = [
    SYSTEM_BASE,
    courseContext ? `\n--- Current Course Context ---\n${courseContext}` : '',
    `\nActive panel: ${activePanel}`,
  ].filter(Boolean).join('\n');

  const safeMessages = messages
    .filter(m => ['user', 'assistant'].includes(m.role) && typeof m.content === 'string')
    .slice(-12)
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      const send = (obj: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

      try {
        for await (const event of aiChatWithTools({
          model: 'gpt-4.1-mini',
          messages: [{ role: 'system', content: systemPrompt }, ...safeMessages],
          tools: STUDIO_TOOLS as Parameters<typeof aiChatWithTools>[0]['tools'],
          temperature: 0.7,
          maxTokens: 1200,
        })) {
          send(event);
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (err) {
        logger.error('[studio/ai-chat] stream error', err instanceof Error ? err : undefined, { courseId });
        send({ type: 'delta', content: '\n\nSorry, the AI assistant encountered an error. Please try again.' });
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
