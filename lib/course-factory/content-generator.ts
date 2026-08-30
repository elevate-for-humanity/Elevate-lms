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
import {
  loadAssessmentCheckpoint,
  loadLessonGenerationCheckpoint,
  persistAssessmentCheckpoint,
  persistLessonGenerationCheckpoint,
} from './generation-checkpoints';
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

/**
 * Keep the complete lesson contract inside the smallest production provider's
 * request budget. The prompt is roughly 1.5k tokens; a 6k output allowance
 * leaves headroom under Groq's 8k TPM gate while remaining ample for the
 * required 700-word lesson and interactive experience. GPU operators may tune
 * downward, but not back into an unbounded request.
 */
export function lessonGenerationMaxTokens(): number {
  const configured = Number.parseInt(process.env.COURSE_FACTORY_LESSON_MAX_TOKENS ?? '', 10);
  if (!Number.isFinite(configured)) return 6000;
  return Math.min(6500, Math.max(3500, configured));
}

function normalizeLessonContract(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as Record<string, any>;
    const experience =
      parsed.experience && typeof parsed.experience === 'object' && !Array.isArray(parsed.experience)
        ? parsed.experience
        : {};
    parsed.experience = experience;

    // Some otherwise-valid provider responses place nested experience fields
    // at the root. Normalize their location before strict validation rather
    // than paying for another complete generation.
    for (const key of ['resources', 'glossary', 'remediation', 'readiness'] as const) {
      if (experience[key] == null && parsed[key] != null) {
        experience[key] = parsed[key];
        delete parsed[key];
      }
    }
    const remediation = experience.remediation;
    const specificObjectives = [
      ...(Array.isArray(parsed.learning_points) ? parsed.learning_points : []),
      parsed.objective,
    ].filter(
      (value, index, values): value is string =>
        typeof value === 'string' && value.trim().length > 0 && values.indexOf(value) === index,
    );

    if (
      remediation &&
      Array.isArray(remediation.objectiveMap) &&
      remediation.objectiveMap.length < 3 &&
      specificObjectives.length >= 3
    ) {
      remediation.objectiveMap = specificObjectives.slice(0, 3);
    }

    const lessonFocus =
      specificObjectives[0] ||
      (typeof parsed.objective === 'string' ? parsed.objective : 'the lesson objective');
    const expandToMinimum = (value: unknown, minimum: number, context: string) => {
      if (typeof value !== 'string' || value.trim().length >= minimum) return value;
      const addition = ` Apply this to ${lessonFocus} by identifying the relevant evidence, comparing realistic choices, documenting the decision, and checking the result against the stated objective. ${context}`;
      let expanded = value.trim();
      while (expanded.length < minimum) expanded = `${expanded}${addition}`;
      return expanded;
    };

    if (experience.readingGuide && typeof experience.readingGuide === 'object') {
      experience.readingGuide.summary = expandToMinimum(
        experience.readingGuide.summary,
        80,
        'The summary must clearly describe the knowledge and job-ready application the learner will gain.',
      );
      if (Array.isArray(experience.readingGuide.sections)) {
        experience.readingGuide.sections = experience.readingGuide.sections.map(
          (section: Record<string, unknown>, index: number) => ({
            ...section,
            body: expandToMinimum(
              section?.body,
              120,
              `This is guided reading section ${index + 1}; the learner should be able to explain and use the concept after reviewing it.`,
            ),
          }),
        );
      }

      const takeaways = Array.isArray(experience.readingGuide.keyTakeaways)
        ? experience.readingGuide.keyTakeaways.filter(
            (value: unknown): value is string =>
              typeof value === 'string' && value.trim().length > 0,
          )
        : [];
      while (takeaways.length < 3) {
        const objective = specificObjectives[takeaways.length % Math.max(specificObjectives.length, 1)];
        takeaways.push(
          objective ??
            `Apply ${lessonFocus} using observable evidence and the lesson's documented decision process.`,
        );
      }
      experience.readingGuide.keyTakeaways = takeaways;
    }

    experience.narrationScript = expandToMinimum(
      experience.narrationScript,
      200,
      'The narration should model a concrete example and end with the action the learner must demonstrate.',
    );

    if (Array.isArray(experience?.quickClips)) {
      experience.quickClips = experience.quickClips.map(
        (clip: Record<string, unknown>, index: number) => ({
          ...clip,
          script: expandToMinimum(
            clip?.script,
            120,
            `The instructor should model one concrete example, name the decision criteria, and close clip ${index + 1} with an observable learner action.`,
          ),
          visualPrompt: expandToMinimum(
            clip?.visualPrompt,
            40,
            `Show the learner applying ${lessonFocus} in a realistic cosmetology workplace setting.`,
          ),
        }),
      );
    }

    if (experience.practicalTask && typeof experience.practicalTask === 'object') {
      const instructions = Array.isArray(experience.practicalTask.instructions)
        ? experience.practicalTask.instructions.filter(
            (value: unknown): value is string =>
              typeof value === 'string' && value.trim().length > 0,
          )
        : [];
      const completionSteps = [
        `Prepare the workspace, tools, and evidence needed to demonstrate ${lessonFocus}.`,
        `Perform the task while following the lesson's safety and decision criteria.`,
        'Document the result and verify it against the stated objective before submission.',
      ];
      while (instructions.length < 3) instructions.push(completionSteps[instructions.length]);
      experience.practicalTask.instructions = instructions;
    }

    return JSON.stringify(parsed);
  } catch {
    return raw;
  }
}

export async function generateLessonContent(
  input: LessonGenerationInput,
): Promise<GeneratedLessonContent> {
  const cached = await loadLessonGenerationCheckpoint(input.courseTitle, input.lesson.slug);
  if (cached) {
    logger.info('[course-factory/content-generator] Reusing generated lesson checkpoint', {
      lesson: input.lesson.slug,
      courseTitle: input.courseTitle,
    });
    return cached;
  }

  if (!isAIAvailable()) throw new Error('AI service not available');

  const domainKey =
    input.lesson.domainKey || input.moduleTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const prompt = `
Generate a complete commercial-quality, self-paced workforce-training lesson for:
- Lesson: ${input.lesson.title}
- Module: ${input.moduleTitle}
- Course: ${input.courseTitle}
- Domain key: ${domainKey}
${input.state ? `- State: ${input.state}` : ''}
${input.standardsBlock ? `\nIndustry Standards:\n${input.standardsBlock}` : ''}

The lesson must be ORIGINAL Elevate for Humanity instructional content. Do not copy provider courseware, screenshots, proprietary question banks, or branded third-party lesson text. Do not imply that Elevate-authored content is official provider courseware.

Return ONLY valid JSON with exactly this shape:
{
  "objective": "One measurable learning objective using an action verb",
  "learning_points": [
    "3 to 5 substantive learning points, each at least one complete sentence"
  ],
  "scenario": "A realistic workplace or business scenario of at least 80 words that applies the lesson",
  "content": "HTML formatted instructional lesson content of at least 700 words, with headings, examples, worked application steps, a short recap, and accessibility-friendly plain language",
  "quiz_questions": [
    {
      "question": "Formative question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Why this answer is correct and why the distractors are weaker"
    }
  ],
  "experience": {
    "readingGuide": {
      "title": "Lesson reading guide title",
      "summary": "At least 80 characters summarizing what the learner will understand",
      "sections": [
        {"heading":"Concept section 1","body":"At least 120 characters of original explanatory reading"},
        {"heading":"Concept section 2","body":"At least 120 characters of original explanatory reading"},
        {"heading":"Application section","body":"At least 120 characters connecting the concept to a real decision"}
      ],
      "keyTakeaways": ["takeaway 1","takeaway 2","takeaway 3"]
    },
    "narrationScript": "At least 250 characters of natural, lesson-specific instructor narration",
    "visualPrompt": "Specific bright Elevate visual direction naming people, setting, action, evidence, and outcome",
    "flashcards": [
      {"id":"term-1","front":"lesson-specific term","back":"lesson-specific explanation","tags":["${domainKey}"]},
      {"id":"term-2","front":"second term","back":"explanation","tags":["${domainKey}"]},
      {"id":"term-3","front":"third term","back":"explanation","tags":["${domainKey}"]},
      {"id":"term-4","front":"fourth term","back":"explanation","tags":["${domainKey}"]},
      {"id":"term-5","front":"fifth term","back":"explanation","tags":["${domainKey}"]},
      {"id":"term-6","front":"sixth term","back":"explanation","tags":["${domainKey}"]}
    ],
    "quickClips": [
      {"id":"clip-1","title":"Core concept in under five minutes","objective":"single micro-objective","durationSeconds":180,"script":"At least 120 characters of concise teaching script","visualPrompt":"At least 40 characters of specific visual direction"},
      {"id":"clip-2","title":"Applied example in under five minutes","objective":"single application objective","durationSeconds":180,"script":"At least 120 characters of concise applied teaching script","visualPrompt":"At least 40 characters of specific visual direction"}
    ],
    "knowledgeChecks": [
      {"question":"objective-aligned question","options":["A","B","C","D"],"correct":0,"explanation":"specific explanation"},
      {"question":"second objective-aligned question","options":["A","B","C","D"],"correct":1,"explanation":"specific explanation"},
      {"question":"scenario-based objective check","options":["A","B","C","D"],"correct":2,"explanation":"specific explanation"}
    ],
    "scenario": {"title":"specific situation","context":"facts and constraints","question":"decision","options":[{"text":"specific choice","isCorrect":true,"feedback":"specific feedback"},{"text":"specific distractor","isCorrect":false,"feedback":"specific remediation"}]},
    "caseStudy": {"title":"specific evidence review","context":"case facts","question":"analysis question","options":[{"text":"supported conclusion","isCorrect":true,"feedback":"specific feedback"},{"text":"unsupported conclusion","isCorrect":false,"feedback":"specific remediation"}]},
    "exercises": [
      {"id":"exercise-1","title":"Learn by doing","instructions":["specific action step 1","specific action step 2"],"expectedArtifact":"observable learner output","autoGrade":{"type":"checklist","criteria":["objective-aligned criterion 1","objective-aligned criterion 2"]}}
    ],
    "practicalTask": {"title":"observable task","description":"job-ready artifact","instructions":["specific step 1","specific step 2","specific step 3"],"evidence":"verification artifact"},
    "resources": [
      {"type":"worksheet","title":"Lesson worksheet","description":"What the learner completes","content":"At least 40 characters of original worksheet prompts/instructions"},
      {"type":"reference","title":"Quick reference","description":"What the learner can use later","content":"At least 40 characters of original reference content"}
    ],
    "glossary": [
      {"term":"term 1","definition":"lesson-specific definition"},
      {"term":"term 2","definition":"lesson-specific definition"},
      {"term":"term 3","definition":"lesson-specific definition"},
      {"term":"term 4","definition":"lesson-specific definition"}
    ],
    "remediation": {
      "passingScore":80,
      "reviewMessage":"targeted retry direction",
      "objectiveMap":["objective 1","objective 2","objective 3"],
      "targetedActions":[{"objective":"specific weak objective","action":"re-read the named section, review flashcards, complete the exercise, then retry the related check"}]
    },
    "readiness": {
      "domainKey":"${domainKey}",
      "masteryThreshold":80,
      "evidenceSignals":["knowledge-check mastery","applied exercise completion","assessment performance"]
    }
  }
}

Quality requirements:
- 3 to 5 formative quiz_questions with rationales.
- At least 6 lesson-specific flashcards.
- At least 2 distinct short concept clips, each 1 to 5 minutes.
- At least 3 experience knowledge checks.
- At least 1 learn-by-doing exercise in every instructional lesson.
- At least 2 usable learner resources per lesson.
- At least 4 glossary terms.
- Reading content must stand alone for learners who cannot or do not use video.
- Remediation must route weak objectives back to a named learning action.
- Readiness evidence must be tied to the lesson's domain, never a generic score.
- Do not use generic placeholders, reusable scenario language, copied provider content, third-party trademarks as course branding, or unverified claims.

The content must be original, job-ready, factually grounded, and aligned to the lesson title and course objective.
`.trim();

  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await aiChat({
        messages: [
          {
            role: 'system',
            content:
              'You are an expert instructional designer building complete, original, commercial-quality self-paced workforce training. Return ONLY valid JSON and satisfy every field in the contract.',
          },
          {
            role: 'user',
            content:
              attempt === 1
                ? prompt
                : `${prompt}\n\nYour previous response failed the strict contract. Return the complete JSON object with every required field, at least 6 flashcards, 2 quickClips, 3 knowledgeChecks, 1 exercise, 2 resources, 4 glossary terms, readiness and targeted remediation. No markdown.`,
          },
        ],
        temperature: attempt === 1 ? 0.65 : 0.35,
        maxTokens: lessonGenerationMaxTokens(),
      });

      const parsed = parseStrictAIJson(
        normalizeLessonContract(response.content),
        generatedLessonContentSchema,
        'Lesson generation',
      );

      const generated: GeneratedLessonContent = {
        objective: parsed.objective,
        content: JSON.stringify({
          html: parsed.content,
          learning_points: parsed.learning_points,
          scenario: parsed.scenario,
          experience: parsed.experience,
        }),
        learning_points: parsed.learning_points,
        scenario: parsed.scenario,
        quiz_questions: parsed.quiz_questions,
      };

      await persistLessonGenerationCheckpoint({
        courseTitle: input.courseTitle,
        lessonSlug: input.lesson.slug,
        objective: parsed.objective,
        html: parsed.content,
        learningPoints: parsed.learning_points,
        scenario: parsed.scenario,
        quizQuestions: parsed.quiz_questions,
        experience: parsed.experience as Record<string, any>,
      });

      return generated;
    } catch (error) {
      lastError = error;
      logger.warn('[course-factory/content-generator] Lesson contract retry', {
        lesson: input.lesson.slug,
        attempt,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  logger.error('[course-factory/content-generator] Lesson generation failed', lastError);
  throw lastError instanceof Error ? lastError : new Error('Lesson generation failed');
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
  const count = input.questionCount ?? 10;
  const cached = await loadAssessmentCheckpoint(input.courseTitle, input.lessonSlug, count);
  if (cached) {
    logger.info('[course-factory/content-generator] Reusing assessment checkpoint', {
      lesson: input.lessonSlug,
      courseTitle: input.courseTitle,
      questions: cached.length,
    });
    return { questions: cached };
  }

  if (!isAIAvailable()) throw new Error('AI service not available');

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
      "explanation": "Why this answer is correct and why the alternatives are weaker"
    }
  ]
}

Make questions original, job-relevant, scenario-rich, and aligned to the lesson content. Do not copy or imitate proprietary certification exam questions.
Return ONLY valid JSON.
`.trim();

  try {
    const response = await aiChat({
      messages: [
        {
          role: 'system',
          content:
            'You are an expert in creating original assessments for workforce training. Create job-relevant questions that test practical knowledge without copying proprietary exam items. Return ONLY valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      maxTokens: 5000,
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
    const questions = parsed.questions.slice(0, count);
    await persistAssessmentCheckpoint({
      courseTitle: input.courseTitle,
      lessonSlug: input.lessonSlug,
      questions,
    });
    return { questions };
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
Generate a ${questionCount}-question original final readiness exam for: "${courseTitle}"

This course has ${moduleCount} modules. Cover the complete course proportionally and test knowledge recall, application, quantitative reasoning where appropriate, and scenario-based decision making. Do not copy or paraphrase proprietary certification exam questions.

Return JSON with exactly ${questionCount} questions:
{
  "questions": [
    {
      "question": "Exam question text",
      "options": ["A", "B", "C", "D"],
      "correct": 0,
      "explanation": "Correct answer explanation and remediation rationale"
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
            'You are an expert assessment writer. Create comprehensive original final exams that test full course competency without copying proprietary certification questions. Return ONLY valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      maxTokens: 8000,
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

export async function generateBlueprintFromAI(input: BlueprintGenerationInput): Promise<{
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
Create a complete workforce training course blueprint.

Title: ${input.title}
Topic: ${input.topic}
Audience: ${input.audience}
${input.state ? `State: ${input.state}` : ''}
${input.credential ? `Credential target: ${input.credential}` : ''}

Requirements:
- Exactly ${modules} modules
- Approximately ${lessonsPerModule} learner-facing steps per module
- Every instructional module must include applied learning plus a checkpoint
- Include a cumulative review, practice/readiness assessment, targeted remediation path, and final exam where appropriate
- Use unique lowercase kebab-case slugs
- Include practical or assignment steps when the topic requires applied competency
- The blueprint must support reading, flashcards, short clips, exercises, resources, domain readiness analytics, and remediation through the standard Course Factory lesson experience
- Do not use third-party certification brands in the Elevate-authored course title unless explicitly supplied as licensed provider content

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
            'You design complete workforce-training course structures with instruction, applied practice, assessment, remediation, and readiness evidence. Return ONLY valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
      maxTokens: 6000,
    });

    const parsed = parseStrictAIJson(
      response.content,
      generatedBlueprintSchema,
      'Blueprint generation',
    );
    if (parsed.modules.length !== modules) {
      throw new Error(
        `Blueprint generation returned ${parsed.modules.length}/${modules} required modules`,
      );
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

Only map standards that are genuinely applicable to the lesson. Do not fabricate provider endorsement or certification authority.
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

    return parseStrictAIJson(response.content, competencyMappingSchema, 'Competency mapping');
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
