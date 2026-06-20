/**
 * POST /api/admin/course-builder/ai-write
 *
 * Generates or expands lesson content using GPT-4.1.
 * Used by the LiveCourseBuilder edit panel "Write with AI" button.
 *
 * Body: { lessonTitle, courseTitle, moduleTitle?, existingContent?, instruction? }
 *
 * Returns: { content: string } — markdown lesson body ready to paste into the editor.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { aiChat, isAIAvailable } from '@/lib/ai/ai-service';
import { hydrateProcessEnv } from '@/lib/secrets';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BodySchema = z.object({
  lessonTitle: z.string().min(1).max(200),
  courseTitle: z.string().min(1).max(200),
  moduleTitle: z.string().max(200).optional(),
  existingContent: z.string().max(10000).optional(),
  instruction: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  await hydrateProcessEnv();
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return safeError('Invalid input', 400);

  const { lessonTitle, courseTitle, moduleTitle, existingContent, instruction } = parsed.data;

  const isExpand = !!existingContent?.trim();
  const systemPrompt = `You are an expert instructional designer for ${PLATFORM_DEFAULTS.orgName}, a workforce development LMS.
Write practical, specific lesson content for adult learners. Use clear markdown formatting.

Rules:
- 300–500 words of practical instruction
- Use ## subheadings to break up sections
- Include bullet points for key concepts
- End with a "Key Takeaways" section (3–5 bullets)
- No generic filler — every sentence must be immediately useful to the learner
- Write in second person ("You will learn...", "When you...")
- Do not include quiz questions — those are handled separately`;

  const userPrompt = isExpand
    ? `Course: ${courseTitle}${moduleTitle ? `\nModule: ${moduleTitle}` : ''}
Lesson: ${lessonTitle}

${instruction ? `Instruction: ${instruction}\n\n` : ''}Existing content to expand or improve:
${existingContent}

Rewrite and expand this content. Keep what's good, improve what's weak, add depth where needed.`
    : `Course: ${courseTitle}${moduleTitle ? `\nModule: ${moduleTitle}` : ''}
Lesson: ${lessonTitle}

${instruction ? `Instruction: ${instruction}\n\n` : ''}Write complete lesson content for this lesson. Make it practical and specific to the course topic.`;

  try {
    if (!isAIAvailable()) {
      return safeError('No AI provider configured. Set OPENAI_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY in platform secrets.', 503);
    }

    const result = await aiChat({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4,
      maxTokens: 1500,
    });

    const content = result.content?.trim() ?? '';
    if (!content) return safeError('AI returned empty content', 500);
    return NextResponse.json({ ok: true, content });
  } catch (err) {
    return safeInternalError(err, 'AI generation failed');
  }
}
