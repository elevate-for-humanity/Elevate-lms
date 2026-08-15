/**
 * POST /api/admin/courses/[courseId]/generate
 *
 * Incremental DB-backed course generator.
 * Writes one lesson at a time. Respects locked lessons.
 * Checks generation_paused before each lesson so admin can interrupt.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { aiChat } from '@/lib/ai/ai-service';
import { hydrateProcessEnv } from '@/lib/secrets';

const ADMIN_ROLES = new Set(['admin']);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

async function generateOutline(
  courseTitle: string,
  prompt: string,
): Promise<Array<{ title: string; sort_order: number; description: string }>> {
  const completion = await aiChat({
    model: 'gpt-4.1',
    messages: [
      {
        role: 'system',
        content: `You are an instructional designer. Given a course title and description, produce a lesson outline.\nReturn ONLY valid JSON — no markdown:\n{\n  "lessons": [\n    { "title": "string", "sort_order": 1, "description": "one sentence" }\n  ]\n}\nRules: 6-12 lessons total. Titles are specific and action-oriented.`,
      },
      { role: 'user', content: `Course: "${courseTitle}"\n\nDescription/Prompt: ${prompt}` },
    ],
    temperature: 0.3,
    maxTokens: 1500,
  });

  const raw = completion.content;
  if (!raw) throw new Error('Empty outline response from AI service');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.lessons)) throw new Error('Invalid outline shape');
  return parsed.lessons;
}

async function generateLessonContent(
  courseTitle: string,
  lessonTitle: string,
  lessonDescription: string,
): Promise<string> {
  const completion = await aiChat({
    model: 'gpt-4.1',
    messages: [
      {
        role: 'system',
        content: `You are an instructional designer writing lesson content for a workforce LMS.\nWrite 300-600 words of real instructional content. No placeholders. No meta-commentary.\nUse clear headings, short paragraphs, and practical examples.`,
      },
      {
        role: 'user',
        content: `Course: "${courseTitle}"\nLesson: "${lessonTitle}"\nObjective: ${lessonDescription}\n\nWrite the lesson content now.`,
      },
    ],
    temperature: 0.4,
    maxTokens: 1200,
  });

  return completion.content?.trim() ?? '';
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  await hydrateProcessEnv();
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const user = await getCurrentUser();
  if (!user) return safeError('Unauthorized', 401);

  const db = await requireAdminClient();
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !ADMIN_ROLES.has(profile.role)) return safeError('Forbidden', 403);

  const { courseId } = await params;
  const { data: course, error: courseErr } = await db
    .from('courses')
    .select('id, title, generator_prompt, generation_status')
    .eq('id', courseId)
    .maybeSingle();

  if (courseErr || !course) return safeError('Course not found', 404);
  if (course.generation_status === 'generating') return safeError('Generation already in progress', 409);

  const body = await req.json().catch(() => ({}));
  const prompt: string = (body.prompt ?? course.generator_prompt ?? '').trim();
  if (!prompt) return safeError('prompt is required', 400);

  try {
    await db.from('courses').update({
      generation_status: 'generating',
      generation_progress: 5,
      generation_paused: false,
      generator_prompt: prompt,
      last_generated_at: new Date().toISOString(),
    }).eq('id', courseId);

    const outline = await generateOutline(course.title, prompt);
    const { data: existing } = await db.from('course_lessons').select('title').eq('course_id', courseId);
    const existingTitles = new Set((existing ?? []).map((l: any) => l.title));

    for (const item of outline) {
      if (existingTitles.has(item.title)) continue;
      await db.from('course_lessons').insert({
        course_id: courseId,
        title: item.title,
        content: '',
        order_index: item.sort_order,
        generation_status: 'queued',
        ai_generated: true,
        approved: false,
        locked: false,
        generator_prompt: item.description,
      });
    }

    await db.from('courses').update({ generation_progress: 20 }).eq('id', courseId);
    const { data: lessons } = await db
      .from('course_lessons')
      .select('id, title, locked, generation_status, generator_prompt')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    const fillable = (lessons ?? []).filter((l: any) => !l.locked && l.generation_status !== 'approved');

    for (let i = 0; i < fillable.length; i++) {
      const lesson = fillable[i];
      const { data: fresh } = await db.from('courses').select('generation_paused').eq('id', courseId).single();
      if (fresh?.generation_paused) {
        await db.from('courses').update({
          generation_status: 'review',
          generation_progress: 20 + Math.round((i / fillable.length) * 75),
        }).eq('id', courseId);
        logger.info('Course generation paused', { courseId, lessonIndex: i });
        return NextResponse.json({ paused: true, completedLessons: i });
      }

      await db.from('course_lessons').update({ generation_status: 'generating' }).eq('id', lesson.id);
      const content = await generateLessonContent(course.title, lesson.title, lesson.generator_prompt ?? lesson.title);
      await db.from('course_lessons').update({
        content,
        generation_status: 'generated',
        last_generated_at: new Date().toISOString(),
      }).eq('id', lesson.id);
      const pct = 20 + Math.round(((i + 1) / fillable.length) * 75);
      await db.from('courses').update({ generation_progress: pct }).eq('id', courseId);
    }

    await db.from('courses').update({ generation_status: 'review', generation_progress: 100 }).eq('id', courseId);
    logger.info('Course generation complete', { courseId, lessons: fillable.length });
    return NextResponse.json({ ok: true, lessons: fillable.length });
  } catch (err) {
    try {
      await db.from('courses').update({ generation_status: 'draft', generation_progress: 0 }).eq('id', courseId);
    } catch {
      // Preserve the original generation failure.
    }
    logger.error('Incremental generation failed', undefined, { courseId, err });
    return safeInternalError(err, 'Generation failed');
  }
}
