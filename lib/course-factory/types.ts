/**
 * types.ts
 * Unified type definitions for the Course Factory.
 */
import type { SupabaseClient } from '@/lib/supabase';
export type { BlueprintLessonRef, BlueprintModule, BlueprintQuizQuestion, CredentialBlueprint } from '@/lib/curriculum/blueprints/types';
export type BuildMode = 'replace' | 'missing-only';
export type VideoMode = 'queue' | 'off';
export type ContentSource = 'ai' | 'blueprint' | 'curriculum_lessons';
export type PublishStatus = 'draft' | 'published' | 'archived';
export type LessonType = 'lesson' | 'checkpoint' | 'quiz' | 'exam' | 'lab' | 'assignment';
export interface FactoryInput {
  programId?: string;
  programSlug?: string;
  blueprint?: CredentialBlueprint;
  mode?: BuildMode;
  contentSource?: ContentSource;
  videoMode?: VideoMode;
  videoQueueLimit?: number | null;
}
export interface FactoryOutput {
  ok: boolean;
  courseId?: string;
  courseSlug?: string;
  title?: string;
  moduleCount?: number;
  lessonCount?: number;
  skippedCount?: number;
  warnings?: string[];
  errors?: string[];
  status?: FactoryStatus;
}
export type FactoryStatus = 'success' | 'not_found' | 'no_blueprint' | 'incomplete' | 'db_error';
export type FactoryStage = 'init' | 'resolve' | 'blueprint' | 'enrich' | 'validate' | 'publish' | 'complete' | 'error';
export type ProgressCallback = (stage: FactoryStage, message: string, progress?: number) => void;
export interface ValidationError {
  type: 'error' | 'warning';
  module?: string;
  lesson?: string;
  field: string;
  message: string;
}
export interface ValidationResult {
  ok: boolean;
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  errorCount: number;
  warningCount: number;
}
export interface KnowledgeCheck {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank';
  question: string;
  options?: string[];
  correctAnswer: number | string;
  explanation: string;
  points: number;
}
export interface InteractiveScenario {
  id: string;
  title: string;
  question: string;
  options: { id: string; text: string; isCorrect: boolean; feedback: string }[];
  competencies: string[];
}
export interface Flashcard {
  id: string;
  front: string;
  back: string;
  tags: string[];
}
export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}
