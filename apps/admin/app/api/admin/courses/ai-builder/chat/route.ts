/**
 * POST /api/admin/courses/ai-builder/chat
 *
 * Streaming AI chat for the course builder. The AI acts as an instructional
 * designer — it asks clarifying questions, then when it has enough context,
 * it generates a complete course draft and returns it as structured JSON
 * embedded in the stream.
 *
 * Body: { messages: { role: 'user'|'assistant', content: string }[] }
 *
 * Response: text/event-stream
 *   data: { type: 'text', content: string }
 *   data: { type: 'course_ready', course: GeneratedCourse }
 *   data: { type: 'done' }
 */

import { NextRequest } from 'next/server';
import { getOpenAIClient } from '@/lib/ai/openai-client';
import { getGroqClient } from '@/lib/ai/groq-client';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { refreshSecrets } from '@/lib/secrets';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

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

export async function POST(request: NextRequest) {
  try { await refreshSecrets(); } catch { /* non-fatal */ }

  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { messages } = (await request.json()) as {
    messages: { role: 'user' | 'assistant'; content: string }[];
  };

  if (!messages?.length) {
    return new Response(JSON.stringify({ error: 'messages required' }), { status: 400 });
  }

  // Prefer Groq (fast, free tier) — fall back to OpenAI
  const useGroq = !!process.env.GROQ_API_KEY;
  const useOpenAI = !!process.env.OPENAI_API_KEY;

  if (!useGroq && !useOpenAI) {
    return new Response(
      JSON.stringify({ error: 'No AI provider configured. Add GROQ_API_KEY or OPENAI_API_KEY in Dev Studio → Secrets.' }),
      { status: 503 }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const allMessages = [{ role: 'system' as const, content: SYSTEM_PROMPT }, ...messages];

        let completion: AsyncIterable<any>;

        if (useGroq) {
          const groq = getGroqClient();
          completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: allMessages,
            temperature: 0.4,
            max_tokens: 8000,
            stream: true,
          });
        } else {
          const openai = getOpenAIClient();
          completion = await openai.chat.completions.create({
            model: 'gpt-4.1',
            messages: allMessages,
            temperature: 0.4,
            max_tokens: 8000,
            stream: true,
          });
        }

        let fullText = '';

        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta?.content ?? '';
          if (!delta) continue;
          fullText += delta;

          // Stream text to client, but hold back the JSON block
          if (!fullText.includes('<<<COURSE_JSON>>>')) {
            send({ type: 'text', content: delta });
          } else {
            // We're inside or past the JSON block — only stream text after it
            const afterJson = fullText.split('<<<END_COURSE_JSON>>>')[1] ?? '';
            if (afterJson && delta) {
              send({ type: 'text', content: delta });
            }
          }
        }

        // Extract course JSON if present
        const jsonMatch = fullText.match(/<<<COURSE_JSON>>>([\s\S]*?)<<<END_COURSE_JSON>>>/);
        if (jsonMatch) {
          try {
            const course = JSON.parse(jsonMatch[1].trim());
            send({ type: 'course_ready', course });
          } catch {
            send({
              type: 'text',
              content: '\n\n⚠️ Course generation produced invalid JSON. Please try again.',
            });
          }
        }

        send({ type: 'done' });
      } catch (err: any) {
        send({ type: 'error', message: err.message });
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
}
