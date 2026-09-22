import { z } from 'zod';
import { CourseExperienceSchema, publicationRequirements } from './experience-contract';
import { LearningIntelligenceSchema } from './learning-intelligence';
import { REQUIRED_COURSE_GATES } from '@/lib/course-package/readiness';

/**
 * Sole Course Builder credential-course contract.
 * Existing schemas are composed here; callers must not invent parallel completion contracts.
 */
export const WorkforceEvidenceSchema = z.object({
  socCode: z.string().trim().min(1),
  onetSocCode: z.string().trim().min(1),
  occupationTitle: z.string().trim().min(1),
  sourceVersion: z.string().trim().min(1),
  tasks: z.array(z.string().trim().min(1)).min(1),
  knowledge: z.array(z.string().trim().min(1)).min(1),
  skills: z.array(z.string().trim().min(1)).min(1),
  abilities: z.array(z.string().trim().min(1)).min(1),
  workActivities: z.array(z.string().trim().min(1)).min(1),
  technologySkills: z.array(z.string().trim().min(1)).default([]),
  careerFeedEnabled: z.literal(true),
});

export const CredentialAuthoritySchema = z.object({
  credentialName: z.string().trim().min(1),
  governingBody: z.string().trim().min(1),
  standardVersion: z.string().trim().min(1),
  standardSourceUrl: z.string().url(),
  standardEffectiveDate: z.string().trim().min(1),
  standardRegistryKey: z.string().trim().min(1),
  domains: z.array(z.string().trim().min(1)).min(1),
  examRequired: z.boolean(),
  examQuestionCount: z.number().int().positive().optional(),
  passingScore: z.number().int().min(1).max(100).optional(),
});

export const CanonicalCredentialLessonSchema = z.object({
  slug: z.string().trim().min(1),
  title: z.string().trim().min(1),
  domainKey: z.string().trim().min(1),
  objectives: z.array(z.string().trim().min(1)).min(1),
  competencyKeys: z.array(z.string().trim().min(1)).min(1),
  experience: CourseExperienceSchema,
  intelligence: LearningIntelligenceSchema,
  media: z.object({
    storyboardRequired: z.literal(true),
    licensedWorkspaceRequired: z.literal(true),
    provenanceRequired: z.literal(true),
    professionalNarrationRequired: z.literal(true),
    narrationProviderEvidenceRequired: z.literal(true),
    captionsRequired: z.literal(true),
    transcriptRequired: z.literal(true),
    noLoopingNarration: z.literal(true),
    noRepeatedFillerVisuals: z.literal(true),
    narrationVisualAlignmentRequired: z.literal(true),
  }),
  learnerExperience: z.object({
    demonstrationRequired: z.literal(true),
    exerciseRequired: z.literal(true),
    scenarioRequired: z.literal(true),
    caseStudyRequired: z.literal(true),
    practicalRequired: z.literal(true),
    knowledgeChecksRequired: z.literal(true),
    remediationRequired: z.literal(true),
    progressTrackingRequired: z.literal(true),
    resumeTrackingRequired: z.literal(true),
  }),
});

export const CanonicalCredentialCourseContractSchema = z.object({
  identity: z.object({
    courseId: z.string().uuid().optional(),
    programId: z.string().uuid(),
    slug: z.string().trim().min(1),
    title: z.string().trim().min(1),
  }),
  credential: CredentialAuthoritySchema,
  workforce: WorkforceEvidenceSchema,
  lessons: z.array(CanonicalCredentialLessonSchema).min(1),
  assessment: z.object({
    moduleAssessmentsRequired: z.literal(true),
    practiceExamRequired: z.literal(true),
    rationalesRequired: z.literal(true),
    objectiveMappingRequired: z.literal(true),
  }),
  accessibility: z.object({
    captions: z.literal(true),
    transcripts: z.literal(true),
    keyboardReady: z.literal(true),
    altText: z.literal(true),
  }),
  publication: z.object({
    requiredGates: z.array(z.enum(REQUIRED_COURSE_GATES)).length(REQUIRED_COURSE_GATES.length),
    requirements: z.array(z.enum(publicationRequirements)).length(publicationRequirements.length),
    learnerPreviewRequired: z.literal(true),
    canonicalPersistenceRequired: z.literal(true),
    lmsVerificationRequired: z.literal(true),
  }),
}).strict();

export type CanonicalCredentialCourseContract = z.infer<typeof CanonicalCredentialCourseContractSchema>;
export function validateCanonicalCredentialCourseContract(input: unknown) {
  return CanonicalCredentialCourseContractSchema.safeParse(input);
}
