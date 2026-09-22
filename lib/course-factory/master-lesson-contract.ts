import { z } from 'zod';
import { CourseExperienceSchema, InstructionalTimelineSchema, InteractiveVideoExperienceSchema } from './experience-contract';

/** Canonical Course Builder lesson contract. Specialized contracts remain intact and compose here. */
export const MasterLessonContractSchema = z.object({
  identity: z.object({
    lessonId: z.string().uuid(),
    courseId: z.string().uuid(),
    title: z.string().trim().min(1),
    objectives: z.array(z.string().trim().min(1)).min(1),
  }),
  instruction: z.object({
    content: z.string().trim().min(500),
    experience: CourseExperienceSchema,
  }),
  media: z.object({
    narrationScript: z.string().trim().min(200),
    instructionalTimeline: InstructionalTimelineSchema,
    interactiveVideo: InteractiveVideoExperienceSchema.optional(),
    licensedAssets: z.array(z.object({
      assetId: z.string().trim().min(1),
      provider: z.string().trim().min(1),
      provenance: z.string().trim().min(1),
      sceneIds: z.array(z.string().trim().min(1)).min(1),
    })).min(1),
    captionsRequired: z.literal(true),
    transcriptRequired: z.literal(true),
  }),
  learning: z.object({
    knowledgeCheckCount: z.number().int().min(3),
    hasScenario: z.literal(true),
    hasCaseStudy: z.literal(true),
    hasExercise: z.literal(true),
    hasPracticalTask: z.literal(true),
    hasRemediation: z.literal(true),
  }),
  qa: z.object({
    mediaDecoded: z.literal(true),
    narrationVerified: z.literal(true),
    narrationProviderRecorded: z.literal(true),
    visualEvidenceVerified: z.literal(true),
    noLoopingVisuals: z.literal(true),
    noLoopingNarration: z.literal(true),
    objectiveCoverageVerified: z.literal(true),
    learnerPreviewVerified: z.literal(true),
  }),
  publication: z.object({
    humanReviewApproved: z.literal(true),
    canonicalLessonPersisted: z.literal(true),
    learnerFacingLessonAssembled: z.literal(true),
  }),
}).strict();

export type MasterLessonContract = z.infer<typeof MasterLessonContractSchema>;
export const MASTER_LESSON_GATE_ORDER = ['identity','instruction','media','learning','qa','publication'] as const;
export function validateMasterLessonContract(input: unknown) {
  return MasterLessonContractSchema.safeParse(input);
}
