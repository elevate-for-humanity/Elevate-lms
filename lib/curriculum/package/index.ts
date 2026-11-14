/**
 * lib/curriculum/package/index.ts
 * 
 * Layer 2: Curriculum Package Generator
 * 
 * Complete approval package generation extending Layer 1 course generation.
 * 
 * Architecture:
 *   Layer 1: Course Generation (lib/ai/course-generator.ts) - Creates lesson content
 *   Layer 2: Curriculum Package (this module) - Creates approval documents
 *   Layer 3: Validation (validator.ts) - Validates for approval readiness
 * 
 * Usage:
 *   import { generateCurriculumPackage, validateCurriculumPackage } from '@/lib/curriculum/package';
 */

export * from './types';
export * from './generator';
export * from './validator';
