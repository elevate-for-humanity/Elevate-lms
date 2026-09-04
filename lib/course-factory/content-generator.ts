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
  quizQuestionSchema,
} from './ai-contracts';
import {
  loadAssessmentCheckpoint,
  loadPartialAssessmentCheckpoint,
  loadLessonGenerationCheckpoint,
  persistAssessmentCheckpoint,
  persistLessonGenerationCheckpoint,
} from './generation-checkpoints';
import type { BlueprintLessonRef, QuizQuestion } from './types';
import { normalizeLessonContract } from './lesson-contract-normalizer';

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
  /** Invalidates durable/database checkpoints when the governing blueprint changes. */
  checkpointNamespace?: string;
  /** Canonical draft shell used to persist and queue this lesson as one unit. */
  courseId?: string;
}

const GOVERNED_COURSE_RULES = `
GOVERNED COURSE RULES:
- Teach the named lesson and mapped competency; never substitute adjacent trades or generic filler.
- Separate instruction, guided examples, hands-on practice, knowledge checks, and remediation.
- Use measurable learner actions and realistic workplace decisions with safety and infection-control consequences where applicable.
- Explain why correct answers are correct and why distractors are unsafe, incomplete, or unsupported.
- State licensing or regulatory requirements cautiously; do not invent hours, legal guarantees, official exam questions, or agency approval.
- Keep all content original and brand-neutral; do not reproduce Milady or any proprietary textbook or test bank.
- Support accessibility with plain language, meaningful headings, narration that works without visuals, and text instruction that works without video.
- Produce complete, learner-ready content with no placeholders, TODOs, unsupported links, or promises of automatic licensure or state-board passage.
- Keep every workplace, person, tool, credential, and visual inside the named course discipline. Never borrow a setting or role from another trade.
- Do not name, invent, or introduce an instructor in narration. The governed media layer adds the approved instructor identity after content validation.
`.trim();

const CROSS_DOMAIN_MARKERS: Array<{ family: RegExp; forbidden: RegExp }> = [
  {
    family: /\b(hvac|refriger|epa[_ -]?608|heating|air[_ -]?conditioning)\b/i,
    forbidden: /\b(cosmetolog|salon|barber|haircut|esthetician|nail technician|technology training lead|certiport-certified it)\b/i,
  },
  {
    family: /\b(cosmetolog|salon|barber|esthetic|nail)\b/i,
    forbidden: /\b(hvac technician|refrigerant recovery|epa[_ -]?608|technology training lead|certiport-certified it)\b/i,
  },
];

const GOVERNED_INSTRUCTOR_MARKERS =
  /\b(Dr\. Sarah Chen|Marcus Johnson|Avery Brooks|James Williams|Lisa Martinez|Robert Davis|Angela Thompson)\b/i;

/** Reject structurally valid output that belongs to the wrong training domain. */
export function assertLessonDomainIsolation(
  context: Pick<LessonGenerationInput, 'courseTitle' | 'moduleTitle' | 'lesson'>,
  generated: unknown,
): void {
  const familyText = `${context.courseTitle} ${context.moduleTitle} ${context.lesson.domainKey ?? ''}`;
  const output = JSON.stringify(generated);
  if (GOVERNED_INSTRUCTOR_MARKERS.test(output)) {
    throw new Error(
      'Lesson generation violated domain isolation: instructor identity is owned by the governed media layer',
    );
  }
  for (const rule of CROSS_DOMAIN_MARKERS) {
    if (rule.family.test(familyText) && rule.forbidden.test(output)) {
      throw new Error(
        `Lesson generation violated domain isolation: cross-discipline content matched ${String(rule.forbidden)}`,
      );
    }
  }
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

/**
 * Bound full-provider retries so malformed output cannot consume an open-ended
 * GPU or API budget. Contract normalization runs locally before a retry.
 */
export function lessonGenerationMaxAttempts(): number {
  const configured = Number.parseInt(process.env.COURSE_FACTORY_LESSON_MAX_ATTEMPTS ?? '', 10);
  if (!Number.isFinite(configured)) return 3;
  return Math.min(3, Math.max(1, configured));
}

export async function generateLessonContent(
  input: LessonGenerationInput,
): Promise<GeneratedLessonContent> {
  const checkpointSlug = input.checkpointNamespace
    ? `${input.lesson.slug}@${input.checkpointNamespace}`
    : input.lesson.slug;
  const cached = await loadLessonGenerationCheckpoint(input.courseTitle, checkpointSlug);
  if (cached) {
    logger.info('[course-factory/content-generator] Reusing generated lesson checkpoint', {
      lesson: input.lesson.slug,
      courseTitle: input.courseTitle,
    });
    try {
      const content = JSON.parse(cached.content) as Record<string, any>;
      await persistLessonGenerationCheckpoint({
        courseId: input.courseId,
        courseTitle: input.courseTitle,
        canonicalLessonSlug: input.lesson.slug,
        lessonSlug: checkpointSlug,
        objective: cached.objective,
        html: String(content.html ?? ''),
        learningPoints: cached.learning_points,
        scenario: cached.scenario,
        quizQuestions: cached.quiz_questions,
        experience: content.experience as Record<string, any>,
      });
    } catch (error) {
      logger.warn('[course-factory/content-generator] Cached lesson handoff failed', {
        lesson: input.lesson.slug,
        error: error instanceof Error ? error.message : String(error),
      });
    }
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

${GOVERNED_COURSE_RULES}

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
  const maxAttempts = lessonGenerationMaxAttempts();
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
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
                : `${prompt}\n\nYour previous response failed the strict contract with this exact validation error:\n${lastError instanceof Error ? lastError.message : String(lastError)}\n\nCorrect every named defect. Return the complete JSON object with every required field, exactly 4 substantive options for every quiz question and knowledge check, at least 6 flashcards, 2 quickClips, 3 knowledgeChecks, 1 exercise, 2 resources, 4 glossary terms, readiness and targeted remediation. No markdown.`,
          },
        ],
        temperature: attempt === 1 ? 0.65 : 0.35,
        maxTokens: lessonGenerationMaxTokens(),
        jsonMode: true,
      });

      const parsed = parseStrictAIJson(
        normalizeLessonContract(normalizeFourOptionQuestions(response.content)),
        generatedLessonContentSchema,
        'Lesson generation',
      );
      assertLessonDomainIsolation(input, parsed);

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
        courseId: input.courseId,
        courseTitle: input.courseTitle,
        canonicalLessonSlug: input.lesson.slug,
        lessonSlug: checkpointSlug,
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

/**
 * Some providers occasionally return the fourth answer as index 4 even though
 * the contract is zero-based. Normalize only that unambiguous boundary case;
 * every other invalid value still fails strict validation.
 */
type ProviderQuestion = {
  options?: unknown[];
  correct?: unknown;
  correct_index?: unknown;
  correctIndex?: unknown;
  correctAnswer?: unknown;
  explanation?: unknown;
  rationale?: unknown;
  feedback?: unknown;
  reason?: unknown;
  answer_explanation?: unknown;
};

/**
 * Repair provider formatting without changing the correct answer.
 *
 * Some OpenAI-compatible providers return extra distractors even when JSON
 * mode is enabled. Throwing away the whole assessment wastes the completed
 * course checkpoints. Keep the selected answer plus three distractors and
 * remap its zero-based index. Responses with fewer than four choices remain
 * invalid and are retried by the bounded generator loop.
 */
export function normalizeFourOptionQuestions(raw: string): string {
  const parsed = JSON.parse(raw) as {
    questions?: ProviderQuestion[];
    quiz_questions?: ProviderQuestion[];
    experience?: { knowledgeChecks?: ProviderQuestion[] };
  };
  const groups = [parsed.questions, parsed.quiz_questions, parsed.experience?.knowledgeChecks];

  for (const questions of groups) {
    for (const question of questions ?? []) {
      if (!Array.isArray(question.options)) continue;

      const providerCorrect =
        question.correct ??
        question.correct_index ??
        question.correctIndex ??
        question.correctAnswer;
      let correct = Number(providerCorrect);
      if (!Number.isInteger(correct) && typeof providerCorrect === 'string') {
        correct = question.options.findIndex(
          (option) =>
            String(option).trim().toLocaleLowerCase() ===
            providerCorrect.trim().toLocaleLowerCase(),
        );
      }
      if (Number.isInteger(correct) && correct === question.options.length) {
        correct = question.options.length - 1;
      }

      if (question.options.length > 4 && Number.isInteger(correct)) {
        const correctOption = question.options[correct];
        if (correctOption !== undefined) {
          const selected = question.options.filter((_, index) => index !== correct).slice(0, 3);
          selected.push(correctOption);
          question.options = selected;
          correct = 3;
        }
      }

      question.correct = correct;
      question.explanation =
        question.explanation ??
        question.rationale ??
        question.feedback ??
        question.reason ??
        question.answer_explanation;
      delete question.correct_index;
      delete question.correctIndex;
      delete question.correctAnswer;
      delete question.rationale;
      delete question.feedback;
      delete question.reason;
      delete question.answer_explanation;
    }
  }
  return JSON.stringify(parsed);
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

${GOVERNED_COURSE_RULES}

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

  let lastError: unknown;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await aiChat({
        messages: [
          {
            role: 'system',
            content:
              'You are an expert in creating original assessments for workforce training. Create job-relevant questions that test practical knowledge without copying proprietary exam items. Return ONLY valid JSON.',
          },
          {
            role: 'user',
            content:
              attempt === 1
                ? prompt
                : `${prompt}\n\nThe previous response failed validation. Return exactly ${count} questions with exactly four options per question and zero-based correct indexes.`,
          },
        ],
        temperature: attempt === 1 ? 0.7 : 0.3,
        maxTokens: 5000,
        jsonMode: true,
      });

      const parsed = parseStrictAIJson(
        normalizeFourOptionQuestions(response.content),
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
      lastError = error;
      logger.warn('[course-factory/content-generator] Assessment contract retry', {
        lesson: input.lessonSlug,
        attempt,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  logger.error('[course-factory/content-generator] Assessment generation failed', lastError);
  throw lastError instanceof Error ? lastError : new Error('Assessment generation failed');
}

export async function generateFinalExam(
  courseTitle: string,
  moduleCount: number,
  questionCount: number = 25,
  requiredDomains: string[] = [],
  checkpointSlug?: string,
): Promise<GeneratedAssessment> {
  if (!isAIAvailable()) throw new Error('AI service not available');

  const prompt = `
Generate a ${questionCount}-question original final readiness exam for: "${courseTitle}"

This course has ${moduleCount} modules. Cover the complete course proportionally and test knowledge recall, application, quantitative reasoning where appropriate, and scenario-based decision making. Do not copy or paraphrase proprietary certification exam questions.
${requiredDomains.length ? `Required domains (cover every domain):\n${requiredDomains.map((domain) => `- ${domain}`).join('\n')}` : ''}

${GOVERNED_COURSE_RULES}

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

  let lastError: unknown;
  const questions: GeneratedAssessment['questions'] = [];
  const seenQuestions = new Set<string>();
  const maxAttempts = 4;

  if (checkpointSlug) {
    const cached = await loadPartialAssessmentCheckpoint(courseTitle, checkpointSlug);
    for (const question of cached ?? []) {
      const key = question.question.trim().toLocaleLowerCase();
      if (!seenQuestions.has(key)) {
        seenQuestions.add(key);
        questions.push(question);
      }
      if (questions.length === questionCount) break;
    }
    if (questions.length) {
      logger.info('[course-factory/content-generator] Resuming partial final exam checkpoint', {
        lesson: checkpointSlug,
        questions: questions.length,
        required: questionCount,
      });
    }
  }

  // A complete persisted checkpoint is already a valid final exam. Return it
  // before entering the repair loop; otherwise the loop is skipped and the
  // function incorrectly falls through to the terminal failure below.
  if (questions.length === questionCount) return { questions };

  // Providers occasionally stop one or two items short of a large JSON array.
  // Accumulate valid, unique items across bounded calls instead of discarding a
  // nearly-complete exam and regenerating the whole response.
  for (let attempt = 1; attempt <= maxAttempts && questions.length < questionCount; attempt += 1) {
    try {
      const missingCount = questionCount - questions.length;
      const repairPrompt =
        questions.length === 0
          ? prompt
          : `Generate exactly ${missingCount} replacement questions for the final readiness exam for "${courseTitle}".\n\nDo not repeat any of these existing questions:\n${questions.map((question, index) => `${index + 1}. ${question.question}`).join('\n')}\n\nReturn ONLY this JSON contract:\n{"questions":[{"question":"Complete question text","options":["A","B","C","D"],"correct":0,"explanation":"A substantive explanation of why the correct answer is right and the distractors are weaker"}]}\n\nUse the exact keys question, options, correct, and explanation. The correct value must be a zero-based integer. Do not use correct_index, correctAnswer, rationale, feedback, null, or omitted fields.`;
      const response = await aiChat({
        messages: [
          {
            role: 'system',
            content:
              'You are an expert assessment writer. Create comprehensive original final exams that test full course competency without copying proprietary certification questions. Return ONLY valid JSON.',
          },
          {
            role: 'user',
            content: repairPrompt,
          },
        ],
        temperature: attempt === 1 ? 0.7 : 0.3,
        maxTokens: Math.min(8000, Math.max(1200, missingCount * 450)),
        jsonMode: true,
      });

      const normalized = JSON.parse(normalizeFourOptionQuestions(response.content)) as {
        questions?: unknown[];
      };
      const candidates = Array.isArray(normalized.questions) ? normalized.questions : [];
      let invalidCount = 0;
      for (const candidate of candidates) {
        const parsedQuestion = quizQuestionSchema.safeParse(candidate);
        if (!parsedQuestion.success) {
          invalidCount += 1;
          continue;
        }
        const question = parsedQuestion.data;
        const key = question.question.trim().toLocaleLowerCase();
        if (!seenQuestions.has(key)) {
          seenQuestions.add(key);
          questions.push(question);
        }
        if (questions.length === questionCount) break;
      }

      if (checkpointSlug && questions.length) {
        await persistAssessmentCheckpoint({ courseTitle, lessonSlug: checkpointSlug, questions });
      }

      if (questions.length === questionCount) return { questions };

      lastError = new Error(
        `Final exam generation accumulated ${questions.length}/${questionCount} required unique questions`,
      );
      logger.warn('[course-factory/content-generator] Final exam gap repair required', {
        attempt,
        accumulated: questions.length,
        required: questionCount,
        invalid: invalidCount,
      });
    } catch (error) {
      lastError = error;
      logger.warn('[course-factory/content-generator] Final exam contract retry', {
        attempt,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  logger.error('[course-factory/content-generator] Final exam generation failed', lastError);
  throw lastError instanceof Error ? lastError : new Error('Final exam generation failed');
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
      jsonMode: true,
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
      jsonMode: true,
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
