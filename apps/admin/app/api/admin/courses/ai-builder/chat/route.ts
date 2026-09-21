/**
 * POST /api/admin/courses/ai-builder/chat
 *
 * Streaming AI chat for the Course Builder. This endpoint is a paid-inference
 * consumer, so every provider call must pass through the durable authorization
 * gateway before the provider is invoked.
 *
 * Body: { messages: { role: 'user'|'assistant', content: string }[] }
 *
 * Response: text/event-stream
 *   data: { type: 'text', content: string }
 *   data: { type: 'course_ready', course: GeneratedCourse }
 *   data: { type: 'done' }
 */

import { NextRequest } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { refreshSecrets } from '@/lib/secrets';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { requireAdminClient } from '@/lib/supabase/admin';
import {
  executePaidInference,
  paidArtifactFingerprint,
  reservePaidInference,
} from '@/lib/ai/paid-inference-gateway';
import { getCourseBuilderCreditOwner } from '@/lib/course-builder/credits';
import { aiChat } from '@/lib/ai/ai-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const SYSTEM_PROMPT = `You are an expert instructional designer for ${PLATFORM_DEFAULTS.orgName}, a workforce development LMS.
Your job is to help admins build professional courses through conversation.

WORKFLOW:
1. When the user describes a course topic, ask 2-3 focused clarifying questions (not all at once):
   - Who is the target learner? (e.g., apprentices, career changers, licensed professionals)
   - What credential or outcome does this course lead to?
   - How many lessons / hours should it be?
   - Any specific state requirements or regulatory standards to cover?

2. Once you have enough context (after 1-2 exchanges), say:
   "I have everything I need. Generating your course now..."
   Then immediately output the course as a JSON block wrapped EXACTLY like this:
   <<<COURSE_JSON>>>
   { ...course object... }
   <<<END_COURSE_JSON>>>

3. The course JSON must follow this exact shape:
{
  "title": "string",
  "subtitle": "string — one sentence",
  "description": "string — 2-3 sentences, learner-facing",
  "audience": "string",
  "duration_hours": number,
  "category": "healthcare|trades|technology|business|transportation|personal-services|tax",
  "passing_score": 70,
  "completion_rule": "all_lessons",
  "modules": [
    {
      "title": "string",
      "sort_order": 1,
      "lessons": [
        {
          "lesson_number": 1,
          "title": "string",
          "description": "string — 1-2 sentences",
          "objectives": ["string"],
          "content": "string — 300-500 words of practical instruction in markdown",
          "content_type": "video",
          "duration_minutes": 20,
          "is_required": true,
          "quiz_questions": [
            {
              "question": "string",
              "options": ["A", "B", "C", "D"],
              "correct_index": 0,
              "explanation": "string"
            }
          ]
        }
      ]
    }
  ]
}

RULES:
- Be conversational and concise. Don't ask more than 3 questions at once.
- If the user gives you enough info upfront, skip straight to generation.
- Content must be specific and practical — no generic filler.
- Each module should have 3-6 lessons.
- Include 3-5 quiz questions per lesson.
- Always generate at least 2 modules.
- After outputting the JSON, add a brief friendly summary of what you built.`;

type CourseBuilderMessage = {
  role: 'user' | 'assistant';
  content: string;
};

function sendSse(controller: ReadableStreamDefaultController<Uint8Array>, encoder: TextEncoder, data: object) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\\n\\n`));
}

function extractCourse(text: string): unknown | null {
  const jsonMatch = text.match(/<<<COURSE_JSON>>>([\\s\\S]*?)<<<END_COURSE_JSON>>>/);
  if (!jsonMatch) return null;
  return JSON.parse(jsonMatch[1].trim());
}

export async function POST(request: NextRequest) {
  try {
    try {
      await refreshSecrets();
    } catch {
      // Secret hydration is best-effort; provider availability is checked below.
    }

    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const auth = await apiRequireAdmin(request);
    if (auth.error) return auth.error;

    const body = (await request.json()) as {
      messages: CourseBuilderMessage[];
    };

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return new Response(JSON.stringify({ error: 'messages required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const messages = body.messages
      .filter(
        (message): message is CourseBuilderMessage =>
          (message?.role === 'user' || message?.role === 'assistant') &&
          typeof message.content === 'string',
      )
      .map((message) => ({
        role: message.role,
        content: message.content.trim(),
      }))
      .filter((message) => message.content.length > 0);

    if (!messages.length) {
      return new Response(JSON.stringify({ error: 'messages required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = await requireAdminClient();
    const creditOwner = await getCourseBuilderCreditOwner({
      db,
      userId: auth.id,
      effectiveRoles: auth.effectiveRoles,
    });
    const tenantId = creditOwner.tenantId ?? null;
    const scopeKey = tenantId ? `tenant:${tenantId}` : 'platform';

    const artifactFingerprint = paidArtifactFingerprint({
      operation: 'course-builder-chat',
      systemPrompt: SYSTEM_PROMPT,
      messages,
    });
    const paidProvider = process.env.AI_PROVIDER?.trim() || 'configured';
    const paidModel =
      process.env.AI_MODEL?.trim() ||
      process.env.GROQ_MODEL?.trim() ||
      process.env.COURSE_BUILDER_MODEL?.trim() ||
      'configured';
    const projectedCostMicros = Math.max(
      0,
      Number(process.env.COURSE_BUILDER_CHAT_PROJECTED_COST_MICROS ?? '100000'),
    );

    const paidAuthorization = await reservePaidInference(db, {
      scopeKey,
      tenantId,
      actorId: auth.id,
      artifactFingerprint,
      idempotencyKey: `course-builder-chat:${artifactFingerprint}`,
      provider: paidProvider,
      model: paidModel,
      operation: 'course-builder-chat',
      projectedCostMicros,
    });

    if (paidAuthorization.decision !== 'approved' || !paidAuthorization.requestId) {
      const message =
        paidAuthorization.decision === 'approval_required'
          ? 'Course Builder AI needs approval before this paid generation can run.'
          : 'Course Builder AI is not authorized to run right now.';
      return new Response(
        JSON.stringify({
          error: message,
          decision: paidAuthorization.decision,
          requestId: paidAuthorization.requestId,
        }),
        {
          status: paidAuthorization.decision === 'budget_exceeded' ? 402 : 409,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          const paidExecution = await executePaidInference({
            db,
            authorize: async () => paidAuthorization,
            dispatch: () =>
              aiChat({
                messages: [
                  { role: 'system', content: SYSTEM_PROMPT },
                  ...messages,
                ],
                temperature: 0.4,
                maxTokens: 8000,
              }),
          });

          if (!paidExecution.value) {
            throw new Error('Course Builder AI completed without a response.');
          }

          const fullText = paidExecution.value.content ?? '';
          if (!fullText.trim()) {
            throw new Error('Course Builder AI returned an empty response.');
          }

          // Preserve the existing streaming UI contract even though the
          // authorization gateway executes one durable, reconciled request.
          const chunkSize = 240;
          const jsonStart = fullText.indexOf('<<<COURSE_JSON>>>');
          const textBeforeJson = jsonStart >= 0 ? fullText.slice(0, jsonStart) : fullText;
          for (let index = 0; index < textBeforeJson.length; index += chunkSize) {
            sendSse(controller, encoder, {
              type: 'text',
              content: textBeforeJson.slice(index, index + chunkSize),
            });
          }

          const course = extractCourse(fullText);
          if (course) {
            sendSse(controller, encoder, { type: 'course_ready', course });
            const jsonEndMarker = '<<<END_COURSE_JSON>>>';
            const jsonEnd = fullText.indexOf(jsonEndMarker);
            const afterJson = jsonEnd >= 0 ? fullText.slice(jsonEnd + jsonEndMarker.length) : '';
            for (let index = 0; index < afterJson.length; index += chunkSize) {
              sendSse(controller, encoder, {
                type: 'text',
                content: afterJson.slice(index, index + chunkSize),
              });
            }
          } else if (jsonStart < 0) {
            // No structured draft yet: return the complete conversational answer.
          } else {
            sendSse(controller, encoder, {
              type: 'text',
              content: '\\n\\nCourse generation produced an invalid structured draft. Please try again.',
            });
          }

          sendSse(controller, encoder, { type: 'done' });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          sendSse(controller, encoder, {
            type: 'error',
            message,
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
