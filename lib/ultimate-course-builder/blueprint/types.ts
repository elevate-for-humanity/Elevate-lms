export type AuthorMode = 'AUTOPILOT' | 'GUIDED' | 'LOCKED';

export interface CourseBlueprintInput {
  topic: string;
  audience: string;
  experienceLevel?: string;
  desiredOutcomes: string[];
  programSlug?: string;
  credentialSlug?: string;
  desiredDurationMinutes?: number;
  deliveryMode?: string;
  sourceDocuments?: Array<{ id: string; classification: string }>;
  existingCourseId?: string;
  desiredMediaLevel?: string;
  assessmentRequirements?: unknown;
  accessibilityRequirements?: unknown;
  authorMode: AuthorMode;
}

export interface LessonBlueprint {
  lessonId: string;
  title: string;
  purpose: string;
  learningObjectives: string[];
  standardsMappings: string[];
  competencyMappings: string[];
  prerequisiteKnowledge: string[];
  keyConcepts: string[];
  misconceptions: string[];
  instructionalSequence: string[];
  plannedInteractions: string[];
  plannedMedia: string[];
  assessmentTargets: string[];
  practicalEvidenceTargets: string[];
  estimatedMinutes: number;
}

export interface CourseBlueprint {
  blueprintId: string;
  version: number;
  courseTitle: string;
  courseDescription: string;
  audience: string;
  prerequisites: string[];
  courseOutcomes: string[];
  standards: string[];
  competencies: string[];
  modules: Array<{ moduleId: string; title: string; lessonIds: string[] }>;
  lessons: LessonBlueprint[];
  estimatedDuration: number;
  assessmentPlan: unknown;
  mediaPlan: unknown;
  interactionPlan: unknown;
  remediationPlan: unknown;
  accessibilityPlan: unknown;
  practicalEvidencePlan: unknown;
}
