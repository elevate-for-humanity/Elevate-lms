/**
 * Credential Intelligence Engine
 * 
 * Main orchestrator that ties together:
 * - Course type detection
 * - Credential registry
 * - Exam blueprints
 * - Prompt selection
 * - RAG context
 * - Quality validation
 * - Course generation
 * 
 * This is the "brain" of the Course Builder.
 */

// Re-export everything for easy importing

// Import types for internal use
import type {
  CourseType,
  GenerationMode,
} from './course-types';
import { detectCourseType, COURSE_TYPES } from './course-types';
import type { CredentialBlueprint } from './credential-registry';
import type { ExamBlueprint } from './exam-blueprints';
import { getBlueprint, topicToPrompt } from './exam-blueprints';
import type { RagContext } from './rag-engine';
import { loadRagContext } from './rag-engine';
import type { ContentPrompts } from './prompt-selector';
import { getPrompts, getContentSystemPrompt, getInstructorSystemPrompt } from './prompt-selector';
import { buildRagPromptContext } from './rag-engine';
import type { ValidationResult } from './quality-validator';
import { getCredential, searchCredentials, type CredentialDefinition } from './credential-registry-universal';
import { validateCourse, generateQualityReport } from './quality-validator';
import { CREDENTIAL_REGISTRY } from './credential-registry';

export {
  // Course types
  detectCourseType,
  COURSE_TYPES,
  type CourseType,
  type GenerationMode,
} from './course-types';

export {
  // Universal credential registry
  UNIVERSAL_CREDENTIAL_REGISTRY,
  getCredential,
  getAvailableCredentials,
  searchCredentials,
  getCredentialsByCategory,
  getCredentialsByType,
  type CredentialDefinition,
  type CredentialCategory,
  type CredentialType,
} from './credential-registry-universal';

export {
  // Legacy EPA 608 specific registry
  CREDENTIAL_REGISTRY,
  type CredentialBlueprint,
} from './credential-registry';

export {
  // Exam blueprints
  getBlueprint,
  type ExamBlueprint,
  topicToPrompt,
} from './exam-blueprints';

export {
  // Prompt selector
  getPrompts,
  getContentSystemPrompt,
  getInstructorSystemPrompt,
  type ContentPrompts,
} from './prompt-selector';

export {
  // RAG engine
  loadRagContext,
  enhanceWithRag,
  buildRagPromptContext,
  type RagContext,
} from './rag-engine';

export {
  // Quality validator
  validateCourse,
  generateQualityReport,
  type ValidationResult,
  type QualityScore,
} from './quality-validator';

export {
  // Universal platform
  initializeCourseBuild,
  monitorCredentialBlueprints,
  type CourseBuild,
  type ModuleBuild,
  type LessonBuild,
  type ExamBuild,
  type InstructorBuild,
  type MediaBuild,
  type LabBuild,
  type ComplianceBuild,
} from './universal-platform';

export {
  // Config-based credential loader
  loadCredentialConfigs,
  getCredentialFromConfig,
  searchCredentialsInConfig,
  getCredentialsByCategoryInConfig,
  CREDENTIAL_TEMPLATE,
  type CredentialConfig,
  type ExamSectionConfig,
  type BlueprintConfig,
} from './registry-loader';

export {
  // Blueprint monitoring
  monitorAllBlueprints,
  monitorCredential,
  recommendUpdates,
  type BlueprintChange,
  type BlueprintStatus,
  type MonitorResult,
} from './blueprint-monitor';

export interface CourseGenerationRequest {
  // What the user requested
  userRequest: string;
  
  // Identified type and credential
  courseType?: CourseType;
  credentialSlug?: string;
  
  // Course metadata
  title?: string;
  description?: string;
  programSlug?: string;
}

export interface CourseGenerationContext {
  // Identified configuration
  courseType: CourseType;
  generationMode: GenerationMode;
  credential?: CredentialDefinition;
  blueprint?: ExamBlueprint;
  ragContext: RagContext;
  
  // Generation settings
  prompts: ContentPrompts;
  systemPrompt: string;
  instructorPrompt: string;
  
  // Blueprint context for prompts
  blueprintPrompt: string;
  criticalNumbersPrompt: string;
}

export interface GenerationResult {
  success: boolean;
  modules: GeneratedModule[];
  qualityReport: ValidationResult;
  errors?: string[];
}

export interface GeneratedModule {
  id: string;
  title: string;
  examDomain: string;
  content: string;
  quizQuestions: QuizQuestion[];
  flashcards: Flashcard[];
  procedures?: Procedure[];
  hasPracticeExam?: boolean;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  rationale: string;
  topic: string;
}

export interface Flashcard {
  term: string;
  definition: string;
}

export interface Procedure {
  step: number;
  instruction: string;
  safetyNote?: string;
}

/**
 * Main entry point: Analyze request and build generation context
 */
export function buildGenerationContext(request: CourseGenerationRequest): CourseGenerationContext {
  // Step 1: Detect course type
  const courseType = request.courseType || detectCourseType(request.userRequest);
  const generationMode = COURSE_TYPES[courseType].generationMode;
  
  // Step 2: Find credential
  let credential: CredentialDefinition | undefined;
  let blueprint: ExamBlueprint | undefined;
  
  if (request.credentialSlug) {
    credential = getCredential(request.credentialSlug);
  } else {
    // Search for matching credential
    const matches = searchCredentials(request.userRequest);
    credential = matches[0];
  }
  
  // Step 3: Load blueprint if credential found
  if (credential) {
    blueprint = getBlueprint(credential.slug);
  }
  
  // Step 4: Load RAG context
  const ragContext = credential 
    ? loadRagContext(credential.slug) 
    : { documents: [], vocabulary: [], criticalNumbers: {}, examTopics: [] };
  
  // Step 5: Get prompts
  const prompts = getPrompts({ courseType, credential, blueprint, generationMode });
  const systemPrompt = getContentSystemPrompt({ courseType, credential, blueprint, generationMode });
  const instructorPrompt = getInstructorSystemPrompt({ courseType, credential, blueprint, generationMode });
  
  // Step 6: Build blueprint prompt for LLM
  let blueprintPrompt = '';
  let criticalNumbersPrompt = '';
  
  if (blueprint) {
    blueprintPrompt = topicToPrompt(blueprint);
    criticalNumbersPrompt = Object.entries(blueprint.criticalNumbers)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
  }
  
  return {
    courseType,
    generationMode,
    credential,
    blueprint,
    ragContext,
    prompts,
    systemPrompt,
    instructorPrompt,
    blueprintPrompt,
    criticalNumbersPrompt,
  };
}

/**
 * Build lesson generation prompt with RAG context
 */
export function buildLessonPrompt(
  context: CourseGenerationContext,
  lessonTitle: string,
  examDomain?: string
): string {
  let prompt = context.systemPrompt + '\n\n';
  
  // Add RAG context
  prompt += buildRagPromptContext(context.ragContext) + '\n\n';
  
  // Add blueprint-specific content
  prompt += `## LESSON TO GENERATE\n`;
  prompt += `Title: ${lessonTitle}\n`;
  
  if (examDomain) {
    prompt += `Exam Domain: ${examDomain}\n`;
    const domainTopics = context.blueprint?.topics.filter(t => t.section === examDomain) || [];
    if (domainTopics.length > 0) {
      prompt += `\nThis lesson covers these exam topics:\n`;
      for (const topic of domainTopics) {
        prompt += `- ${topic.title}: ${topic.content}\n`;
      }
    }
  }
  
  prompt += '\n' + context.prompts.lesson;
  
  return prompt;
}

/**
 * Build quiz generation prompt with RAG context
 */
export function buildQuizPrompt(
  context: CourseGenerationContext,
  lessonTitle: string,
  examDomain: string,
  questionCount = 20
): string {
  let prompt = context.systemPrompt + '\n\n';
  
  // Add RAG context filtered to domain
  const domainDocs = context.ragContext.documents.filter(
    d => d.id.includes(examDomain.toLowerCase().replace(' ', '-'))
  );
  
  if (domainDocs.length > 0) {
    prompt += '\n## REFERENCE KNOWLEDGE\n';
    prompt += 'Use this to generate exam-accurate questions:\n\n';
    
    for (const doc of domainDocs) {
      prompt += `**${doc.title}**\n${doc.content}\n`;
    }
  }
  
  // Add critical numbers
  if (context.criticalNumbersPrompt) {
    prompt += '\n### CRITICAL NUMBERS\n';
    prompt += context.criticalNumbersPrompt + '\n';
  }
  
  prompt += '\n## QUIZ GENERATION\n';
  prompt += `Lesson: ${lessonTitle}\n`;
  prompt += `Exam Domain: ${examDomain}\n`;
  prompt += `Generate: ${questionCount} questions\n\n`;
  
  prompt += context.prompts.quiz;
  
  return prompt;
}

/**
 * Build flashcard generation prompt
 */
export function buildFlashcardPrompt(
  context: CourseGenerationContext,
  lessonTitle: string
): string {
  let prompt = context.systemPrompt + '\n\n';
  
  // Add vocabulary
  if (context.ragContext.vocabulary.length > 0) {
    prompt += '\n## KEY VOCABULARY\n';
    prompt += context.ragContext.vocabulary.join('\n') + '\n';
  }
  
  // Add critical numbers
  if (context.criticalNumbersPrompt) {
    prompt += '\n### CRITICAL NUMBERS\n';
    prompt += context.criticalNumbersPrompt + '\n';
  }
  
  prompt += '\n## FLASHCARD GENERATION\n';
  prompt += `Lesson: ${lessonTitle}\n\n`;
  
  prompt += context.prompts.flashcard;
  
  return prompt;
}

/**
 * Build practice exam prompt
 */
export function buildPracticeExamPrompt(
  context: CourseGenerationContext
): string {
  let prompt = context.systemPrompt + '\n\n';
  
  // Add full blueprint context
  prompt += buildRagPromptContext(context.ragContext, 20);
  
  prompt += '\n## PRACTICE EXAM GENERATION\n';
  
  if (context.credential) {
    prompt += `Credential: ${context.credential.name}\n`;
    prompt += `Format: ${context.credential.examFormat}\n`;
    prompt += `Sections: ${context.credential.examSections.map(s => `${s.name}: ${s.questions} questions`).join(', ')}\n\n`;
  }
  
  prompt += context.prompts.practiceExam || 'Generate a full practice exam.';
  
  return prompt;
}

/**
 * Validate generated course
 */
export function validateGeneratedCourse(
  modules: GeneratedModule[],
  context: CourseGenerationContext
): ValidationResult {
  if (!context.blueprint || !context.credential) {
    return {
      passed: true,
      scores: {
        overall: 100,
        blueprintCoverage: 100,
        competencyAlignment: 100,
        examReadiness: 100,
        handsOnCoverage: 100,
        accessibility: 100,
        instructionalDesign: 100,
      },
      issues: [],
      recommendations: [],
    };
  }
  
  return validateCourse(modules as any, context.blueprint, context.credential as any);
}

/**
 * Generate quality report for result
 */
export function generateReport(result: ValidationResult): string {
  return generateQualityReport(result);
}

/**
 * Get all supported credentials
 */
export function getSupportedCredentials(): CredentialDefinition[] {
  return Object.values(CREDENTIAL_REGISTRY) as CredentialDefinition[];
}

/**
 * Search for credentials
 */
export function searchForCredentials(query: string): CredentialDefinition[] {
  return searchCredentials(query);
}

/**
 * Get credential by slug
 */
export function getCredentialInfo(slug: string): CredentialDefinition | undefined {
  return getCredential(slug);
}
