/**
 * content-generator.ts
 * 
 * Unified AI content generation:
 * - Lesson content
 * - Assessment questions
 * - Industry standards
 * 
 * Consolidates:
 * - lib/course-builder/lesson-content-generator.ts
 * - lib/course-builder/assessment-generator.ts
 * - lib/ai/prompts/course-blueprint.ts
 */

import { aiChat, isAIAvailable } from '@/lib/ai/ai-service';
import { logger } from '@/lib/logger';
import type { BlueprintLessonRef, QuizQuestion } from './types';

// ─── Lesson Content Generation ─────────────────────────────────────────────────

export interface GeneratedLessonContent {
  objective: string;
  content: string;
  quiz_questions: QuizQuestion[];
}

interface LessonGenerationInput {
  lesson: BlueprintLessonRef;
  moduleTitle: string;
  courseTitle: string;
  state?: string;
  standardsBlock?: string;
}

/**
 * Generate lesson content via AI.
 * Includes objective, HTML content, and quiz questions.
 */
export async function generateLessonContent(
  input: LessonGenerationInput,
): Promise<GeneratedLessonContent> {
  if (!isAIAvailable()) {
    throw new Error('AI service not available');
  }

  const prompt = `
Generate lesson content for:
- Lesson: ${input.lesson.title}
- Module: ${input.moduleTitle}
- Course: ${input.courseTitle}
${input.state ? `- State: ${input.state}` : ''}
${input.standardsBlock ? `\nIndustry Standards:\n${input.standardsBlock}` : ''}

Return JSON with:
{
  "objective": "Clear learning objective using action verbs",
  "content": "HTML formatted lesson content (minimum 500 words)",
  "quiz_questions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Why this answer is correct"
    }
  ]
}

Make content job-ready and aligned to industry standards.
Return ONLY valid JSON.
`.trim();

  try {
    const response = await aiChat({
      model: 'gpt-4.1',
      messages: [
        {
          role: 'system',
          content: 'You are an expert instructional designer. Create job-ready training content aligned to industry standards. Return ONLY valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      maxTokens: 4000,
    });

    const content = response.content?.replace(/```json\n?|```\n?/g, '').trim();
    return JSON.parse(content || '{}');
  } catch (err) {
    logger.error('[content-generator] Lesson generation failed', err);
    throw err;
  }
}

// ─── Assessment Generation ─────────────────────────────────────────────────────

export interface AssessmentGenerationInput {
  lessonSlug: string;
  lessonTitle: string;
  moduleTitle: string;
  courseTitle: string;
  questionCount?: number;
  questionTypes?: ('multiple_choice' | 'true_false' | 'scenario')[];
}

interface GeneratedAssessment {
  questions: QuizQuestion[];
}

/**
 * Generate assessment questions for a lesson/quiz.
 */
export async function generateAssessment(
  input: AssessmentGenerationInput,
): Promise<GeneratedAssessment> {
  if (!isAIAvailable()) {
    throw new Error('AI service not available');
  }

  const count = input.questionCount ?? 10;
  const types = input.questionTypes ?? ['multiple_choice'];

  const prompt = `
Generate ${count} assessment questions for:
- Lesson: ${input.lessonTitle}
- Module: ${input.moduleTitle}
- Course: ${input.courseTitle}

Question types: ${types.join(', ')}

Return JSON with:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Why this answer is correct"
    }
  ]
}

Make questions job-relevant and aligned to the lesson content.
Return ONLY valid JSON.
`.trim();

  try {
    const response = await aiChat({
      model: 'gpt-4.1',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in creating assessments for workforce training. Create job-relevant questions that test practical knowledge. Return ONLY valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      maxTokens: 3000,
    });

    const content = response.content?.replace(/```json\n?|```\n?/g, '').trim();
    const parsed = JSON.parse(content || '{}');
    return { questions: parsed.questions || [] };
  } catch (err) {
    logger.error('[content-generator] Assessment generation failed', err);
    throw err;
  }
}

/**
 * Generate a final exam for a course.
 */
export async function generateFinalExam(
  courseTitle: string,
  moduleCount: number,
  questionCount: number = 25,
): Promise<GeneratedAssessment> {
  if (!isAIAvailable()) {
    throw new Error('AI service not available');
  }

  const prompt = `
Generate a ${questionCount}-question final exam for: "${courseTitle}"

This course has ${moduleCount} modules covering:
- Core concepts and theory
- Practical applications
- Safety and compliance
- Industry regulations
- Hands-on skills

Return JSON with ${questionCount} comprehensive exam questions:
{
  "questions": [
    {
      "question": "Exam question text",
      "options": ["A", "B", "C", "D"],
      "correct": 0,
      "explanation": "Correct answer explanation"
    }
  ]
}

Mix question types: knowledge recall, application, and scenario-based.
Return ONLY valid JSON.
`.trim();

  try {
    const response = await aiChat({
      model: 'gpt-4.1',
      messages: [
        {
          role: 'system',
          content: 'You are an expert assessment writer. Create comprehensive final exams that test full course competency. Return ONLY valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      maxTokens: 5000,
    });

    const content = response.content?.replace(/```json\n?|```\n?/g, '').trim();
    const parsed = JSON.parse(content || '{}');
    return { questions: parsed.questions || [] };
  } catch (err) {
    logger.error('[content-generator] Final exam generation failed', err);
    throw err;
  }
}

// ─── Blueprint Generation (AI) ─────────────────────────────────────────────────

export interface BlueprintGenerationInput {
  title: string;
  topic: string;
  audience: string;
  hours?: number;
  state?: string;
  credential?: string;
  moduleCount?: number;
  lessonsPerModule?: number;
}

/**
 * Generate a course blueprint via AI when no static blueprint exists.
 */
export async function generateBlueprintFromAI(
  input: BlueprintGenerationInput,
): Promise<{
  title: string;
  description: string;
  modules: Array<{
    title: string;
    description: string;
    lessons: Array<{ title: string; slug: string; stepType: string }>;
  }>;
}> {
  if (!isAIAvailable()) {
    throw new Error('AI service not available');
  }

  const modules = input.moduleCount ?? 6;
  const lessons = input.lessonsPerModule ?? 5;

  const prompt = `
Generate a comprehensive course blueprint for: "${input.title}"

Details:
- Target audience: ${input.audience}
${input.hours ? `- Training hours: ${input.hours}` : ''}
${input.state ? `- State alignment: ${input.state}` : ''}
${input.credential ? `- Credential/exam: ${input.credential}` : ''}

Requirements:
- ${modules} modules with ${lessons} lessons each
- Include checkpoints after modules 2 and 3
- Include a final exam

Return JSON:
{
  "title": "Course Title",
  "description": "Course description",
  "modules": [
    {
      "title": "Module Title",
      "description": "Module description",
      "lessons": [
        { "title": "Lesson Title", "slug": "lesson-slug", "stepType": "lesson" }
      ]
    }
  ]
}

Return ONLY valid JSON.
`.trim();

  try {
    const response = await aiChat({
      model: 'gpt-4.1',
      messages: [
        {
          role: 'system',
          content: 'You are an expert instructional designer. Create comprehensive, industry-aligned course blueprints. Return ONLY valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      maxTokens: 4000,
    });

    const content = response.content?.replace(/```json\n?|```\n?/g, '').trim();
    return JSON.parse(content || '{}');
  } catch (err) {
    logger.error('[content-generator] Blueprint generation failed', err);
    throw err;
  }
}

// ─── Competency Mapping ────────────────────────────────────────────────────────

export interface CompetencyMapping {
  lessonSlug: string;
  competencies: string[];
  standards: string[];
}

/**
 * Generate competency mappings for a lesson.
 */
export async function generateCompetencyMapping(
  lessonTitle: string,
  moduleTitle: string,
  content: string,
): Promise<CompetencyMapping> {
  if (!isAIAvailable()) {
    throw new Error('AI service not available');
  }

  const prompt = `
Analyze this lesson and identify relevant competencies:

Lesson: ${lessonTitle}
Module: ${moduleTitle}

Content summary: ${content.substring(0, 500)}...

Return JSON:
{
  "lessonSlug": "${lessonTitle.toLowerCase().replace(/\s+/g, '-')}",
  "competencies": ["COMPTIA.1", "NIST.2"],
  "standards": ["OSHA.1910", "EPA.608"]
}

Map to industry standards (NATE, ESCO, HVAC Excellence, state boards, etc.)
Return ONLY valid JSON.
`.trim();

  try {
    const response = await aiChat({
      model: 'gpt-4.1',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in workforce competency frameworks. Map lessons to industry certifications and standards. Return ONLY valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      maxTokens: 1000,
    });

    const content = response.content?.replace(/```json\n?|```\n?/g, '').trim();
    return JSON.parse(content || '{}');
  } catch (err) {
    logger.error('[content-generator] Competency mapping failed', err);
    // Return empty mapping rather than failing
    return {
      lessonSlug: lessonTitle.toLowerCase().replace(/\s+/g, '-'),
      competencies: [],
      standards: [],
    };
  }
}
