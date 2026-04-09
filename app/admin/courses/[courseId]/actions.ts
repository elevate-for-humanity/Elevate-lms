'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';

async function requireAdminClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) throw new Error('Forbidden');
  return getAdminClient();
}

// ── Course-level actions ──────────────────────────────────────────────────────

export async function startCourseGeneration(formData: FormData) {
  const db = await requireAdminClient();
  const courseId = String(formData.get('courseId') || '').trim();
  const prompt   = String(formData.get('prompt')   || '').trim();

  if (!courseId) throw new Error('Missing courseId');
  if (!prompt)   throw new Error('Prompt is required to start generation');

  const { error } = await db.from('courses').update({
    generation_status:   'generating',
    generation_progress: 0,
    generation_paused:   false,
    generator_prompt:    prompt,
    last_generated_at:   new Date().toISOString(),
  }).eq('id', courseId);

  if (error) throw new Error(error.message);

  // Fire-and-forget — generation runs async in the API route
  fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/admin/courses/${courseId}/generate`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ prompt }),
  }).catch(() => {});

  revalidatePath(`/admin/courses/${courseId}`);
}

export async function pauseCourseGeneration(formData: FormData) {
  const db = await requireAdminClient();
  const courseId = String(formData.get('courseId') || '').trim();
  if (!courseId) throw new Error('Missing courseId');

  const { error } = await db.from('courses')
    .update({ generation_paused: true })
    .eq('id', courseId);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function resumeCourseGeneration(formData: FormData) {
  const db = await requireAdminClient();
  const courseId = String(formData.get('courseId') || '').trim();
  if (!courseId) throw new Error('Missing courseId');

  const { data: course } = await db.from('courses')
    .select('generator_prompt')
    .eq('id', courseId)
    .single();

  const { error } = await db.from('courses').update({
    generation_paused:   false,
    generation_status:   'generating',
    generation_progress: 0,
  }).eq('id', courseId);

  if (error) throw new Error(error.message);

  fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/admin/courses/${courseId}/generate`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ prompt: course?.generator_prompt ?? '' }),
  }).catch(() => {});

  revalidatePath(`/admin/courses/${courseId}`);
}

export async function publishCourse(formData: FormData) {
  const db = await requireAdminClient();
  const courseId = String(formData.get('courseId') || '').trim();
  if (!courseId) throw new Error('Missing courseId');

  // Only allow publish if all lessons are approved
  const { data: unapproved } = await db
    .from('course_lessons')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', courseId)
    .eq('approved', false);

  if ((unapproved as any)?.count > 0) {
    throw new Error('All lessons must be approved before publishing');
  }

  const { error } = await db.from('courses').update({
    published:         true,
    generation_status: 'published',
    updated_at:        new Date().toISOString(),
  }).eq('id', courseId);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath('/admin/courses');
}

export async function unpublishCourse(formData: FormData) {
  const db = await requireAdminClient();
  const courseId = String(formData.get('courseId') || '').trim();
  if (!courseId) throw new Error('Missing courseId');

  const { error } = await db.from('courses').update({
    published:         false,
    generation_status: 'review',
    updated_at:        new Date().toISOString(),
  }).eq('id', courseId);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath('/admin/courses');
}

// ── Lesson-level actions ──────────────────────────────────────────────────────

export async function toggleLessonLock(formData: FormData) {
  const db = await requireAdminClient();
  const lessonId = String(formData.get('lessonId') || '').trim();
  const courseId = String(formData.get('courseId') || '').trim();
  const locked   = String(formData.get('locked')   || '') === 'true';

  if (!lessonId || !courseId) throw new Error('Missing IDs');

  const { error } = await db.from('course_lessons')
    .update({ locked })
    .eq('id', lessonId);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function approveLesson(formData: FormData) {
  const db = await requireAdminClient();
  const lessonId = String(formData.get('lessonId') || '').trim();
  const courseId = String(formData.get('courseId') || '').trim();

  if (!lessonId || !courseId) throw new Error('Missing IDs');

  const { error } = await db.from('course_lessons').update({
    approved:          true,
    generation_status: 'approved',
    locked:            true,
  }).eq('id', lessonId);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function unapproveLesson(formData: FormData) {
  const db = await requireAdminClient();
  const lessonId = String(formData.get('lessonId') || '').trim();
  const courseId = String(formData.get('courseId') || '').trim();

  if (!lessonId || !courseId) throw new Error('Missing IDs');

  const { error } = await db.from('course_lessons').update({
    approved:          false,
    generation_status: 'generated',
    locked:            false,
  }).eq('id', lessonId);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function saveLessonContent(formData: FormData) {
  const db = await requireAdminClient();
  const lessonId = String(formData.get('lessonId') || '').trim();
  const courseId = String(formData.get('courseId') || '').trim();
  const title    = String(formData.get('title')    || '').trim();
  const content  = String(formData.get('content')  || '').trim();

  if (!lessonId || !courseId) throw new Error('Missing IDs');
  if (!title) throw new Error('Title is required');

  const { error } = await db.from('course_lessons').update({
    title,
    content,
    updated_at: new Date().toISOString(),
  }).eq('id', lessonId);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function regenerateLessonAction(formData: FormData) {
  const db = await requireAdminClient();
  const lessonId = String(formData.get('lessonId') || '').trim();
  const courseId = String(formData.get('courseId') || '').trim();

  if (!lessonId || !courseId) throw new Error('Missing IDs');

  const { data: lesson, error: lessonErr } = await db
    .from('course_lessons')
    .select('id, title, locked, generator_prompt')
    .eq('id', lessonId)
    .single();

  if (lessonErr || !lesson) throw new Error('Lesson not found');
  if (lesson.locked) throw new Error('Lesson is locked — unlock before regenerating');

  const { data: course } = await db
    .from('courses')
    .select('title, generator_prompt')
    .eq('id', courseId)
    .single();

  // Mark regenerating
  await db.from('course_lessons')
    .update({ generation_status: 'generating' })
    .eq('id', lessonId);

  // Call the existing single-lesson regenerate endpoint
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/admin/courses/generate/regenerate`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lesson_number: 1,
        lesson_title:  lesson.title,
        module_title:  course?.title ?? '',
        course_title:  course?.title ?? '',
        instruction:   lesson.generator_prompt ?? '',
      }),
    },
  );

  if (!res.ok) {
    await db.from('course_lessons')
      .update({ generation_status: 'generated' })
      .eq('id', lessonId);
    throw new Error('Regeneration API call failed');
  }

  const { lesson: generated } = await res.json();

  await db.from('course_lessons').update({
    content:           generated?.content ?? '',
    generation_status: 'generated',
    ai_generated:      true,
    last_generated_at: new Date().toISOString(),
  }).eq('id', lessonId);

  revalidatePath(`/admin/courses/${courseId}`);
}

export async function deleteLesson(formData: FormData) {
  const db = await requireAdminClient();
  const lessonId = String(formData.get('lessonId') || '').trim();
  const courseId = String(formData.get('courseId') || '').trim();

  if (!lessonId || !courseId) throw new Error('Missing IDs');

  const { error } = await db.from('course_lessons').delete().eq('id', lessonId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/courses/${courseId}`);
}
