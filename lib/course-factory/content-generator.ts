/**
 * Unified AI content generation for the canonical Course Factory.
 *
 * Lesson generation emits the same structured content contract consumed by
 * course_lessons, the LMS transformer, and the atomic publication RPC.
 */

import { aiChat, isAIAvailable } from '@/lib/ai/ai-service';
import { logger } from '@/lib/logger';
import type { BlueprintLessonRef, QuizQuestion } from './types';

export interface GeneratedLessonContent {
  objective: string;
  content: string;
  learning_points: string[];
  scenario: string;
  quiz_questions: QuizQuestion[];
}

interface LessonGenerationInput {
  lesson: BlueprintLessonRef;
  moduleTitle: string;
  courseTitle: string;
  state?: string;
  standardsBlock?: string;
}

export async function generateLessonContent(
  input: LessonGenerationInput,
): Promise<GeneratedLessonContent> {
  if (!isAIAvailable()) throw new Error('AI service not available');

  const prompt = `
Generate a complete workforce-training lesson for:
- Lesson: ${input.lesson.title}
- Module: ${input.moduleTitle}
- Course: ${input.courseTitle}
${input.state ? `- State: ${input.state}` : ''}
${input.standardsBlock ? `\nIndustry Standards:\n${input.standardsBlock}` : ''}

Return ONLY valid JSON with exactly this shape:
{
  "objective": "One measurable learning objective using an action verb",
  "learning_points": [
    "3 to 5 substantive learning points, each at least one complete sentence"
  ],
  "scenario": "A realistic workplace or business scenario of at least 80 words that applies the lesson",
  "content": "HTML formatted instructional lesson content of at least 500 words, with headings, examples, application steps, and a short recap",
  "quiz_questions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Why this answer is correct"
    }
  ]
}

The content must be original, job-ready, factually grounded, and aligned to the lesson title and course objective.
`.trim();

  try {
    const response = await aiChat({
      model: 'gpt-4.1',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert instructional designer. Create original, job-ready training aligned to industry standards. Return ONLY valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      maxTokens: 5000,
    });

    const raw = response.content?.replace(/```json\n?|```\n?/g, '').trim();
    const parsed = JSON.parse(raw || '{}') as Partial<GeneratedLessonContent>;

    const objective = String(parsed.objective || '').trim();
    const html = String(parsed.content || '').trim();
    const scenario = String(parsed.scenario || '').trim();
    const learningPoints = Array.isArray(parsed.learning_points)
      ? parsed.learning_points.map((point) => String(point).trim()).filter(Boolean)
      : [];
    const quizQuestions = Array.isArray(parsed.quiz_questions)
      ? parsed.quiz_questions
      : [];

    if (!objective || !html || html.length < 500) {
      throw new Error('Generated lesson is missing required objective or substantive content');
    }
    if (learningPoints.length < 3) {
      throw new Error('Generated lesson must contain at least three learning points');
    }
    if (scenario.length < 80) {
      throw new Error('Generated lesson must contain a substantive application scenario');
    }
    if (quizQuestions.length < 1) {
      throw new Error('Generated lesson must contain at least one knowledge-check question');
    }

    return {
      objective,
      content: JSON.stringify({
        html,
        learning_points: learningPoints,
        scenario,
      }),
      learning_points: learningPoints,
      scenario,
      quiz_questions: quizQuestions,
    };
  } catch (error) {
    logger.error('[course-factory/content-generator] Lesson generation failed', error);
    throw error;
  }
}

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

export async function generateAssessment(
  input: AssessmentGenerationInput,
): Promise<GeneratedAssessment> {
  if (!isAIAvailable()) throw new Error('AI service not available');

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
          content:
            'You are an expert in creating assessments for workforce training. Create job-relevant questions that test practical knowledge. Return ONLY valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      maxTokens: 3000,
    });

    const content = response.content?.replace(/```json\n?|```\n?/g, '').trim();
    const parsed = JSON.parse(content || '{}');
    return { questions: parsed.questions || [] };
  } catch (error) {
    logger.error('[course-factory/content-generator] Assessment generation failed', error);
    throw error;
  }
}

export async function generateFinalExam(
  courseTitle: string,
  moduleCount: number,
  questionCount: number = 25,
): Promise<GeneratedAssessment> {
  if (!isAIAvailable()) throw new Error('AI service not available');

  const prompt = `
Generate a ${questionCount}-question final exam for: "${courseTitle}"

This course has ${moduleCount} modules. Cover the complete course proportionally and test knowledge recall, application, and scenario-based reasoning.

Return JSON with exactly ${questionCount} questions:
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

Return ONLY valid JSON.
`.trim();

  try {
    const response = await aiChat({
      model: 'gpt-4.1',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert assessment writer. Create comprehensive final exams that test full course competency. Return ONLY valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      maxTokens: 5000,
    });

    const content = response.content?.replace(/```json\n?|```\n?/g, '').trim();
    const parsed = JSON.parse(content || '{}');
    const questions = Array.isArray(parsed.questions) ? parsed.questions : [];
    if (questions.length < questionCount) {
      throw new Error(
        `Final exam generation returned ${questions.length}/${questionCount} required questions`,
      );
    }
    return { questions: questions.slice(0, questionCount) };
  } catch (error) {
    logger.error('[course-factory/content-generator] Final exam generation failed', error);
    throw error;
  }
}

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
  if (!isAIAvailable()) throw new Error('AI service not available');

  const modules = input.moduleCount ?? 6;
  const lessonsPerModule = input.lessonsPerModule ?? 5;
  const prompt = `
Create a workforce training course blueprint.

Title: ${input.title}
Topic: ${input.topic}
Audience: ${input.audience}
${input.state ? `State: ${input.state}` : ''}
${input.credential ? `Credential: ${input.credential}` : ''}

Requirements:
- Exactly ${modules} modules
- Approximately ${lessonsPerModule} learner-facing steps per module
- Include module checkpoints and a final exam where appropriate
- Use unique lowercase kebab-case slugs
- Include practical or assignment steps when the topic requires applied competency

Return ONLY valid JSON:
{
  "title": "Course title",
  "description": "Course description",
  "modules": [
    {
      "title": "Module title",
      "description": "Module description",
      "lessons": [
        { "title": "Lesson title", "slug": "lesson-slug", "stepType": "lesson" }
      ]
    }
  ]
}
`.trim();

  try {
    const response = await aiChat({
      model: 'gpt-4.1',
      messages: [
        {
          role: 'system',
          content:
            'You design complete workforce-training course structures. Return ONLY valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
      maxTokens: 5000,
    });

    const content = response.content?.replace(/```json\n?|```\n?/g, '').trim();
    const parsed = JSON.parse(content || '{}');
    if (!Array.isArray(parsed.modules) || parsed.modules.length === 0) {
      throw new Error('AI blueprint generation returned no modules');
    }
    return parsed;
  } catch (error) {
    logger.error('[course-factory/content-generator] Blueprint generation failed', error);
    throw error;
  }
}

export interface CompetencyMapping {
  lessonSlug: string;
  competencies: string[];
  standards: string[];
}

export async function generateCompetencyMapping(
  lessonTitle: string,
  moduleTitle: string,
  content: string,
): Promise<CompetencyMapping> {
  if (!isAIAvailable()) throw new Error('AI service not available');

  const prompt = `
Analyze this lesson and identify relevant workforce competencies and standards.

Lesson: ${lessonTitle}
Module: ${moduleTitle}
Content summary: ${content.substring(0, 500)}...

Return ONLY valid JSON:
{
  "lessonSlug": "${lessonTitle.toLowerCase().replace(/\s+/g, '-')}",
  "competencies": ["competency identifier or statement"],
  "standards": ["applicable industry or credential standard"]
}

Only map standards that are genuinely applicable to the lesson.
`.trim();

  try {
    const response = await aiChat({
      model: 'gpt-4.1',
      messages: [
        {
          role: 'system',
          content:
            'You map workforce lessons to relevant competency frameworks and credential standards. Return ONLY valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      maxTokens: 1000,
    });

    const raw = response.content?.replace(/```json\n?|```\n?/g, '').trim();
    const parsed = JSON.parse(raw || '{}') as Partial<CompetencyMapping>;
    return {
      lessonSlug:
        String(parsed.lessonSlug || '').trim() ||
        lessonTitle.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      competencies: Array.isArray(parsed.competencies)
        ? parsed.competencies.map((value) => String(value).trim()).filter(Boolean)
        : [],
      standards: Array.isArray(parsed.standards)
        ? parsed.standards.map((value) => String(value).trim()).filter(Boolean)
        : [],
    };
  } catch (error) {
    logger.error('[course-factory/content-generator] Competency mapping failed', error);
    return {
      lessonSlug: lessonTitle
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, ''),
      competencies: [],
      standards: [],
    };
  }
}
