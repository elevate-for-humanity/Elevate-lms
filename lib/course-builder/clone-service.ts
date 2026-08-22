import { z } from 'zod';
import { requireAdminClient } from '../supabase/admin';
import { registerProgramCourse } from './program-resolver';

const cloneCourseSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  programId: z.string().uuid().nullable().optional(),
  programSlug: z.string().min(1).optional(),
});

export async function cloneCanonicalCourse(input: unknown) {
  const body = cloneCourseSchema.parse(input);
  const db = await requireAdminClient();
  const { data: source, error: sourceError } = await db
    .from('courses')
    .select('*')
    .eq('id', body.courseId)
    .maybeSingle();
  if (sourceError) throw sourceError;
  if (!source) throw new Error('Course not found');

  const newTitle = body.title?.trim() || `${source.title} (Copy)`;
  const baseSlug = body.slug?.trim() || `${source.slug}-copy`;
  let newSlug = baseSlug;
  let attempt = 1;
  while (true) {
    const { data: existing, error } = await db.from('courses').select('id').eq('slug', newSlug).maybeSingle();
    if (error) throw error;
    if (!existing) break;
    attempt += 1;
    newSlug = `${baseSlug}-${attempt}`;
  }

  const {
    id: _id,
    created_at: _createdAt,
    updated_at: _updatedAt,
    slug: _slug,
    title: _title,
    status: _status,
    review_status: _reviewStatus,
    reviewed_at: _reviewedAt,
    reviewed_by: _reviewedBy,
    review_notes: _reviewNotes,
    submitted_for_review_at: _submittedAt,
    submitted_by: _submittedBy,
    ...courseRest
  } = source as Record<string, any>;

  const { data: newCourse, error: courseError } = await db
    .from('courses')
    .insert({
      ...courseRest,
      title: newTitle,
      slug: newSlug,
      program_id: body.programId === undefined ? source.program_id ?? null : body.programId,
      status: 'draft',
      is_active: false,
      review_status: 'draft',
      reviewed_at: null,
      reviewed_by: null,
      review_notes: null,
      submitted_for_review_at: null,
      submitted_by: null,
      updated_at: new Date().toISOString(),
    })
    .select('id,slug,title,program_id')
    .single();
  if (courseError) throw courseError;

  const { data: modules, error: moduleLoadError } = await db
    .from('course_modules')
    .select('*, course_lessons(*)')
    .eq('course_id', body.courseId)
    .order('order_index');
  if (moduleLoadError) throw moduleLoadError;

  for (const module of modules ?? []) {
    const { course_lessons: lessons, id: _moduleId, course_id: _courseId, created_at: _moduleCreated, updated_at: _moduleUpdated, ...moduleRest } = module as any;
    const { data: newModule, error: moduleError } = await db
      .from('course_modules')
      .insert({ ...moduleRest, course_id: newCourse.id, updated_at: new Date().toISOString() })
      .select('id')
      .single();
    if (moduleError || !newModule) throw moduleError ?? new Error(`Unable to clone module ${module.title}`);

    if (lessons?.length) {
      const lessonRows = lessons.map((lesson: Record<string, any>) => {
        const clone = { ...lesson };
        delete clone.id;
        delete clone.created_at;
        delete clone.updated_at;
        delete clone.course_id;
        delete clone.module_id;
        delete clone.course_module_id;
        clone.course_id = newCourse.id;
        if ('module_id' in lesson) clone.module_id = newModule.id;
        if ('course_module_id' in lesson) clone.course_module_id = newModule.id;
        clone.status = 'draft';
        clone.is_published = false;
        clone.approved = false;
        clone.updated_at = new Date().toISOString();
        return clone;
      });
      const { error: lessonError } = await db.from('course_lessons').insert(lessonRows);
      if (lessonError) throw lessonError;
    }
  }

  if (body.programSlug) {
    const mapping = await registerProgramCourse(db, body.programSlug, newCourse.id);
    if (!mapping.ok) throw new Error(mapping.error || 'Unable to register cloned program/course mapping');
  }

  return { course: newCourse, sourceCourseId: body.courseId };
}
