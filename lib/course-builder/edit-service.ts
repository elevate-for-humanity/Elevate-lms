import { z } from 'zod';
import { getServiceDb } from './db';
import { requireAdminClient } from '../supabase/admin';

const moduleSchema = z.object({
  id: z.string().uuid().optional(),
  courseId: z.string().uuid(),
  title: z.string().min(1),
  slug: z.string().min(1),
  orderIndex: z.number().int().min(0),
  domainKey: z.string().min(1),
  targetHours: z.number().positive(),
  quizRequired: z.boolean(),
  quizQuestionCount: z.number().int().nullable().optional(),
  practicalRequired: z.boolean(),
  minimumPassingRate: z.number().nullable().optional(),
  supervisedHoursRequired: z.number().nullable().optional(),
  fieldworkHoursRequired: z.number().nullable().optional(),
});

const quizQuestionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  type: z.enum(['multiple_choice', 'true_false', 'short_answer', 'scenario']),
  options: z.array(z.string()).optional(),
  correctAnswer: z.union([z.string(), z.array(z.string())]).optional(),
  explanation: z.string().optional(),
  points: z.number().optional(),
  domainKey: z.string().optional(),
  competencyKeys: z.array(z.string()).optional(),
});

const competencyCheckSchema = z.object({
  key: z.string(),
  label: z.string(),
  requiresInstructorSignoff: z.boolean(),
  isCritical: z.boolean(),
  domainKey: z.string().optional(),
  assessmentMethod: z.enum(['quiz', 'lab', 'exam', 'observation', 'assignment']).optional(),
  evidenceType: z.enum(['quiz','upload','video','audio','checklist','observation','attestation','exam','reflection']).optional(),
});

const instructorRequirementSchema = z.object({
  required: z.boolean(),
  roleTypes: z.array(z.string()).optional(),
  approvalAuthority: z.enum(['lesson', 'module', 'program']).optional(),
  supervisionMethod: z.enum(['live', 'recorded', 'document_review', 'observation']).optional(),
});

const lessonSchema = z.object({
  id: z.string().uuid().optional(),
  courseId: z.string().uuid(),
  moduleId: z.string().uuid(),
  slug: z.string().min(1),
  title: z.string().min(1),
  orderIndex: z.number().int().min(0),
  lessonType: z.enum(['lesson','video','reading','quiz','assignment','practical','checkpoint','exam','live_session','fieldwork','observation']),
  durationMinutes: z.number().positive(),
  learningObjectives: z.array(z.string()).min(1),
  content: z.record(z.string(), z.unknown()),
  renderedHtml: z.string().nullable().optional(),
  videoUrl: z.string().nullable().optional(),
  videoConfig: z.record(z.string(), z.unknown()).nullable().optional(),
  quizQuestions: z.array(quizQuestionSchema).optional(),
  passingScore: z.number().nullable().optional(),
  competencyChecks: z.array(competencyCheckSchema).optional(),
  instructorNotes: z.string().nullable().optional(),
  practicalRequired: z.boolean().optional(),
  requiredArtifacts: z.array(z.enum(['text','video','audio','checklist','document','image','form'])).optional(),
  activities: z.array(z.object({
    type: z.enum(['video','reading','worksheet','reflection','upload','checklist','quiz','observation','discussion','lab']),
    label: z.string(),
    config: z.record(z.string(), z.unknown()).optional(),
  })).optional(),
  isRequired: z.boolean().optional(),
  domainKey: z.string().nullable().optional(),
  hourCategory: z.enum(['didactic','practical','clinical','fieldwork','observation','supervision','self_study','exam']).nullable().optional(),
  evidenceType: z.enum(['quiz','upload','video','audio','checklist','observation','attestation','exam','reflection']).nullable().optional(),
  deliveryMethod: z.enum(['online_async','online_live','in_person','hybrid','field_based']).nullable().optional(),
  requiresInstructorSignoff: z.boolean().optional(),
  instructorRequirement: instructorRequirementSchema.nullable().optional(),
  minimumSeatTimeMinutes: z.number().nullable().optional(),
  fieldworkEligible: z.boolean().optional(),
});

const lessonPatchSchema = z.object({
  lessonId: z.string().uuid(),
  title: z.string().optional(),
  content: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
  video_url: z.string().nullable().optional(),
  step_type: z.string().optional(),
  duration_minutes: z.number().nullable().optional(),
  passing_score: z.number().nullable().optional(),
  status: z.enum(['draft','published']).optional(),
});

const deleteLessonSchema = z.object({
  lessonId: z.string().uuid(),
  courseId: z.string().uuid().optional(),
});

const reorderLessonsSchema = z.object({
  courseId: z.string().uuid(),
  lessonA: z.object({ id: z.string().uuid(), orderIndex: z.number().int().min(0) }),
  lessonB: z.object({ id: z.string().uuid(), orderIndex: z.number().int().min(0) }),
});

const scormLinkSchema = z.object({
  courseId: z.string().uuid(),
  scormPackageId: z.string().uuid(),
});

export async function saveCourseModule(input: unknown) {
  const body = moduleSchema.parse(input);
  const db = await requireAdminClient();
  const payload = {
    course_id: body.courseId,
    title: body.title,
    slug: body.slug,
    order_index: body.orderIndex,
    target_hours: body.targetHours,
    domain_key: body.domainKey,
    metadata: {
      quizRequired: body.quizRequired,
      quizQuestionCount: body.quizQuestionCount ?? null,
      practicalRequired: body.practicalRequired,
      minimumPassingRate: body.minimumPassingRate ?? null,
      supervisedHoursRequired: body.supervisedHoursRequired ?? null,
      fieldworkHoursRequired: body.fieldworkHoursRequired ?? null,
    },
  };
  const query = body.id
    ? db.from('course_modules').update(payload).eq('id', body.id)
    : db.from('course_modules').insert(payload);
  const { data, error } = await query.select('*').single();
  if (error) throw error;
  return data;
}

export async function saveCourseLesson(input: unknown) {
  const body = lessonSchema.parse(input);
  const db = await getServiceDb();
  const payload = {
    course_id: body.courseId,
    module_id: body.moduleId,
    slug: body.slug,
    title: body.title,
    order_index: body.orderIndex,
    lesson_type: body.lessonType,
    duration_minutes: body.durationMinutes,
    content: body.content,
    rendered_html: body.renderedHtml ?? null,
    video_url: body.videoUrl ?? null,
    video_config: body.videoConfig ?? null,
    quiz_questions: body.quizQuestions ?? [],
    passing_score: body.passingScore ?? null,
    learning_objectives: body.learningObjectives,
    competency_checks: body.competencyChecks ?? [],
    instructor_notes: body.instructorNotes ?? null,
    practical_required: body.practicalRequired ?? false,
    activities: body.activities ?? [],
    is_required: body.isRequired ?? true,
    metadata: {
      requiredArtifacts: body.requiredArtifacts ?? [],
      domainKey: body.domainKey ?? null,
      hourCategory: body.hourCategory ?? null,
      evidenceType: body.evidenceType ?? null,
      deliveryMethod: body.deliveryMethod ?? null,
      requiresInstructorSignoff: body.requiresInstructorSignoff ?? false,
      instructorRequirement: body.instructorRequirement ?? null,
      minimumSeatTimeMinutes: body.minimumSeatTimeMinutes ?? null,
      fieldworkEligible: body.fieldworkEligible ?? false,
    },
  };
  const query = body.id
    ? db.from('course_lessons').update(payload).eq('id', body.id)
    : db.from('course_lessons').insert(payload);
  const { data, error } = await query.select('*').single();
  if (error) throw error;
  return data;
}

export async function patchCourseLesson(input: unknown) {
  const body = lessonPatchSchema.parse(input);
  const db = await requireAdminClient();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.title !== undefined) update.title = body.title;
  if (body.content !== undefined) update.content = body.content;
  if (body.video_url !== undefined) update.video_url = body.video_url;
  if (body.step_type !== undefined) update.lesson_type = body.step_type;
  if (body.duration_minutes !== undefined) update.duration_minutes = body.duration_minutes;
  if (body.passing_score !== undefined) update.passing_score = body.passing_score;
  if (body.status !== undefined) update.status = body.status;
  const { data, error } = await db
    .from('course_lessons')
    .update(update)
    .eq('id', body.lessonId)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Lesson not found');
  return data;
}

export async function deleteCourseLesson(input: unknown) {
  const body = deleteLessonSchema.parse(input);
  const db = await requireAdminClient();
  let query = db.from('course_lessons').delete().eq('id', body.lessonId);
  if (body.courseId) query = query.eq('course_id', body.courseId);
  const { error } = await query;
  if (error) throw error;
  return { lessonId: body.lessonId };
}

export async function reorderCourseLessons(input: unknown) {
  const body = reorderLessonsSchema.parse(input);
  const db = await requireAdminClient();
  const now = new Date().toISOString();
  const [first, second] = await Promise.all([
    db.from('course_lessons')
      .update({ order_index: body.lessonA.orderIndex, updated_at: now })
      .eq('id', body.lessonA.id)
      .eq('course_id', body.courseId),
    db.from('course_lessons')
      .update({ order_index: body.lessonB.orderIndex, updated_at: now })
      .eq('id', body.lessonB.id)
      .eq('course_id', body.courseId),
  ]);
  if (first.error) throw first.error;
  if (second.error) throw second.error;
  return { lessonA: body.lessonA, lessonB: body.lessonB };
}

export async function linkCourseScormPackage(input: unknown, actorId: string) {
  const body = scormLinkSchema.parse(input);
  const db = await requireAdminClient();
  const { data, error } = await db
    .from('scorm_packages')
    .update({ course_id: body.courseId, status: 'active', updated_at: new Date().toISOString() })
    .eq('id', body.scormPackageId)
    .select('id,title,course_id,status,launch_url')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('SCORM package not found');

  await db.from('audit_logs').insert({
    user_id: actorId,
    action: 'course_builder.scorm.linked',
    resource_type: 'scorm_packages',
    resource_id: body.scormPackageId,
    metadata: { courseId: body.courseId, scormPackageId: body.scormPackageId, launchUrl: data.launch_url },
    created_at: new Date().toISOString(),
  });
  return data;
}
