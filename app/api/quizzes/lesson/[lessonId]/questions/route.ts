import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { withApiAudit } from '@/lib/audit/withApiAudit';

/**
 * GET /api/quizzes/lesson/[lessonId]/questions
 *
 * Two-tier quiz question lookup:
 *
 * Tier 1 — quiz_questions table joined via training_lessons.quiz_id.
 *   Used by manually-created quizzes via the admin quiz manager.
 *   quiz_questions has no lesson_id column — join is lesson → quiz_id → quiz_questions.quiz_id.
 *
 * Tier 2 — training_lessons.quiz_questions JSONB (fallback).
 *   Used by AI-generated courses. The generator stores questions directly
 *   on the lesson row. If tier 1 returns nothing, we read this and normalise
 *   it to the same shape the client expects.
 *
 * Both tiers return: { id, question, options, order_index, correct_answer, explanation }
 */
async function _GET(
  req: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params;
    const supabase = await createClient();
    const db = createAdminClient() || supabase;

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Load lesson row once — need quiz_id and quiz_questions JSONB
    const { data: lessonRow } = await db
      .from('training_lessons')
      .select('quiz_id, quiz_questions')
      .eq('id', lessonId)
      .maybeSingle();

    // ── Tier 1: quiz_questions table via lesson.quiz_id ───────────────────────
    if (lessonRow?.quiz_id) {
      const { data: questions, error } = await db
        .from('quiz_questions')
        .select('id, question_text, options, order_index, correct_answer, explanation')
        .eq('quiz_id', lessonRow.quiz_id)
        .order('order_index');

      if (!error && questions && questions.length > 0) {
        const normalised = questions.map((q: any) => ({
          id:             q.id,
          question:       q.question_text,
          options:        typeof q.options === 'string' ? JSON.parse(q.options) : (q.options ?? []),
          order_index:    q.order_index ?? 0,
          correct_answer: q.correct_answer,
          explanation:    q.explanation,
        }));
        return NextResponse.json({ questions: normalised, source: 'quiz_questions_table' });
      }
    }

    // ── Tier 2: training_lessons.quiz_questions JSONB (AI-generated) ──────────
    // Generator shape: [{ question, options: string[], correct_index: number, explanation }]
    if (lessonRow?.quiz_questions) {
      let raw: any[] = [];
      try {
        raw = typeof lessonRow.quiz_questions === 'string'
          ? JSON.parse(lessonRow.quiz_questions)
          : lessonRow.quiz_questions;
      } catch { raw = []; }

      if (Array.isArray(raw) && raw.length > 0) {
        const normalised = raw.map((q: any, idx: number) => ({
          id:             `jsonb-${lessonId}-${idx}`,
          question:       q.question ?? q.question_text ?? '',
          options:        Array.isArray(q.options) ? q.options : [],
          order_index:    idx,
          correct_index:  q.correct_index ?? null,
          correct_answer: q.correct_answer ?? (q.options?.[q.correct_index] ?? null),
          explanation:    q.explanation ?? '',
        }));
        return NextResponse.json({ questions: normalised, source: 'lesson_jsonb' });
      }
    }

    return NextResponse.json({ questions: [], source: 'none' });
  } catch {
    return NextResponse.json({ questions: [] });
  }
}

export const GET = withApiAudit('/api/quizzes/lesson/[lessonId]/questions', _GET);
