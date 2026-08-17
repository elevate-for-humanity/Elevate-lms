/**
 * Unified AI content generation for the canonical Course Factory.
 *
 * Lesson generation emits the same structured content contract consumed by
 * course_lessons, the LMS transformer, and the atomic publication RPC.
 */

import { aiChat, isAIAvailable } from '@/lib/ai/ai-service';
import { logger } from '@/lib/logger';
import {
  competencyMappingSchema,
  generatedAssessmentSchema,
  generatedBlueprintSchema,
  generatedLessonContentSchema,
  parseStrictAIJson,
} from './ai-contracts';
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

function groundedLessonFallback(input: LessonGenerationInput): GeneratedLessonContent {
  const objectives = input.lesson.learningObjectives?.filter(Boolean) ?? [];
  const focus = objectives.length ? objectives : [`Apply ${input.lesson.title} to a realistic small-business decision.`];
  const domainGuidance: Record<string, string> = {
    entrepreneurial_small_business_concepts: 'Validate the customer problem, document assumptions, compare ownership and planning choices, and protect the venture from avoidable legal or intellectual-property risk.',
    marketing_sales: 'Use customer evidence, positioning, channel economics, sales data, and retention behavior to make a measurable go-to-market decision.',
    production_distribution: 'Define an MVP, measurable quality criteria, required inputs, regulatory checks, capacity limits, and a reliable fulfillment path before scaling.',
    business_financials: 'Separate revenue from cash, classify costs, test pricing and break-even assumptions, and document the funding need with defensible numbers.',
    capstone_exam_readiness: 'Integrate the venture model, market evidence, operations, financial assumptions, risks, and launch priorities into one defensible business decision.',
  };
  const guidance = domainGuidance[input.lesson.domainKey ?? ''] ?? 'Use evidence, document assumptions, compare alternatives, and select the option that best supports a sustainable venture.';
  const points = focus.map((objective, index) => `<li><strong>Competency ${index + 1}:</strong> ${objective}</li>`).join('');
  const application = focus.map((objective, index) => `<h3>${index + 1}. ${objective}</h3><p>Start with a real venture decision and identify the facts required to act. Separate verified evidence from assumptions, compare at least two alternatives, calculate or document the effect on the customer and the business, and record the reason for the final choice. A strong response does more than define the concept: it shows how the concept changes an owner’s next action.</p>`).join('');
  const scenario = `You are advising an Indianapolis entrepreneur who must make a decision about ${input.lesson.title.toLowerCase()} before committing limited startup funds. The owner has customer feedback, a small budget, incomplete market information, and a two-week deadline. Review the evidence, identify the assumptions that still require testing, compare realistic alternatives, and recommend one next action. Explain how the recommendation supports the customer, limits business risk, and produces evidence for the next decision.`;
  const html = `<section><h2>${input.lesson.title}</h2><p><strong>Instructor focus:</strong> ${guidance}</p><h3>Learning outcomes</h3><ul>${points}</ul><h3>Instructor walkthrough</h3><p>Angela Thompson begins by connecting this topic to the learner’s own venture. The learner should name the decision, identify who is affected, gather the minimum evidence needed, and state what result would justify proceeding, changing direction, or stopping. Avoid conclusions based only on enthusiasm. Business decisions should connect customer value, operating capacity, financial effect, and risk.</p>${application}<h3>Applied business scenario</h3><p>${scenario}</p><h3>Interactive practice</h3><ol><li>Write the decision in one sentence.</li><li>List three verified facts and three assumptions.</li><li>Compare two options using customer value, cost, feasibility, and risk.</li><li>Select one action and define the evidence you will collect next.</li></ol><h3>Knowledge check and recap</h3><p>Explain your recommendation aloud as if speaking to a lender, mentor, or business partner. A complete explanation names the evidence, acknowledges uncertainty, and connects the choice to a measurable business outcome. Save the response in your venture workbook for instructor review.</p></section>`;
  return {
    objective: focus[0],
    content: JSON.stringify({ html, learning_points: focus, scenario }),
    learning_points: focus,
    scenario,
    quiz_questions: focus.slice(0, 4).map((objective, index) => ({
      question: `Which action best demonstrates competency ${index + 1} for “${input.lesson.title}”?`,
      options: [objective, 'Act before gathering any customer or financial evidence.', 'Choose the option with the lowest price without evaluating value or risk.', 'Copy another business decision without testing whether it fits this venture.'],
      correct: 0,
      explanation: `The correct response directly applies the required competency: ${objective}`,
    })),
  };
}

function groundedAssessmentFallback(input: AssessmentGenerationInput, count: number): GeneratedAssessment {
  const decisions = ['customer evidence', 'cost and financial effect', 'operating feasibility', 'risk and compliance', 'measurable next-step evidence'];
  return {
    questions: Array.from({ length: count }, (_, index) => {
      const decision = decisions[index % decisions.length];
      return {
        question: `${input.moduleTitle}: Before acting on ${input.lessonTitle.toLowerCase()}, what should the owner evaluate first regarding ${decision}?`,
        options: [`Verified ${decision} and its effect on the venture objective`, 'A competitor’s choice without checking whether the facts match', 'Personal preference without supporting evidence', 'The fastest action even when it increases avoidable risk'],
        correct: 0,
        explanation: `A defensible ${input.courseTitle} decision connects verified ${decision} to the venture objective before resources are committed.`,
      };
    }),
  };
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
    // Let the unified AI gateway select the provider's supported default model.
    // Hard-coding an OpenAI model here broke Course Factory when the gateway
    // correctly failed over to Anthropic, Gemini, Groq, or Azure.
    const response = await aiChat({
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

    const parsed = parseStrictAIJson(
      response.content,
      generatedLessonContentSchema,
      'Lesson generation',
    );

    return {
      objective: parsed.objective,
      content: JSON.stringify({
        html: parsed.content,
        learning_points: parsed.learning_points,
        scenario: parsed.scenario,
      }),
      learning_points: parsed.learning_points,
      scenario: parsed.scenario,
      quiz_questions: parsed.quiz_questions,
    };
  } catch (error) {
    logger.error('[course-factory/content-generator] Lesson generation failed', error);
    logger.warn('[course-factory/content-generator] Using the registered blueprint objectives as the governed lesson fallback');
    return groundedLessonFallback(input);
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

    const parsed = parseStrictAIJson(
      response.content,
      generatedAssessmentSchema,
      'Assessment generation',
    );
    if (parsed.questions.length < count) {
      throw new Error(
        `Assessment generation returned ${parsed.questions.length}/${count} required questions`,
      );
    }
    return { questions: parsed.questions.slice(0, count) };
  } catch (error) {
    logger.error('[course-factory/content-generator] Assessment generation failed', error);
    logger.warn('[course-factory/content-generator] Using a governed domain assessment fallback');
    return groundedAssessmentFallback(input, count);
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

    const parsed = parseStrictAIJson(
      response.content,
      generatedAssessmentSchema,
      'Final exam generation',
    );
    if (parsed.questions.length < questionCount) {
      throw new Error(
        `Final exam generation returned ${parsed.questions.length}/${questionCount} required questions`,
      );
    }
    return { questions: parsed.questions.slice(0, questionCount) };
  } catch (error) {
    logger.error('[course-factory/content-generator] Final exam generation failed', error);
    logger.warn('[course-factory/content-generator] Using a governed cumulative assessment fallback');
    return groundedAssessmentFallback({
      lessonSlug: 'final-exam',
      lessonTitle: 'cumulative final exam',
      moduleTitle: `All ${moduleCount} course modules`,
      courseTitle,
      questionCount,
    }, questionCount);
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

    const parsed = parseStrictAIJson(
      response.content,
      generatedBlueprintSchema,
      'Blueprint generation',
    );
    if (parsed.modules.length !== modules) {
      throw new Error(`Blueprint generation returned ${parsed.modules.length}/${modules} required modules`);
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

    return parseStrictAIJson(
      response.content,
      competencyMappingSchema,
      'Competency mapping',
    );
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
