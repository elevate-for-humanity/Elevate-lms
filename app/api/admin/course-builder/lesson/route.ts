import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { getServiceDb } from '@/lib/course-builder/db';

export const dynamic = 'force-dynamic';

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
  evidenceType: z.enum(['quiz', 'upload', 'video', 'audio', 'checklist', 'observation', 'attestation', 'exam', 'reflection']).optional(),
});

const instructorRequirementSchema = z.object({
  required: z.boolean(),
  roleTypes: z.array(z.string()).optional(),
  approvalAuthority: z.enum(['lesson', 'module', 'program']).optional(),
  supervisionMethod: z.enum(['live', 'recorded', 'document_review', 'observation']).optional(),
});

const bodySchema = z.object({
  id: z.string().uuid().optional(),
  courseId: z.string().uuid(),
  moduleId: z.string().uuid(),
  slug: z.string().min(1),
  title: z.string().min(1),
  orderIndex: z.number().int().min(0),
  lessonType: z.enum(['video','reading','quiz','assignment','practical','checkpoint','exam','live_session','fieldwork','observation']),
  durationMinutes: z.number().positive(),
  learningObjectives: z.array(z.string()).min(1),
  content: z.record(z.unknown()),
  renderedHtml: z.string().nullable().optional(),
  videoUrl: z.string().nullable().optional(),
  videoConfig: z.record(z.unknown()).nullable().optional(),
  quizQuestions: z.array(quizQuestionSchema).optional(),
  passingScore: z.number().nullable().optional(),
  competencyChecks: z.array(competencyCheckSchema).optional(),
  instructorNotes: z.string().nullable().optional(),
  practicalRequired: z.boolean().optional(),
  requiredArtifacts: z.array(z.enum(['text','video','audio','checklist','document','image','form'])).optional(),
  activities: z.array(z.object({
    type: z.enum(['video','reading','worksheet','reflection','upload','checklist','quiz','observation','discussion','lab']),
    label: z.string(),
    config: z.record(z.unknown()).optional(),
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

export async function POST(req: NextRequest) {
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = bodySchema.parse(await req.json());
    const db = getServiceDb();

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

    if (body.id) {
      const { data, error } = await db.from('course_lessons').update(payload).eq('id', body.id).select('*').single();
      if (error) throw error;
      return NextResponse.json({ ok: true, lesson: data });
    }

    const { data, error } = await db.from('course_lessons').insert(payload).select('*').single();
    if (error) throw error;
    return NextResponse.json({ ok: true, lesson: data });
  } catch (error) {
    console.error('[course-builder/lesson]', error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 400 });
  }
}
