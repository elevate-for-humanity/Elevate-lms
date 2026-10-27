import { z } from 'zod';

const Id = z.string().trim().min(1);
const Url = z.string().url();

export const CourseVideoRequestSchema = z.object({
  tenantId: Id,
  courseId: Id,
  moduleId: Id,
  lessonId: Id,
  credentialProfile: z.string().trim().min(1),
  learningObjectives: z.array(z.string().trim().min(1)).min(1),
  sourceDocuments: z.array(Id).default([]),
  videoStyle: z.enum(['technical', 'demonstration', 'instructor']),
});

export const InstructionalPlanSchema = z.object({
  lessonTitle: z.string().trim().min(1),
  objectives: z.array(z.string().trim().min(1)).min(1),
  prerequisiteKnowledge: z.array(z.string().trim().min(1)).default([]),
  scenes: z.array(z.object({
    id: Id,
    purpose: z.enum(['introduction', 'explanation', 'diagram', 'demonstration', 'practice', 'summary']),
    objectiveIds: z.array(Id).min(1),
    narration: z.string().trim().min(1),
    visualDirection: z.string().trim().min(1),
    onScreenText: z.array(z.string().trim().min(1)).default([]),
    durationSeconds: z.number().positive(),
    sourceReferences: z.array(Id).min(1),
  })).min(3),
  knowledgeCheckIds: z.array(Id).min(1),
  finalAssessmentIds: z.array(Id).min(1),
});

export const TechnicalReviewSchema = z.object({
  approved: z.boolean(),
  errors: z.array(z.object({
    code: Id,
    severity: z.enum(['warning', 'error', 'blocking']),
    message: z.string().trim().min(1),
    sceneId: Id.optional(),
    sourceReference: Id.optional(),
  })),
  requiredCorrections: z.array(z.string().trim().min(1)),
  coverageScore: z.number().min(0).max(100),
  reviewedAt: z.string().datetime(),
});

const OverlaySchema = z.object({
  type: z.enum(['label', 'callout', 'image', 'shape']),
  content: z.string().trim().min(1),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  startFrame: z.number().int().nonnegative(),
  endFrame: z.number().int().positive(),
});

export const StoryboardManifestSchema = z.object({
  version: z.number().int().positive(),
  width: z.literal(1920),
  height: z.literal(1080),
  fps: z.literal(30),
  scenes: z.array(z.object({
    id: Id,
    objectiveIds: z.array(Id).min(1),
    startFrame: z.number().int().nonnegative(),
    endFrame: z.number().int().positive(),
    narration: z.string().trim().min(1),
    visualType: z.enum(['generated-video', 'equipment-image', 'technical-diagram', 'animated-text', 'screen-demonstration']),
    assetInstructions: z.string().trim().min(1),
    overlays: z.array(OverlaySchema).default([]),
    transition: z.enum(['cut', 'fade', 'crossfade', 'slide']).default('crossfade'),
    sourceReferences: z.array(Id).min(1),
  })).min(3),
});

export const MediaAssetSchema = z.object({
  id: Id,
  lessonId: Id,
  sceneId: Id,
  type: z.enum(['image', 'diagram', 'video', 'audio', 'caption', 'document']),
  storagePath: z.string().trim().min(1),
  checksum: z.string().regex(/^[a-f0-9]{64}$/i),
  source: z.string().trim().min(1),
  approved: z.boolean(),
  version: z.number().int().positive(),
});

export const NarrationResultSchema = z.object({
  audioTracks: z.array(z.object({ sceneId: Id, url: Url, durationSeconds: z.number().positive(), checksum: Id })).min(1),
  words: z.array(z.object({ sceneId: Id, word: z.string().min(1), start: z.number().nonnegative(), end: z.number().positive() })),
  captionsUrl: Url,
  transcript: z.string().trim().min(1),
  totalDurationSeconds: z.number().positive(),
  pronunciationMetadata: z.record(z.string(), z.string()).default({}),
});

export const VideoQualityReportSchema = z.object({
  videoPlayable: z.boolean(),
  audioPresent: z.boolean(),
  audioSynchronized: z.boolean(),
  captionsPresent: z.boolean(),
  transcriptMatches: z.boolean(),
  expectedDuration: z.number().positive(),
  actualDuration: z.number().positive(),
  missingAssets: z.array(Id),
  blackFrames: z.array(z.number().int().nonnegative()),
  frozenRanges: z.array(z.object({ start: z.number().nonnegative(), end: z.number().positive() })),
  silentRanges: z.array(z.object({ start: z.number().nonnegative(), end: z.number().positive() })),
  mobilePlayable: z.boolean(),
  approved: z.boolean(),
});

export const CourseVideoJobStateSchema = z.enum([
  'requested', 'planning', 'technical_review', 'storyboard_ready', 'generating_assets',
  'generating_narration', 'rendering', 'quality_review', 'human_review', 'approved',
  'published', 'blocked', 'retryable_failed', 'permanent_failed', 'cancelled',
]);

export const InteractiveLessonPackageSchema = z.object({
  videoUrl: Url,
  streamingUrl: Url.optional(),
  captionsUrl: Url,
  transcript: z.string().trim().min(1),
  timeline: z.array(z.discriminatedUnion('type', [
    z.object({ type: z.literal('pause'), at: z.number().nonnegative() }),
    z.object({ type: z.literal('question'), at: z.number().nonnegative(), questionId: Id }),
    z.object({ type: z.literal('diagram'), at: z.number().nonnegative(), assetId: Id }),
    z.object({ type: z.literal('remediation'), at: z.number().nonnegative(), lessonId: Id }),
  ])),
  completionRules: z.object({
    requiredWatchPercent: z.number().int().min(1).max(100),
    minimumSeatTimeSeconds: z.number().int().nonnegative(),
    requiredInteractionIds: z.array(Id),
    passingScore: z.number().int().min(0).max(100),
  }),
});

export type CourseVideoRequest = z.infer<typeof CourseVideoRequestSchema>;
export type InstructionalPlan = z.infer<typeof InstructionalPlanSchema>;
export type StoryboardManifest = z.infer<typeof StoryboardManifestSchema>;
export type CourseVideoJobState = z.infer<typeof CourseVideoJobStateSchema>;
