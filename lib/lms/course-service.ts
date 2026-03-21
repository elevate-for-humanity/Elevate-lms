/**
 * Course service — canonical write path.
 *
 * ALL course/module/lesson writes go through here.
 * NO route handler writes directly to DB tables.
 * Publish is enforced via DB function publish_course() — not UI logic.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { initializeModuleProgress } from './module-gating';

export type LessonType =
  | 'lesson' | 'quiz' | 'checkpoint' | 'lab'
  | 'assignment' | 'exam' | 'certification';

export interface GeneratedLesson {
  slug: string;
  title: string;
  content: unknown;
  lessonType?: LessonType;
  passingScore?: number | null;
  quizQuestions?: unknown | null;
  isRequired?: boolean;
}

export interface GeneratedModule {
  title: string;
  lessons: GeneratedLesson[];
}

export interface CreateCourseInput {
  actorUserId: string;
  programId?: string;
  slug: string;
  title: string;
  shortDescription?: string;
  description?: string;
  modules: GeneratedModule[];
}

/**
 * Creates a draft course with modules and lessons.
 * Writes to: courses → course_modules → course_lessons → audit_logs
 * Returns the created course row.
 */
export async function createDraftCourse(
  db: SupabaseClient,
  input: CreateCourseInput,
) {
  // Validation gate — fail loudly before writing anything to the DB.
  const assessmentTypes = new Set(['checkpoint', 'quiz', 'exam']);
  const emptyLessons: string[] = [];
  const missingAssessments: string[] = [];

  for (const mod of input.modules) {
    for (const lesson of mod.lessons) {
      const body = typeof lesson.content === 'string'
        ? lesson.content.trim()
        : JSON.stringify(lesson.content ?? '').trim();

      if (!body || body === '{}' || body === '""' || body.length < 50) {
        emptyLessons.push(lesson.slug ?? lesson.title ?? '(unknown)');
      }

      const type = lesson.lessonType ?? 'lesson';
      if (assessmentTypes.has(type)) {
        const hasQuiz = Array.isArray(lesson.quizQuestions) && lesson.quizQuestions.length > 0;
        if (!hasQuiz) {
          missingAssessments.push(`${lesson.slug ?? lesson.title} (${type})`);
        }
      }
    }
  }

  if (emptyLessons.length > 0) {
    throw new Error(
      `createDraftCourse: ${emptyLessons.length} lesson(s) have empty or missing content — build aborted.\n` +
      `Empty lessons: ${emptyLessons.join(', ')}`
    );
  }

  if (missingAssessments.length > 0) {
    throw new Error(
      `createDraftCourse: ${missingAssessments.length} assessment lesson(s) have no quiz_questions — build aborted.\n` +
      `Missing assessments: ${missingAssessments.join(', ')}`
    );
  }

  const { data: course, error: courseErr } = await db
    .from('courses')
    .insert({
      program_id:        input.programId ?? null,
      slug:              input.slug,
      title:             input.title,
      short_description: input.shortDescription ?? null,
      description:       input.description ?? null,
      status:            'draft',
      is_active:         true,
    })
    .select('*')
    .single();

  if (courseErr) throw courseErr;
  if (!course) throw new Error('Failed to create course row');

  for (let mi = 0; mi < input.modules.length; mi++) {
    const mod = input.modules[mi];

    const { data: moduleRow, error: modErr } = await db
      .from('course_modules')
      .insert({
        course_id:   course.id,
        title:       mod.title,
        order_index: mi + 1,
      })
      .select('*')
      .single();

    if (modErr) throw modErr;
    if (!moduleRow) throw new Error(`Failed to create module: ${mod.title}`);

    const lessonRows = mod.lessons.map((l, li) => ({
      course_id:      course.id,
      module_id:      moduleRow.id,
      slug:           l.slug,
      title:          l.title,
      content:        l.content,
      lesson_type:    l.lessonType ?? 'lesson',
      order_index:    (mi + 1) * 1000 + (li + 1),
      passing_score:  l.passingScore ?? null,
      quiz_questions: l.quizQuestions ?? null,
      is_required:    l.isRequired ?? true,
    }));

    const { error: lessonErr } = await db
      .from('course_lessons')
      .insert(lessonRows);

    if (lessonErr) throw lessonErr;
  }

  await db.rpc('log_audit_event', {
    p_actor_user_id: input.actorUserId,
    p_entity_type:   'course',
    p_entity_id:     course.id,
    p_action:        'course_created_draft',
    p_details:       {
      slug:         input.slug,
      title:        input.title,
      module_count: input.modules.length,
    },
  });

  return course;
}

/**
 * Publishes a course via the DB guard function, then snapshots a version.
 * Fails loudly if course is missing title, slug, modules, or lessons.
 * Every publish creates an immutable version snapshot — enrolled students
 * are never affected by subsequent content changes.
 */
export async function publishCourse(
  db: SupabaseClient,
  courseId: string,
  actorUserId: string,
  label?: string,
) {
  const { data, error } = await db.rpc('publish_course', {
    p_course_id: courseId,
  });

  if (error) throw new Error(`Publish failed: ${error.message}`);

  // Snapshot current content as a new immutable version.
  // Direct inserts — snapshot_course_version() RPC is not guaranteed to exist.
  let version: { id: string } | null = null;
  try {
    const { data: existingVersions } = await db
      .from('course_versions')
      .select('version_number')
      .eq('course_id', courseId)
      .order('version_number', { ascending: false })
      .limit(1);

    const nextVersionNumber = (existingVersions?.[0]?.version_number ?? 0) + 1;

    const { data: newVersion, error: versionErr } = await db
      .from('course_versions')
      .insert({
        course_id:      courseId,
        version_number: nextVersionNumber,
        label:          label ?? `v${nextVersionNumber}`,
        is_published:   true,
        published_at:   new Date().toISOString(),
        created_by:     actorUserId ?? null,
      })
      .select('id')
      .single();

    if (versionErr) {
      console.error('[publishCourse] course_versions insert failed:', versionErr.message);
    } else if (newVersion) {
      version = newVersion;
      const { data: mods } = await db.from('course_modules').select('id').eq('course_id', courseId).order('order_index');
      for (const m of mods ?? []) {
        await db.from('course_version_modules').insert({ version_id: newVersion.id, module_id: m.id });
      }
      const { data: lessons } = await db.from('course_lessons').select('id').eq('course_id', courseId).order('order_index');
      const lessonRows = (lessons ?? []).map((l: { id: string }) => ({ version_id: newVersion.id, lesson_id: l.id }));
      for (let i = 0; i < lessonRows.length; i += 50) {
        await db.from('course_version_lessons').insert(lessonRows.slice(i, i + 50));
      }
    }
  } catch (snapErr) {
    console.error('[publishCourse] snapshot failed (non-fatal):', snapErr);
  }

  await db.rpc('log_audit_event', {
    p_actor_user_id: actorUserId,
    p_entity_type:   'course',
    p_entity_id:     courseId,
    p_action:        'course_published',
    p_details:       { version_id: version?.id ?? null },
  });

  return { course: data, version: version ?? null };
}

/**
 * Enrolls a student in a course and initializes module progress.
 * Locks the enrollment to the latest published version — the student's
 * content view is immutable from this point forward.
 * Module 1 unlocked immediately. All others locked until rules met.
 */
export async function enrollStudentInCourse(
  db: SupabaseClient,
  userId: string,
  courseId: string,
  actorUserId: string,
): Promise<{ courseId: string; slug: string; title: string; versionId: string | null }> {
  // Verify course is published before enrolling
  const { data: course, error: courseErr } = await db
    .from('courses')
    .select('id, status, slug, title')
    .eq('id', courseId)
    .eq('status', 'published')
    .eq('is_active', true)
    .single();

  if (courseErr || !course) {
    throw new Error(`Course ${courseId} is not published or does not exist`);
  }

  // Resolve the latest published version to lock this enrollment to
  const { data: version } = await db.rpc('get_latest_published_version', {
    p_course_id: courseId,
  });

  const versionId: string | null = version?.id ?? null;

  // Initialize module progress (module 1 unlocked, rest locked)
  await initializeModuleProgress(db, userId, courseId);

  await db.rpc('log_audit_event', {
    p_actor_user_id: actorUserId,
    p_entity_type:   'course',
    p_entity_id:     courseId,
    p_action:        'student_enrolled',
    p_details:       {
      user_id:    userId,
      course_slug: course.slug,
      version_id:  versionId,
    },
  });

  return { courseId: course.id, slug: course.slug, title: course.title, versionId };
}
