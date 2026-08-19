#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error('Supabase runtime credentials are required');

const db = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  const { data: course, error: courseError } = await db
    .from('courses')
    .select('id,slug,title,status,is_active')
    .eq('slug', 'entrepreneurship')
    .maybeSingle();
  if (courseError) throw courseError;
  assert(course?.id, 'ESB course is missing');

  const { data: lessons, error: lessonError } = await db
    .from('course_lessons')
    .select('id,title,lesson_type,order_index,quiz_questions,passing_score')
    .eq('course_id', course.id)
    .order('order_index');
  if (lessonError) throw lessonError;
  assert(lessons?.length === 35, `ESB must contain exactly 35 lessons; found ${lessons?.length ?? 0}`);

  const checkpoints = lessons.filter((lesson) => lesson.lesson_type === 'checkpoint');
  const exams = lessons.filter((lesson) => lesson.lesson_type === 'exam');
  assert(checkpoints.length === 4, `ESB must contain four domain checkpoints; found ${checkpoints.length}`);
  assert(exams.length === 1, `ESB must contain one final exam; found ${exams.length}`);

  for (const checkpoint of checkpoints) {
    const count = Array.isArray(checkpoint.quiz_questions) ? checkpoint.quiz_questions.length : 0;
    assert(count >= 10, `${checkpoint.title} must contain at least 10 questions; found ${count}`);
    assert(Number(checkpoint.passing_score) >= 80, `${checkpoint.title} must require at least 80% to pass`);
  }

  const finalExam = exams[0];
  const finalCount = Array.isArray(finalExam.quiz_questions) ? finalExam.quiz_questions.length : 0;
  assert(finalCount === 50, `ESB final exam must contain exactly 50 questions; found ${finalCount}`);
  assert(Number(finalExam.passing_score) >= 80, 'ESB final exam must require at least 80% to pass');

  const assessedIds = [...checkpoints, finalExam].map((lesson) => lesson.id);
  const { data: canonicalQuestions, error: questionError } = await db
    .from('assessment_questions')
    .select('lesson_id,prompt,choices,correct_answer')
    .in('lesson_id', assessedIds);
  if (questionError) throw questionError;

  for (const lesson of [...checkpoints, finalExam]) {
    const expected = lesson.lesson_type === 'exam'
      ? 50
      : Math.max(10, Array.isArray(lesson.quiz_questions) ? lesson.quiz_questions.length : 0);
    const actual = canonicalQuestions?.filter((question) => question.lesson_id === lesson.id).length ?? 0;
    assert(actual >= expected, `${lesson.title} canonical assessment bank is incomplete: ${actual}/${expected}`);
  }

  assert(
    !(canonicalQuestions ?? []).some((question) => /^\s*\[?placeholder/i.test(String(question.prompt ?? ''))),
    'ESB canonical assessment bank contains placeholder questions',
  );

  const { data: videoJobs, error: videoError } = await db
    .from('video_jobs')
    .select('lesson_id,status,error_message')
    .eq('course_id', course.id);
  if (videoError) throw videoError;
  const uniqueVideoLessons = new Set((videoJobs ?? []).map((job) => job.lesson_id));
  assert(uniqueVideoLessons.size === 35, `ESB must have a video job for every lesson; found ${uniqueVideoLessons.size}/35`);
  assert(!(videoJobs ?? []).some((job) => job.status === 'failed'), 'ESB contains failed video jobs after rebuild');

  console.log(JSON.stringify({
    ok: true,
    courseId: course.id,
    lessons: lessons.length,
    checkpoints: checkpoints.length,
    checkpointQuestions: checkpoints.reduce((sum, lesson) => sum + (Array.isArray(lesson.quiz_questions) ? lesson.quiz_questions.length : 0), 0),
    finalExamQuestions: finalCount,
    canonicalAssessmentQuestions: canonicalQuestions?.length ?? 0,
    videoJobs: uniqueVideoLessons.size,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
