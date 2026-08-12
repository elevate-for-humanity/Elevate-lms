/**
 * Canonical streaming AI course-design chat.
 * Conversation produces a reviewable structured course; persistence is handled by /chat/save.
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getOpenAIClient } from '@/lib/ai/openai-client';
import { getGroqClient } from '@/lib/ai/groq-client';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { refreshSecrets } from '@/lib/secrets';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const BodySchema = z.object({
  messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(30000) })).min(1).max(60),
});

const SYSTEM_PROMPT = `You are an expert instructional designer for ${PLATFORM_DEFAULTS.orgName}, a workforce development LMS.
Help an admin design a professional, job-ready course through conversation.

WORKFLOW:
1. Ask focused clarifying questions only when required: target learner, credential/outcome, total hours, state/regulatory standard, delivery format.
2. Once enough context exists, say: "I have everything I need. Generating your course now..."
3. Then output the course JSON wrapped EXACTLY as:
<<<COURSE_JSON>>>
{...}
<<<END_COURSE_JSON>>>

JSON shape:
{
  "title": string,
  "subtitle": string,
  "description": string,
  "audience": string,
  "duration_hours": number,
  "category": string,
  "passing_score": number,
  "completion_rule": "all_lessons" | "required_lessons",
  "modules": [{
    "title": string,
    "sort_order": number,
    "lessons": [{
      "lesson_number": number,
      "title": string,
      "description": string,
      "objectives": string[],
      "content": string,
      "content_type": "video" | "reading" | "quiz" | "assignment",
      "duration_minutes": number,
      "is_required": boolean,
      "quiz_questions": [{
        "question": string,
        "options": string[],
        "correct_index": number,
        "explanation": string
      }]
    }]
  }]
}

RULES:
- Be concise and conversational; no more than 3 clarifying questions at once.
- Skip questions when the user already supplied enough detail.
- Content must be specific and practical, not generic filler.
- Each module should normally contain 3-6 lessons.
- Include 3-5 knowledge-check questions per instructional lesson.
- Generate at least 2 modules.
- For regulated programs, explicitly include the governing standard/state in descriptions/objectives when known.
- AI output is a draft for human review, never a representation that regulatory approval already exists.`;

export async function POST(request: NextRequest) {
  try { await refreshSecrets(); } catch {}
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new Response(JSON.stringify({ error: 'Valid messages are required' }), { status: 400 });

  const useGroq = Boolean(process.env.GROQ_API_KEY);
  const useOpenAI = Boolean(process.env.OPENAI_API_KEY);
  if (!useGroq && !useOpenAI) {
    return new Response(JSON.stringify({ error: 'No AI provider configured. Add GROQ_API_KEY or OPENAI_API_KEY in Dev Studio secrets.' }), { status: 503 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      try {
        const messages = [{ role: 'system' as const, content: SYSTEM_PROMPT }, ...parsed.data.messages];
        let completion: AsyncIterable<any>;
        if (useGroq) {
          completion = await getGroqClient().chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages,
            temperature: 0.4,
            max_tokens: 8000,
            stream: true,
          });
        } else {
          completion = await getOpenAIClient().chat.completions.create({
            model: 'gpt-4.1',
            messages,
            temperature: 0.4,
            max_tokens: 8000,
            stream: true,
          });
        }

        let fullText = '';
        let jsonStarted = false;
        let jsonEnded = false;
        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta?.content ?? '';
          if (!delta) continue;
          fullText += delta;
          if (!jsonStarted && fullText.includes('<<<COURSE_JSON>>>')) jsonStarted = true;
          if (jsonStarted && fullText.includes('<<<END_COURSE_JSON>>>')) jsonEnded = true;
          if (!jsonStarted || jsonEnded) send({ type: 'text', content: delta });
        }

        const jsonMatch = fullText.match(/<<<COURSE_JSON>>>([\s\S]*?)<<<END_COURSE_JSON>>>/);
        if (jsonMatch) {
          try {
            send({ type: 'course_ready', course: JSON.parse(jsonMatch[1].trim()) });
          } catch {
            send({ type: 'text', content: '\n\nCourse structure was generated but the structured payload was invalid. Ask me to regenerate it.' });
          }
        }
        send({ type: 'done' });
      } catch (error) {
        send({ type: 'error', message: error instanceof Error ? error.message : 'AI chat failed' });
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
