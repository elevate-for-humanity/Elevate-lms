import { z } from 'zod';

const IdSchema = z.string().trim().min(1);

export const CompetencySchema = z.object({
  id: IdSchema,
  domain: z.string().trim().min(1),
  objective: z.string().trim().min(1),
  requiredKnowledge: z.array(z.string().trim().min(1)).min(1),
  assessmentStandard: z.string().trim().min(1),
});

export const StoryboardSceneSchema = z.object({
  objectiveId: IdSchema,
  sceneNumber: z.number().int().positive(),
  narration: z.string().trim().min(1),
  visualDirection: z.string().trim().min(1),
  onScreenText: z.array(z.string().trim().min(1)).default([]),
  demonstration: z.string().trim().min(1).optional(),
  durationSeconds: z.number().positive(),
  interactionAfterScene: IdSchema.optional(),
});

const TimelineCueSchema = z.object({
  id: IdSchema,
  start: z.number().nonnegative(),
  end: z.number().positive(),
}).refine((cue) => cue.end > cue.start, { message: 'Timeline cue end must follow start' });

export const LessonTimelineSchema = z.object({
  durationSeconds: z.number().positive(),
  audio: z.array(TimelineCueSchema.safeExtend({ narration: z.string().trim().min(1) })),
  visuals: z.array(TimelineCueSchema.safeExtend({ direction: z.string().trim().min(1), assetUrl: z.string().url().optional() })),
  captions: z.array(TimelineCueSchema.safeExtend({ text: z.string().trim().min(1) })),
  interactions: z.array(TimelineCueSchema.safeExtend({ interactionId: IdSchema, pausePlayback: z.boolean().default(true) })),
  checkpoints: z.array(TimelineCueSchema.safeExtend({ questionId: IdSchema, remediationSceneNumber: z.number().int().positive().optional() })),
});

export const CoursePackageQuestionSchema = z.object({
  id: IdSchema,
  type: z.enum(['single-choice', 'multiple-choice', 'true-false', 'numeric', 'short-answer']),
  prompt: z.string().trim().min(1),
  options: z.array(z.string().trim().min(1)).default([]),
  correctAnswers: z.array(z.union([z.string(), z.number(), z.boolean()])).min(1),
  explanation: z.string().trim().min(1),
  objectiveIds: z.array(IdSchema).min(1),
  domainKey: z.string().trim().min(1),
  difficulty: z.enum(['recall', 'application', 'analysis']).default('application'),
  source: z.string().trim().min(1).optional(),
});

export const CoursePackageCompletionSchema = z.object({
  required: z.boolean().default(true),
  minimumSeatTimeSeconds: z.number().int().nonnegative().default(0),
  requiredWatchPercent: z.number().int().min(0).max(100).default(0),
  requiredInteractionIds: z.array(IdSchema).default([]),
  passingScore: z.number().int().min(0).max(100).default(80),
  instructorSignoffRequired: z.boolean().default(false),
  evidenceRequired: z.boolean().default(false),
});

export const CoursePackageLessonSchema = z.object({
  id: IdSchema,
  slug: IdSchema,
  title: z.string().trim().min(1),
  type: z.enum([
    'lesson', 'orientation', 'checkpoint', 'quiz', 'exam', 'final_exam',
    'assessment', 'practical', 'lab', 'assignment', 'certification',
  ]),
  order: z.number().int().nonnegative(),
  durationMinutes: z.number().int().nonnegative(),
  objectives: z.array(z.string().trim().min(1)).default([]),
  competencies: z.array(CompetencySchema).default([]),
  html: z.string().default(''),
  videoUrl: z.string().url().nullable(),
  experience: z.record(z.string(), z.unknown()).nullable(),
  storyboard: z.array(StoryboardSceneSchema).default([]),
  timeline: LessonTimelineSchema.nullable(),
  questions: z.array(CoursePackageQuestionSchema).default([]),
  completion: CoursePackageCompletionSchema,
  published: z.boolean(),
  approved: z.boolean(),
});

export const CoursePackageModuleSchema = z.object({
  id: IdSchema,
  slug: IdSchema,
  title: z.string().trim().min(1),
  description: z.string().nullable(),
  domainKey: z.string().trim().min(1).nullable(),
  order: z.number().int().nonnegative(),
  required: z.boolean(),
  lessons: z.array(CoursePackageLessonSchema),
});

export const CoursePackageSchema = z.object({
  schemaVersion: z.literal('1.0'),
  id: IdSchema,
  slug: IdSchema,
  title: z.string().trim().min(1),
  description: z.string().nullable(),
  status: z.string().trim().min(1),
  version: z.number().int().positive(),
  credential: z.object({
    profileKey: z.string().nullable(),
    governingBody: z.string().nullable(),
    standardVersion: z.string().nullable(),
  }),
  evidence: z.object({
    accessibility: z.object({ approved: z.boolean(), checkedAt: z.string().datetime(), findings: z.array(z.string()) }).nullable(),
    learnerPreview: z.object({ approved: z.boolean(), checkedAt: z.string().datetime(), reviewerId: IdSchema, version: z.number().int().positive() }).nullable(),
  }),
  modules: z.array(CoursePackageModuleSchema).min(1),
  generatedAt: z.string().datetime(),
});

export type CoursePackage = z.infer<typeof CoursePackageSchema>;
export type CoursePackageLesson = z.infer<typeof CoursePackageLessonSchema>;
