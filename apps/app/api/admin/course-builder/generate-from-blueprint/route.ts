/**
 * POST /api/admin/course-builder/generate-from-blueprint
 *
 * Full automated course generation pipeline — one call, full premium course.
 *
 * Pipeline:
 *   1. Load blueprint from registry
 *   2. GPT-4o generates objective + content + quiz questions for every lesson
 *   3. Inject generated content into blueprint lesson refs
 *   4. buildCanonicalCourseFromBlueprint() → course_modules + course_lessons
 *   5. assessment-generator → quiz banks per module + final exam
 *   6. Trigger /api/admin/generate-lesson-videos → Synthesia → D-ID → TTS
 *   7. Return { courseId, modules, lessons, videosQueued }
 *
 * Auth: admin only
 */

import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getAllBlueprints } from '@/lib/curriculum/blueprints';
import { buildCanonicalCourseFromBlueprint } from '@/lib/curriculum/builders/buildCanonicalCourseFromBlueprint';
import {
  generateAndPersistModuleQuiz,
  generateAndPersistFinalExam,
} from '@/lib/course-builder/assessment-generator';
import { groqJSON } from '@/lib/groq-client';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';
import type { BlueprintLessonRef } from '@/lib/curriculum/blueprints/types';
import {
  generateNaturalVoiceover,
  generateDIDVideo,
  generateSynthesiaVideo,
} from '@/lib/video/generate';
import { getInstructorForCourse } from '@/lib/ai-instructors';
import { loadIndustryStandards } from '@/lib/industry/standards-loader';
import { buildIndustryStandardsBlock } from '@/lib/ai/prompts/course-blueprint';
import { createJob } from '@/lib/video/job-queue';
import { matchAllLessonsToVideos, summariseMatchResults } from '@/lib/video/pexels-matcher';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;



// ─── Types ────────────────────────────────────────────────────────────────────

interface GenerateFromBlueprintRequest {
  blueprintId: string;
  programId: string;
  mode?: 'replace' | 'missing-only';
  generationMode?: 'full' | 'fast';
  videoMode?: 'queue' | 'inline' | 'off' | 'external' | 'pexels-auto';
  videoQueueLimit?: number;
  inlineVideoLimit?: number;
  pexelsThreshold?: number;
  pexelsDelayMs?: number;
}

interface LessonContent {
  objective: string;
  content: string;
  quiz_questions: Array<{
    question: string;
    options: string[];
    correct: number;
    explanation: string;
  }>;
}

function inferLessonType(slug: string): 'lesson' | 'checkpoint' | 'quiz' | 'exam' {
  if (slug.includes('checkpoint')) return 'checkpoint';
  if (slug.includes('exam') || slug.includes('final')) return 'exam';
  if (slug.endsWith('-quiz') || slug.includes('/quiz/')) return 'quiz';
  return 'lesson';
}

function buildFallbackQuizQuestions(
  lesson: BlueprintLessonRef,
  courseTitle: string,
  moduleTitle: string,
  count: number,
) {
  return Array.from({ length: count }, (_, index) => ({
    question: `${lesson.title}: which statement best matches the core concept ${index + 1}?`,
    options: [
      `A. It applies a key ${courseTitle} principle in ${moduleTitle}`,
      'B. It skips the core process and documentation requirements',
      'C. It ignores learner safety and quality controls',
      'D. It replaces the lesson objective with unrelated content',
    ],
    correct: 0,
    explanation: `This fallback question keeps ${lesson.title} seedable while richer assessment content is generated later.`,
  }));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildStandardsSummaryHtml(standardsBlock?: string): string {
  if (!standardsBlock?.trim()) return '';

  const summary = standardsBlock
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith('---'))
    .slice(0, 14)
    .join(' ');

  if (!summary) return '';

  return `<h2>Industry Standards Alignment</h2><p>${escapeHtml(summary.slice(0, 1800))}</p>`;
}

function buildFallbackLessonContent(
  lesson: BlueprintLessonRef,
  moduleTitle: string,
  courseTitle: string,
  standardsBlock?: string,
): LessonContent {
  const lessonType = inferLessonType(lesson.slug);
  const questionCount = lessonType === 'exam' ? 10 : lessonType === 'checkpoint' ? 5 : 3;
  const standardsHtml = buildStandardsSummaryHtml(standardsBlock);

  return {
    objective:
      lesson.objective?.trim() ||
      `By the end of this lesson, learners will be able to explain and apply the core ${courseTitle} concepts covered in ${lesson.title}.`,
    content:
      lesson.content?.trim() ||
      `<h2>${lesson.title}</h2><p>This draft lesson was generated in fast mode so the course structure could be created immediately without blocking on premium lesson authoring. It defines the instructional space for ${lesson.title} within ${moduleTitle} and gives the downstream content, assessment, and media pipelines a stable lesson row to work from.</p>${standardsHtml}<p>Learners should understand the lesson objective, the core terminology used in ${courseTitle}, the practical context for this topic, and the expected next step after the lesson is fully enriched. Admin users can replace this draft with expanded production content without changing the course map, lesson slug, or module order.</p><p>This fallback content is intentionally publication-safe as a draft shell. It preserves the lesson in the generated course, allows media jobs and assessments to attach to a real lesson record, and keeps the generator fast for large industry programs where speed matters more than first-pass narrative depth.</p>`,
    quiz_questions: buildFallbackQuizQuestions(lesson, courseTitle, moduleTitle, questionCount),
  };
}

// ─── Groq lesson content generator ───────────────────────────────────────────

async function generateLessonContent(
  lesson: BlueprintLessonRef,
  moduleTitle: string,
  courseTitle: string,
  state: string,
  standardsBlock?: string,
): Promise<LessonContent> {
  const isCheckpoint = lesson.slug.includes('checkpoint');
  const isExam = lesson.slug.includes('exam') || lesson.slug.includes('final');
  const questionCount = isExam ? 10 : isCheckpoint ? 5 : 3;

  const prompt = `You are a curriculum architect writing premium workforce training content.

Course: ${courseTitle} (${state})
Module: ${moduleTitle}
Lesson: ${lesson.title}
Type: ${isExam ? 'final exam' : isCheckpoint ? 'checkpoint quiz' : 'lesson'}

${standardsBlock ? `INDUSTRY STANDARDS CONTEXT:\n${standardsBlock}\n\nUse this standards context as authoritative. Lesson objective, content, and quiz questions must trace back to listed job tasks/skills/credential domains when applicable.` : ''}

Return ONLY valid JSON — no markdown, no prose:
{
  "objective": "By the end of this lesson, learners will be able to... (one sentence, 20-80 words)",
  "content": "<h2>...</h2><p>...</p>... (full HTML, minimum 400 words, use h2/p/ul/li, cover core concepts, real-world application, key terminology, practical guidance)",
  "quiz_questions": [
    {
      "question": "...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correct": 0,
      "explanation": "..."
    }
  ]
}

Rules:
- objective: starts with "By the end of this lesson, learners will be able to"
- content: minimum 400 words, professional HTML, no placeholders
- quiz_questions: exactly ${questionCount} questions, correct is 0-indexed
- All content must be specific to ${courseTitle} — no generic filler`;

  return groqJSON<LessonContent>(prompt);
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(req);
  if ('error' in auth && auth.error) return auth.error;

  let body: GenerateFromBlueprintRequest;
  try {
    body = await req.json();
  } catch {
    return safeError('Request body must be valid JSON', 400);
  }

  if (!body?.blueprintId) return safeError('blueprintId is required', 400);
  if (!body?.programId) return safeError('programId is required', 400);

  const mode = body.mode ?? 'replace';
  const generationMode = body.generationMode ?? 'full';
  const videoMode = body.videoMode ?? 'queue';

  // ── Step 1: Load blueprint ─────────────────────────────────────────────────
  const registry = await getAllBlueprints();
  const blueprint = registry.find((b) => b.id === body.blueprintId);
  if (!blueprint) return safeError(`Blueprint "${body.blueprintId}" not found`, 404);

  const courseTitle = blueprint.credentialTitle;
  const state = blueprint.state ?? 'Indiana';
  let standardsBlock: string | undefined;

  if (blueprint.socCode) {
    try {
      const standards = await loadIndustryStandards(blueprint.socCode, blueprint.credentialCode);
      if (standards) {
        standardsBlock = buildIndustryStandardsBlock(standards);
      }
    } catch (err) {
      logger.warn('[generate-from-blueprint] standards load failed', {
        blueprintId: blueprint.id,
        socCode: blueprint.socCode,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // ── Step 2: Generate content for every lesson via GPT-4o ──────────────────
  const enrichedBlueprint = { ...blueprint, modules: blueprint.modules.map((m) => ({ ...m })) };
  const generationLog: { slug: string; ok: boolean; error?: string }[] = [];

  for (const mod of enrichedBlueprint.modules) {
    const enrichedLessons: BlueprintLessonRef[] = [];

    for (const lesson of mod.lessons ?? []) {
      // Skip if content already exists (missing-only mode)
      if (mode === 'missing-only' && lesson.content && lesson.objective) {
        enrichedLessons.push(lesson);
        generationLog.push({ slug: lesson.slug, ok: true });
        continue;
      }

      if (generationMode === 'fast') {
        const fallback = buildFallbackLessonContent(lesson, mod.title, courseTitle, standardsBlock);
        const lessonType = inferLessonType(lesson.slug);
        enrichedLessons.push({
          ...lesson,
          objective: fallback.objective,
          content: fallback.content,
          passingScore:
            lesson.passingScore ?? (lessonType === 'checkpoint' || lessonType === 'quiz' || lessonType === 'exam' ? 70 : undefined),
          quizQuestions: fallback.quiz_questions.map((q) => ({
            question: q.question,
            options: q.options,
            correct: q.correct,
            explanation: q.explanation,
          })),
        });
        generationLog.push({ slug: lesson.slug, ok: true });
        continue;
      }

      try {
        const generated = await generateLessonContent(
          lesson,
          mod.title,
          courseTitle,
          state,
          standardsBlock,
        );

        const lessonType = inferLessonType(lesson.slug);
        const fallback = buildFallbackLessonContent(lesson, mod.title, courseTitle, standardsBlock);
        enrichedLessons.push({
          ...lesson,
          objective: generated.objective?.trim() || fallback.objective || lesson.objective,
          content: generated.content?.trim() || fallback.content || lesson.content,
          passingScore:
            lesson.passingScore ?? (lessonType === 'checkpoint' || lessonType === 'quiz' || lessonType === 'exam' ? 70 : undefined),
          quizQuestions: (generated.quiz_questions?.length ? generated.quiz_questions : fallback.quiz_questions).map((q) => ({
            question: q.question,
            options: q.options,
            correct: q.correct,
            explanation: q.explanation,
          })),
        });

        generationLog.push({ slug: lesson.slug, ok: true });
      } catch (err) {
        if (generationMode === 'fast') {
          const fallback = buildFallbackLessonContent(lesson, mod.title, courseTitle, standardsBlock);
          const lessonType = inferLessonType(lesson.slug);
          enrichedLessons.push({
            ...lesson,
            objective: fallback.objective,
            content: fallback.content,
            passingScore:
              lesson.passingScore ?? (lessonType === 'checkpoint' || lessonType === 'quiz' || lessonType === 'exam' ? 70 : undefined),
            quizQuestions: fallback.quiz_questions.map((q) => ({
              question: q.question,
              options: q.options,
              correct: q.correct,
              explanation: q.explanation,
            })),
          });

          generationLog.push({
            slug: lesson.slug,
            ok: true,
            error: err instanceof Error ? err.message : String(err),
          });

          continue;
        }

        generationLog.push({
          slug: lesson.slug,
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        });
        // Push lesson without content — seeder will skip it and report failure
        enrichedLessons.push(lesson);
      }

      // Throttle to avoid rate limits
      await new Promise((r) => setTimeout(r, generationMode === 'fast' ? 75 : 300));
    }

    mod.lessons = enrichedLessons;
  }

  // ── Step 2b: LQS validation + auto re-enrichment pass ─────────────────────
  // Any lesson that still fails LQS after first-pass generation gets one retry
  // with an explicit remediation prompt that targets the specific violations.
  if (generationMode !== 'fast') {
    const { validateBlueprintLessons } = await import('@/lib/curriculum/lqs-validator');
    const allEnrichedLessons = enrichedBlueprint.modules.flatMap((m) => m.lessons ?? []);
    const lqsResults = validateBlueprintLessons(allEnrichedLessons);
    const lqsFailures = lqsResults.filter((r) => !r.passed);

    if (lqsFailures.length > 0) {
      logger.info(`[generate-from-blueprint] LQS re-enrichment: ${lqsFailures.length} lessons need remediation`);

      for (const failure of lqsFailures) {
        const mod = enrichedBlueprint.modules.find((m) =>
          m.lessons?.some((l) => l.slug === failure.slug),
        );
        if (!mod) continue;
        const lessonIdx = mod.lessons!.findIndex((l) => l.slug === failure.slug);
        if (lessonIdx === -1) continue;

        const lesson = mod.lessons![lessonIdx];
        const violationList = failure.violations.map((v) => `- [${v.category}] ${v.rule}: ${v.detail}`).join('\n');

        const remediationPrompt = `You are a professional curriculum author. The following lesson FAILED quality validation. You must fix every listed violation.

Course: ${courseTitle}
Module: ${mod.title}
Lesson: ${lesson.title}
Current word count: ${failure.wordCount}
Current questions: ${failure.questionCount}

VIOLATIONS TO FIX:
${violationList}

Current content:
${lesson.content ?? '(empty)'}

Return ONLY valid JSON:
{
  "objective": "By the end of this lesson, learners will be able to... (specific, measurable)",
  "content": "<full HTML, minimum 400 words, must address ALL violations above>",
  "quiz_questions": [
    { "question": "scenario-based question", "options": ["A","B","C","D"], "correct": 0, "explanation": "..." }
  ]
}

REQUIREMENTS (all must be met):
- Minimum 400 words
- List specific tools/equipment required
- Include at least one IF/THEN decision block
- Reference sanitation/disinfection
- Include a contraindication or DO NOT rule
- Describe a failure mode with cause and recovery
- Describe what correct execution looks like visually
- At least 2 of ${failure.questionCount >= 3 ? 5 : 3} questions must be scenario-based`;

        try {
          const remediated = await groqJSON<LessonContent>(remediationPrompt);
          mod.lessons![lessonIdx] = {
            ...lesson,
            objective: remediated.objective?.trim() || lesson.objective,
            content: remediated.content?.trim() || lesson.content,
            quizQuestions: remediated.quiz_questions?.length
              ? remediated.quiz_questions.map((q) => ({
                  question: q.question,
                  options: q.options,
                  correct: q.correct,
                  explanation: q.explanation,
                }))
              : lesson.quizQuestions,
          };
          await new Promise((r) => setTimeout(r, 300));
        } catch (err) {
          logger.warn(`[generate-from-blueprint] LQS remediation failed for ${failure.slug}`, { err });
        }
      }
    }
  }

  const generationFailures = generationLog.filter((l) => !l.ok);

  // ── Step 3: Seed course from enriched blueprint ────────────────────────────
  const seedResult = await buildCanonicalCourseFromBlueprint({
    blueprint: enrichedBlueprint,
    programId: body.programId,
    mode,
  });

  if (!seedResult.courseId) {
    return safeInternalError(null, 'Course seeder did not return a courseId');
  }

  const courseId = seedResult.courseId;

  // ── Step 4: Generate assessment banks per lesson ───────────────────────────
  const db = await requireAdminClient();
  let assessmentsGenerated = 0;

  try {
    // Fetch all inserted lessons for this course
    const { data: lessons } = await db
      .from('course_lessons')
      .select('id, slug, lesson_type, module_id')
      .eq('course_id', courseId);

    for (const lesson of lessons ?? []) {
      if (lesson.lesson_type === 'exam') {
        const result = await generateAndPersistFinalExam(db, {
          lessonId: lesson.id,
          lessonSlug: lesson.slug,
          courseTitle,
          questionCount: 25,
          passingScore: 80,
        });
        assessmentsGenerated += result.writtenToDb;
      } else if (['checkpoint', 'quiz'].includes(lesson.lesson_type)) {
        const result = await generateAndPersistModuleQuiz(db, {
          lessonId: lesson.id,
          lessonSlug: lesson.slug,
          moduleTitle:
            enrichedBlueprint.modules.find((m) => m.lessons?.some((l) => l.slug === lesson.slug))
              ?.title ?? courseTitle,
          questionCount: 8,
          passingScore: 70,
        });
        assessmentsGenerated += result.writtenToDb;
      }
    }
  } catch (err) {
    // Non-fatal — course is live, assessments can be regenerated from /admin/course-builder
    logger.error('[generate-from-blueprint] assessment-generator error:', err);
  }

  // ── Step 5: Queue or generate lesson videos ───────────────────────────────
  let videosQueued = 0;
  let videoQueueFailed = 0;
  let externalQueued = 0;
  let externalDispatchFailed = 0;
  let pexelsSummary: ReturnType<typeof summariseMatchResults> | null = null;

  if (videoMode === 'queue') {
    try {
      const queueLimit = typeof body.videoQueueLimit === 'number' ? body.videoQueueLimit : null;

      let lessonsQuery = db
        .from('course_lessons')
        .select('id, video_url, video_status')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true })
        .is('video_url', null)
        .not('video_status', 'in', '("queued","rendering")');

      if (queueLimit && queueLimit > 0) {
        lessonsQuery = lessonsQuery.limit(queueLimit);
      }

      const { data: pendingLessons, error: pendingErr } = await lessonsQuery;
      if (pendingErr) {
        throw new Error(`Failed to load pending lessons for video dispatch: ${pendingErr.message}`);
      }

      const baseUrl = new URL(req.url).origin;
      const cookie = req.headers.get('cookie') ?? '';

      for (const lesson of pendingLessons ?? []) {
        try {
          const res = await fetch(`${baseUrl}/api/videos/generate`, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              cookie,
            },
            body: JSON.stringify({ lesson_id: lesson.id }),
          });

          if (res.ok) {
            videosQueued += 1;
          } else {
            videoQueueFailed += 1;
          }
        } catch {
          videoQueueFailed += 1;
        }
      }
    } catch (err) {
      logger.error('[generate-from-blueprint] video queue error:', err);
    }
  }

  if (videoMode === 'inline') {
    try {
      const inlineLimit = typeof body.inlineVideoLimit === 'number' ? body.inlineVideoLimit : null;
      let query = db
        .from('course_lessons')
        .select('id, title, content, lesson_type')
        .eq('course_id', courseId)
        .is('video_url', null);

      if (inlineLimit && inlineLimit > 0) {
        query = query.limit(inlineLimit);
      }

      const { data: lessonRows } = await query;

      const instructor = getInstructorForCourse(courseTitle);
      const VOICE_MAP: Record<string, string> = {
        'dr-sarah-chen': 'nova',
        'marcus-johnson': 'onyx',
        'james-williams': 'echo',
        'lisa-martinez': 'shimmer',
        'robert-davis': 'fable',
        'angela-thompson': 'alloy',
      };
      const voice = VOICE_MAP[instructor.id] ?? 'nova';

      for (const lesson of lessonRows ?? []) {
        const script =
          `Welcome to ${courseTitle}, lesson: ${lesson.title}. ${(lesson.content ?? '').replace(/<[^>]+>/g, '').substring(0, 300)}`.trim();
        let videoUrl: string | null = null;

        // Synthesia first
        if (process.env.SYNTHESIA_API_KEY && !videoUrl) {
          try {
            const r = await generateSynthesiaVideo(script, 'anna_costume1_cameraA');
            videoUrl = r.videoUrl;
          } catch {
            /* fall through */
          }
        }

        // D-ID second
        if (process.env.DID_API_KEY && !videoUrl) {
          try {
            const { audioBuffer } = await generateNaturalVoiceover(script, voice, instructor.id);
            const audioDataUrl = `data:audio/mp3;base64,${audioBuffer.toString('base64')}`;
            const r = await generateDIDVideo(script, instructor.avatar, audioDataUrl);
            videoUrl = r.videoUrl;
          } catch {
            /* fall through */
          }
        }

        // TTS audio fallback
        if (!videoUrl && process.env.OPENAI_API_KEY) {
          try {
            const { audioBuffer } = await generateNaturalVoiceover(script, voice, instructor.id);
            const path = `course-videos/${courseId}/${lesson.id}.mp3`;
            await db.storage
              .from('course-videos')
              .upload(path, audioBuffer, { contentType: 'audio/mp3', upsert: true });
            const { data: urlData } = db.storage.from('course-videos').getPublicUrl(path);
            videoUrl = urlData.publicUrl;
          } catch {
            /* non-fatal */
          }
        }

        if (videoUrl) {
          await db.from('course_lessons').update({ video_url: videoUrl }).eq('id', lesson.id);
          videosQueued++;
        }
      }
    } catch (err) {
      logger.error('[generate-from-blueprint] inline video generation error:', err);
    }
  }

  if (videoMode === 'off') {
    videosQueued = 0;
  }

  if (videoMode === 'pexels-auto') {
    if (!process.env.PEXELS_API_KEY?.trim()) {
      return safeError('PEXELS_API_KEY is required for videoMode="pexels-auto"', 400);
    }

    try {
      const queueLimit = typeof body.videoQueueLimit === 'number' ? body.videoQueueLimit : null;

      let lessonsQuery = db
        .from('course_lessons')
        .select('id, slug, title, objective, content, script, video_url')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true })
        .or('video_url.is.null,video_url.eq.')
        .not('title', 'is', null);

      if (queueLimit && queueLimit > 0) {
        lessonsQuery = lessonsQuery.limit(queueLimit);
      }

      const { data: pendingLessons, error: pendingErr } = await lessonsQuery;
      if (pendingErr) {
        throw new Error(`Failed to load lessons for pexels-auto: ${pendingErr.message}`);
      }

      const results = await matchAllLessonsToVideos(
        (pendingLessons ?? []).map((lesson) => ({
          id: lesson.id,
          slug: lesson.slug,
          title: lesson.title,
          objective: lesson.objective,
          content: lesson.content,
          script: lesson.script,
          programSlug: blueprint.programSlug,
        })),
        {
          apiKey: process.env.PEXELS_API_KEY.trim(),
          supabase: db,
          applyToDb: true,
          threshold: typeof body.pexelsThreshold === 'number' ? body.pexelsThreshold : 0.86,
          delayMs: typeof body.pexelsDelayMs === 'number' ? body.pexelsDelayMs : 250,
          strictDuration: true,
        },
      );

      pexelsSummary = summariseMatchResults(results);
      videosQueued += pexelsSummary.appliedToDb;
      videoQueueFailed += pexelsSummary.needsReview + pexelsSummary.failed;
    } catch (err) {
      logger.error('[generate-from-blueprint] pexels-auto match error:', err);
    }
  }

  if (videoMode === 'external') {
    const externalUrl = process.env.EXTERNAL_VIDEO_WEBHOOK_URL?.trim();
    if (!externalUrl) {
      return safeError('EXTERNAL_VIDEO_WEBHOOK_URL is required for videoMode="external"', 400);
    }

    try {
      const queueLimit = typeof body.videoQueueLimit === 'number' ? body.videoQueueLimit : null;

      let lessonsQuery = db
        .from('course_lessons')
        .select('id, title, script, bullet_points, video_url, video_status')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true })
        .is('video_url', null)
        .not('video_status', 'in', '("queued","rendering")');

      if (queueLimit && queueLimit > 0) {
        lessonsQuery = lessonsQuery.limit(queueLimit);
      }

      const { data: pendingLessons, error: pendingErr } = await lessonsQuery;
      if (pendingErr) {
        throw new Error(`Failed to load pending lessons for external dispatch: ${pendingErr.message}`);
      }

      for (const lesson of pendingLessons ?? []) {
        try {
          const job = await createJob({
            lesson_id: lesson.id,
            course_id: courseId,
            lesson_title: lesson.title,
            script: lesson.script ?? undefined,
            bullet_points: Array.isArray(lesson.bullet_points)
              ? (lesson.bullet_points as string[])
              : [],
          });

          const webhookRes = await fetch(externalUrl, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              source: 'elevate-course-builder',
              courseId,
              jobId: job.id,
              lessonId: lesson.id,
              lessonTitle: lesson.title,
              script: lesson.script ?? null,
              bulletPoints: Array.isArray(lesson.bullet_points)
                ? (lesson.bullet_points as string[])
                : [],
            }),
          });

          if (webhookRes.ok) {
            externalQueued += 1;
            videosQueued += 1;
          } else {
            externalDispatchFailed += 1;
            videoQueueFailed += 1;
          }
        } catch {
          externalDispatchFailed += 1;
          videoQueueFailed += 1;
        }
      }
    } catch (err) {
      logger.error('[generate-from-blueprint] external video dispatch error:', err);
    }
  }

  // ── Step 6: Audit log ─────────────────────────────────────────────────────
  await logAdminAudit({
    action: AdminAction.BULK_CONTENT_GENERATED,
    actorId: auth.id ?? '00000000-0000-0000-0000-000000000000',
    entityType: 'courses',
    entityId: courseId,
    metadata: {
      blueprintId: body.blueprintId,
      programId: body.programId,
      mode,
      generationMode,
      lessonsInserted: seedResult.lessonCount,
      contentFailures: seedResult.contentFailures?.length ?? 0,
      generationFailures: generationFailures.length,
      assessmentsGenerated,
      videosQueued,
      videoMode,
      videoQueueFailed,
      externalQueued,
      externalDispatchFailed,
      pexelsSummary,
    },
    req,
  });

  return NextResponse.json({
    ok: true,
    courseId,
    blueprintId: body.blueprintId,
    title: courseTitle,
    generationMode,
    modules: enrichedBlueprint.modules.length,
    lessonsInserted: seedResult.lessonCount,
    contentFailures: seedResult.contentFailures ?? [],
    generationFailures,
    assessmentsGenerated,
    videosQueued,
    videoQueueFailed,
    videoMode,
    externalQueued,
    externalDispatchFailed,
    pexelsSummary,
    externalVideoWebhookConfigured: Boolean(process.env.EXTERNAL_VIDEO_WEBHOOK_URL?.trim()),
    videoStudioUrl: `/admin/video-generator?courseId=${courseId}`,
    studioCommand: `POST /api/admin/course-builder/generate-from-blueprint {"blueprintId":"${body.blueprintId}","programId":"${body.programId}","videoMode":"queue"}`,
    courseUrl: `/admin/courses/${courseId}`,
  });
}
