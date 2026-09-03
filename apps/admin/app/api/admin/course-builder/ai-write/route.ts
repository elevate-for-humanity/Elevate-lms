import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { aiChat, isAIAvailable } from '@/lib/ai/ai-service';
import { CourseExperienceSchema } from '@/lib/course-factory/experience-contract';
import { hydrateProcessEnv } from '@/lib/secrets';
import {
  courseBuilderCreditErrorResponse,
  refundCourseBuilderRequestCredits,
  reserveCourseBuilderRequestCredits,
  type CreditReservation,
} from '@/lib/course-builder/request-metering';

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

Return ONLY valid JSON that satisfies the universal CourseExperience contract:
{"readingGuide":{"title":"specific title","summary":"80+ character authored summary","sections":[{"heading":"specific heading","body":"120+ character authored instruction"},{"heading":"specific heading","body":"120+ character authored instruction"},{"heading":"specific heading","body":"120+ character authored application"}],"keyTakeaways":["specific takeaway","specific takeaway","specific takeaway"]},"content":"500+ characters of complete authored reading","narrationScript":"200+ characters of natural lesson-specific instructor narration","visualPrompt":"specific bright Elevate visual direction with people, setting, action, evidence and outcome","flashcards":[{"id":"term-1","front":"lesson-specific term","back":"lesson-specific explanation","tags":["objective"]}],"quickClips":[{"id":"clip-1","title":"specific concept","objective":"specific objective","durationSeconds":180,"script":"120+ character teaching script","visualPrompt":"40+ character specific visual direction"},{"id":"clip-2","title":"specific application","objective":"specific objective","durationSeconds":180,"script":"120+ character applied script","visualPrompt":"40+ character specific visual direction"}],"knowledgeChecks":[{"question":"objective-aligned question","options":["A","B","C","D"],"correct":0,"explanation":"why the answer demonstrates the objective"}],"scenario":{"title":"specific workplace situation","context":"facts and constraints","question":"decision","options":[{"text":"choice","isCorrect":true,"feedback":"specific feedback"},{"text":"distractor","isCorrect":false,"feedback":"specific remediation"}]},"caseStudy":{"title":"specific evidence review","context":"case facts","question":"analysis question","options":[{"text":"choice","isCorrect":true,"feedback":"specific feedback"},{"text":"distractor","isCorrect":false,"feedback":"specific remediation"}]},"exercises":[{"id":"exercise-1","title":"learn by doing","instructions":["specific step","specific step"],"expectedArtifact":"observable output","autoGrade":{"type":"checklist","criteria":["specific criterion"]}}],"practicalTask":{"title":"observable task","description":"job-ready artifact","instructions":["step 1","step 2","step 3"],"evidence":"verification artifact"},"resources":[{"type":"worksheet","title":"specific worksheet","description":"specific use","content":"40+ characters of usable content"},{"type":"reference","title":"specific reference","description":"specific use","content":"40+ characters of usable content"}],"glossary":[{"term":"specific term","definition":"lesson-specific definition"}],"remediation":{"passingScore":80,"reviewMessage":"targeted retry direction","objectiveMap":["objective 1","objective 2","objective 3"],"targetedActions":[{"objective":"specific weak objective","action":"specific named review and retry action"}]},"readiness":{"domainKey":"lesson-specific-domain","masteryThreshold":80,"evidenceSignals":["specific evidence","specific evidence","specific evidence"]}}
Include at least 6 specific flashcards, 2 quick clips, 3 knowledge checks, 1 exercise, 2 resources, and 4 glossary terms. Do not use generic placeholders, copied certification-provider content, or unverified claims. Make every activity observable and assessable.`;

  let reservation: CreditReservation | null = null;
  try {
    reservation = await reserveCourseBuilderRequestCredits({
      request: req,
      userId: auth.id,
      effectiveRoles: auth.effectiveRoles,
      operation: 'ai-write',
      metadata: { course_title: courseTitle, lesson_title: lessonTitle },
    });
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
    await refundCourseBuilderRequestCredits(reservation, auth.id, 'ai_write_failed');
    const credits = courseBuilderCreditErrorResponse(error);
    if (credits) return credits;
    return safeInternalError(error, 'Evidence-grounded lesson generation failed');
  }
}
