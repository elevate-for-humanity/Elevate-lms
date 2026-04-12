/**
 * POST /api/admin/courses/[courseId]/generate
 *
 * Incremental DB-backed course generator.
 * Writes one lesson at a time. Respects locked lessons.
 * Checks generation_paused before each lesson so admin can interrupt.
 *
 * Flow:
 *   1. Mark course generating, progress=5
 *   2. Generate outline via OpenAI → insert lesson shells (queued)
 *   3. For each unlocked lesson: generate content → update row → advance progress
 *   4. Mark course review, progress=100
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import OpenAI from 'openai';

import { hydrateProcessEnv } from '@/lib/secrets';

const ADMIN_ROLES = new Set(['admin', 'super_admin']);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// ── OpenAI helpers ────────────────────────────────────────────────────────────

function getOpenAI(): OpenAI {
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function generateOutline(
  openai: OpenAI,
  courseTitle: string,
  prompt: string,
): Promise<Array<{ title: string; sort_order: number; description: string }>> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an instructional designer. Given a course title and description, produce a lesson outline.
Return ONLY valid JSON — no markdown:
{
  "lessons": [
    { "title": "string", "sort_order": 1, "description": "one sentence" }
  ]
}
Rules: 6-12 lessons total. Titles are specific and action-oriented.`,
      },
      {
        role: 'user',
        content: `Course: "${courseTitle}"\n\nDescription/Prompt: ${prompt}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 1500,
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) return NextResponse.json({ error: 'Empty outline response from OpenAI' }, { status: 500 });
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.lessons)) return NextResponse.json({ error: 'Invalid outline shape' }, { status: 500 });
  return parsed.lessons;
}

async function generateLessonContent(
  openai: OpenAI,
  courseTitle: string,
  lessonTitle: string,
  lessonDescription: string,
): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an instructional designer writing lesson content for a workforce LMS.
Write 300-600 words of real instructional content. No placeholders. No meta-commentary.
Use clear headings, short paragraphs, and practical examples.`,
      },
      {
        role: 'user',
        content: `Course: "${courseTitle}"\nLesson: "${lessonTitle}"\nObjective: ${lessonDescription}\n\nWrite the lesson content now.`,
      },
    ],
    temperature: 0.4,
    max_tokens: 1200,
  });

  return completion.choices[0]?.message?.content?.trim() ?? '';
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  await hydrateProcessEnv();
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  const user = await getCurrentUser();
  if (!user) return safeError('Unauthorized', 401);

  const db = await getAdminClient();
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !ADMIN_ROLES.has(profile.role)) return safeError('Forbidden', 403);

  const { courseId } = await params;

  // Load course — must be draft or review to regenerate
  const { data: course, error: courseErr } = await db
    .from('courses')
    .select('id, title, generator_prompt, generation_status')
    .eq('id', courseId)
    .single();

  if (courseErr || !course) return safeError('Course not found', 404);
  if (course.generation_status === 'generating') {
    return safeError('Generation already in progress', 409);
  }

  const body = await req.json().catch(() => ({}));
  const prompt: string = (body.prompt ?? course.generator_prompt ?? '').trim();
  if (!prompt) return safeError('prompt is required', 400);

  try {
    // ── Phase 1: mark generating ──────────────────────────────────────────
    await db.from('courses').update({
      generation_status:   'generating',
      generation_progress: 5,
      generation_paused:   false,
      generator_prompt:    prompt,
      last_generated_at:   new Date().toISOString(),
    }).eq('id', courseId);

    const openai = getOpenAI();

    // ── Phase 2: generate outline, insert lesson shells ───────────────────
    const outline = await generateOutline(openai, course.title, prompt);

    // Only insert shells for lessons that don't already exist (safe re-run)
    const { data: existing } = await db
      .from('course_lessons')
      .select('title')
      .eq('course_id', courseId);

    const existingTitles = new Set((existing ?? []).map((l: any) => l.title));

    for (const item of outline) {
      if (existingTitles.has(item.title)) continue;
      await db.from('course_lessons').insert({
        course_id:         courseId,
        title:             item.title,
        content:           '',
        order_index:       item.sort_order,
        generation_status: 'queued',
        ai_generated:      true,
        approved:          false,
        locked:            false,
        generator_prompt:  item.description,
      });
    }

    await db.from('courses').update({ generation_progress: 20 }).eq('id', courseId);

    // ── Phase 3: fill each unlocked lesson one at a time ──────────────────
    const { data: lessons } = await db
      .from('course_lessons')
      .select('id, title, locked, generation_status, generator_prompt')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    const fillable = (lessons ?? []).filter(
      (l: any) => !l.locked && l.generation_status !== 'approved',
    );

    for (let i = 0; i < fillable.length; i++) {
      const lesson = fillable[i];

      // Check pause flag before each lesson
      const { data: fresh } = await db
        .from('courses')
        .select('generation_paused')
        .eq('id', courseId)
        .single();

      if (fresh?.generation_paused) {
        await db.from('courses').update({
          generation_status:   'review',
          generation_progress: 20 + Math.round((i / fillable.length) * 75),
        }).eq('id', courseId);
        logger.info('Course generation paused', { courseId, lessonIndex: i });
        return NextResponse.json({ paused: true, completedLessons: i });
      }

      // Mark this lesson generating
      await db.from('course_lessons')
        .update({ generation_status: 'generating' })
        .eq('id', lesson.id);

      const content = await generateLessonContent(
        openai,
        course.title,
        lesson.title,
        lesson.generator_prompt ?? lesson.title,
      );

      await db.from('course_lessons').update({
        content,
        generation_status:  'generated',
        last_generated_at:  new Date().toISOString(),
      }).eq('id', lesson.id);

      const pct = 20 + Math.round(((i + 1) / fillable.length) * 75);
      await db.from('courses').update({ generation_progress: pct }).eq('id', courseId);
    }

    // ── Phase 4: mark ready for review ────────────────────────────────────
    await db.from('courses').update({
      generation_status:   'review',
      generation_progress: 100,
    }).eq('id', courseId);

    logger.info('Course generation complete', { courseId, lessons: fillable.length });
    return NextResponse.json({ ok: true, lessons: fillable.length });

  } catch (err) {
    // On failure, reset to draft so admin can retry
    await db.from('courses').update({
      generation_status:   'draft',
      generation_progress: 0,
    }).eq('id', courseId).catch(() => {});

    logger.error('Incremental generation failed', { courseId, err });
    return safeInternalError(err, 'Generation failed');
  }
}
