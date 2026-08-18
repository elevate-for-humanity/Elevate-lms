import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { aiChat, isAIAvailable } from '@/lib/ai/ai-service';
import { CourseExperienceSchema } from '@/lib/course-factory/experience-contract';
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

function parseJsonObject(raw: string) {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first < 0 || last <= first) throw new Error('AI did not return a JSON object');
  return JSON.parse(cleaned.slice(first, last + 1));
}

export async function POST(req: NextRequest) {
  await hydrateProcessEnv();
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return safeError('Invalid input', 400);

  if (!isAIAvailable())
    return safeError('AI provider is required; generic fallback generation is disabled', 503);

  const { lessonTitle, courseTitle, moduleTitle, existingContent, instruction } = parsed.data;
  const prompt = `Create a complete interactive workforce-training lesson experience as JSON.
Course: ${courseTitle}
Module: ${moduleTitle ?? 'General'}
Lesson: ${lessonTitle}
${instruction ? `Additional instruction: ${instruction}` : ''}
${existingContent ? `Existing lesson to improve:\n${existingContent}` : ''}

Return ONLY valid JSON with this shape:
{"content":"800-1400 words of practical HTML using h2,p,ul,ol,li","narrationScript":"natural instructor narration grounded in this lesson","visualPrompt":"specific Elevate visual direction with people, setting, action, evidence and outcome","flashcards":[{"front":"lesson-specific term","back":"lesson-specific explanation","tags":["objective"]}],"knowledgeChecks":[{"question":"objective-aligned question","options":["A","B","C","D"],"correct":0,"explanation":"why the answer demonstrates the objective"}],"scenario":{"title":"specific workplace situation","context":"facts and constraints","question":"decision","options":[{"text":"choice","isCorrect":true,"feedback":"specific feedback"}]},"caseStudy":{"title":"specific evidence review","context":"case facts","question":"analysis question","options":[{"text":"choice","isCorrect":true,"feedback":"specific feedback"}]},"practicalTask":{"title":"observable task","description":"job-ready artifact","instructions":["step 1","step 2","step 3"],"evidence":"verification artifact"},"remediation":{"passingScore":80,"reviewMessage":"targeted retry direction","objectiveMap":["one objective for each knowledge check"]}}
Include 4-8 specific flashcards and 3-5 specific knowledge checks. Do not use generic placeholders, copied certification-provider content, or unverified claims. Make the task observable and assessable.`;

  try {
    const result = await aiChat({
      messages: [
        {
          role: 'system',
          content: 'You are an expert vocational instructional designer. Return only valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.45,
      maxTokens: 4500,
    });
    const experience = CourseExperienceSchema.parse(parseJsonObject(result.content ?? ''));
    return NextResponse.json({ ok: true, provider: 'ai', experience });
  } catch (error) {
    return safeInternalError(error, 'Evidence-grounded lesson generation failed');
  }
}
