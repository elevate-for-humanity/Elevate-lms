import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { aiChat, isAIAvailable } from '@/lib/ai/ai-service';
import { hydrateProcessEnv } from '@/lib/secrets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BodySchema = z.object({
  lessonTitle: z.string().min(1).max(200),
  courseTitle: z.string().min(1).max(200),
  moduleTitle: z.string().max(200).optional(),
  existingContent: z.string().max(20000).optional(),
  instruction: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  await hydrateProcessEnv();
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return safeError('Invalid input', 400);
  if (!isAIAvailable()) return safeError('No AI provider configured', 503);

  const { lessonTitle, courseTitle, moduleTitle, existingContent, instruction } = parsed.data;
  const prompt = `Create a complete interactive workforce-training lesson experience as JSON.
Course: ${courseTitle}
Module: ${moduleTitle ?? 'General'}
Lesson: ${lessonTitle}
${instruction ? `Additional instruction: ${instruction}` : ''}
${existingContent ? `Existing lesson to improve:\n${existingContent}` : ''}

Return ONLY valid JSON with this shape:
{
  "content": "500-900 words of practical HTML using h2,p,ul,ol,li",
  "narrationScript": "natural spoken narration based on the lesson, not a verbatim copy",
  "visualPrompt": "specific visual/diagram/photo direction for this vocational lesson",
  "flashcards": [{"front":"term or question","back":"answer","tags":["topic"]}],
  "knowledgeChecks": [{"question":"job-relevant question","options":["A","B","C","D"],"correct":0,"explanation":"why"}],
  "scenario": {"title":"real workplace situation","question":"decision learner must make","options":[{"text":"choice","isCorrect":true,"feedback":"specific feedback"}]},
  "practicalTask": {"title":"hands-on task","instructions":["step 1","step 2"],"evidence":"what learner/instructor must verify"}
}
Rules: no generic filler; use job-realistic tools, safety, procedure and decision-making; include at least 4 flashcards and 3 knowledge checks; make the practical task observable and assessable.`;

  try {
    const result = await aiChat({
      model: 'gpt-4.1',
      messages: [
        { role: 'system', content: 'You are an expert vocational instructional designer. Build interactive, visual, hands-on learning experiences. Return only valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.45,
      maxTokens: 4500,
    });
    const raw = result.content?.replace(/^```json\n?|\n?```$/g, '').trim() ?? '';
    if (!raw) return safeError('AI returned empty content', 500);
    const experience = JSON.parse(raw);
    return NextResponse.json({ ok: true, ...experience, experience });
  } catch (error) {
    return safeInternalError(error, 'AI lesson generation failed');
  }
}
