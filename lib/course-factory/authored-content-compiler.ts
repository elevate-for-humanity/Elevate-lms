import { load } from 'cheerio';
import type {
  BlueprintLessonRef,
  BlueprintModule,
  BlueprintQuizQuestion,
  CredentialBlueprint,
} from '@/lib/curriculum/blueprints/types';
import { CourseExperienceSchema, type CourseExperience } from './experience-contract';
import { inferStepType } from './validator';

const GENERIC_MARKERS = [
  'deterministic baseline',
  'intentionally general',
  'reusable decision process',
  'key concept 1',
  'this scenario is intentionally general',
];

type AuthoredQuestion = {
  id?: string;
  question: string;
  options: string[];
  correctAnswer?: number;
  correct?: number;
  explanation?: string;
  domainKey?: string;
  competencyKeys?: string[];
};

export type AuthoredLessonInput = {
  courseTitle: string;
  moduleTitle: string;
  lessonTitle: string;
  lessonSlug: string;
  domainKey: string;
  html: string;
  learningObjectives: unknown;
  quizQuestions: unknown;
  keyTerms?: unknown;
  existingExperience?: unknown;
};

function clean(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

function unique(values: string[]): string[] {
  return [...new Set(values.map(clean).filter(Boolean))];
}

function sourceIsGeneric(value: unknown): boolean {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  const normalized = serialized.toLowerCase();
  return GENERIC_MARKERS.some((marker) => normalized.includes(marker));
}

function normalizeQuestion(
  value: unknown,
  index: number,
  domainKey: string,
): AuthoredQuestion | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const question = value as Record<string, any>;
  const options = Array.isArray(question.options)
    ? question.options.map(clean).filter(Boolean)
    : [];
  const correct = Number(question.correctAnswer ?? question.correct);
  if (
    !clean(question.question) ||
    options.length !== 4 ||
    !Number.isInteger(correct) ||
    correct < 0 ||
    correct > 3
  ) {
    return null;
  }
  return {
    id: clean(question.id) || `authored-q${index + 1}`,
    question: clean(question.question),
    options,
    correctAnswer: correct,
    explanation:
      clean(question.explanation) ||
      `Review the ${domainKey.replace(/_/g, ' ')} lesson evidence supporting the correct response.`,
    domainKey: clean(question.domainKey) || domainKey,
    competencyKeys: Array.isArray(question.competencyKeys)
      ? question.competencyKeys.map(clean).filter(Boolean)
      : [],
  };
}

function textChunks(text: string, count: number): string[] {
  const sentences =
    text
      .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
      ?.map(clean)
      .filter(Boolean) ?? [];
  const chunks = Array.from({ length: count }, () => '');
  const target = Math.max(120, Math.ceil(text.length / count));
  let cursor = 0;
  for (const sentence of sentences) {
    if (cursor < count - 1 && (chunks[cursor]?.length ?? 0) >= target) cursor += 1;
    chunks[cursor] = `${chunks[cursor] ?? ''} ${sentence}`.trim();
  }
  if (chunks.every((chunk) => chunk.length >= 120)) return chunks;

  // Some authored lessons use one or two long paragraphs without sentence
  // punctuation. Balance those sources by words so every reading section is
  // substantive; never pad the lesson with generated filler.
  const words = text.split(/\s+/).filter(Boolean);
  return Array.from({ length: count }, (_, index) => {
    const start = Math.floor((words.length * index) / count);
    const end = Math.floor((words.length * (index + 1)) / count);
    return words.slice(start, end).join(' ');
  });
}

function authoredSections(html: string, lessonTitle: string) {
  const $ = load(html);
  $('script,style,noscript').remove();
  const sourceText = clean($.root().text());
  if (sourceText.length < 500) {
    throw new Error(
      `${lessonTitle}: authored instructional content must contain at least 500 characters`,
    );
  }
  if (sourceIsGeneric(sourceText)) {
    throw new Error(
      `${lessonTitle}: generic baseline content is prohibited; replace it with authored instruction`,
    );
  }

  const sections: Array<{ heading: string; body: string }> = [];
  $('h1,h2,h3,h4').each((_, element) => {
    const heading = clean($(element).text());
    const body: string[] = [];
    let sibling = $(element).next();
    while (sibling.length && !/^h[1-4]$/i.test(String(sibling.get(0)?.tagName ?? ''))) {
      const text = clean(sibling.text());
      if (text) body.push(text);
      sibling = sibling.next();
    }
    if (heading && clean(body.join(' ')).length >= 120) {
      sections.push({ heading, body: clean(body.join(' ')) });
    }
  });

  if (sections.length < 3) {
    const headings = unique(
      $('h1,h2,h3,h4')
        .map((_, element) => clean($(element).text()))
        .get(),
    );
    const chunks = textChunks(sourceText, 3);
    return {
      sourceText,
      sections: chunks.map((body, index) => ({
        heading:
          headings[index] ||
          `${lessonTitle}: ${index === 0 ? 'Foundations' : index === 1 ? 'Application' : 'Practice'}`,
        body,
      })),
    };
  }

  return { sourceText, sections: sections.slice(0, 8) };
}

function objectiveLabel(objective: string): string {
  return objective
    .replace(
      /^(identify|explain|apply|evaluate|analyze|demonstrate|compare|create|describe|calculate|recognize)\s+/i,
      '',
    )
    .split(/\s+/)
    .slice(0, 7)
    .join(' ')
    .replace(/[.!?,;:]+$/, '');
}

function normalizedObjectives(
  value: unknown,
  sections: Array<{ heading: string; body: string }>,
): string[] {
  const objectives = Array.isArray(value) ? value.map(clean).filter(Boolean) : [];
  for (const section of sections) {
    if (objectives.length >= 3) break;
    objectives.push(`Explain and apply ${section.heading} using the evidence in this lesson.`);
  }
  return unique(objectives).slice(0, 8);
}

function normalizedTerms(
  value: unknown,
  objectives: string[],
  sections: Array<{ heading: string; body: string }>,
) {
  const terms: Array<{ term: string; definition: string }> = [];
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === 'string' && clean(item)) {
        const term = clean(item);
        const section = sections.find((entry) =>
          entry.body.toLowerCase().includes(term.toLowerCase()),
        );
        const definition = section?.body ?? objectives[0];
        if (definition) terms.push({ term, definition });
      } else if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>;
        const term = clean(record.term ?? record.name ?? record.label);
        const definition = clean(record.definition ?? record.description ?? record.value);
        if (term && definition) terms.push({ term, definition });
      }
    }
  }
  for (const section of sections) {
    if (terms.length >= 6) break;
    terms.push({ term: section.heading, definition: section.body });
  }
  for (const objective of objectives) {
    if (terms.length >= 6) break;
    terms.push({ term: objectiveLabel(objective), definition: objective });
  }
  const seen = new Set<string>();
  return terms
    .filter((item) => {
      const key = item.term.toLowerCase();
      if (!item.term || !item.definition || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 8);
}

export function compileAuthoredLessonExperience(input: AuthoredLessonInput): {
  experience: CourseExperience;
  objectives: string[];
  questions: AuthoredQuestion[];
  learningPoints: string[];
} {
  const existing = CourseExperienceSchema.safeParse(input.existingExperience);
  if (existing.success && !sourceIsGeneric(existing.data)) {
    const questions = (Array.isArray(input.quizQuestions) ? input.quizQuestions : [])
      .map((question, index) => normalizeQuestion(question, index, input.domainKey))
      .filter((question): question is AuthoredQuestion => Boolean(question));
    const objectives = normalizedObjectives(
      input.learningObjectives,
      existing.data.readingGuide.sections,
    );
    return {
      experience: existing.data,
      objectives,
      questions,
      learningPoints: existing.data.readingGuide.keyTakeaways,
    };
  }

  const { sourceText, sections } = authoredSections(input.html, input.lessonTitle);
  const objectives = normalizedObjectives(input.learningObjectives, sections);
  if (objectives.length < 3)
    throw new Error(`${input.lessonTitle}: at least three authored objectives are required`);

  const questions = (Array.isArray(input.quizQuestions) ? input.quizQuestions : [])
    .map((question, index) => normalizeQuestion(question, index, input.domainKey))
    .filter((question): question is AuthoredQuestion => Boolean(question));
  if (questions.length < 3) {
    throw new Error(
      `${input.lessonTitle}: at least three complete authored assessment questions are required`,
    );
  }

  const [section0, section1, section2] = sections;
  const [objective0, objective1] = objectives;
  const [question0, question1] = questions;
  if (!section0 || !section1 || !section2 || !objective0 || !objective1 || !question0 || !question1) {
    throw new Error(`${input.lessonTitle}: authored lesson structure is incomplete`);
  }

  const glossary = normalizedTerms(input.keyTerms, objectives, sections);
  if (glossary.length < 4)
    throw new Error(`${input.lessonTitle}: at least four lesson-specific terms are required`);
  const flashcards = [
    ...glossary.map((entry, index) => ({
      id: `${input.lessonSlug}-term-${index + 1}`,
      front: entry.term,
      back: entry.definition,
      tags: [input.domainKey],
    })),
    ...objectives.map((objective, index) => ({
      id: `${input.lessonSlug}-objective-${index + 1}`,
      front: objectiveLabel(objective),
      back: objective,
      tags: [input.domainKey, 'objective'],
    })),
  ].slice(0, 8);
  if (flashcards.length < 6)
    throw new Error(
      `${input.lessonTitle}: source content cannot support six lesson-specific flashcards`,
    );

  const checks = questions.slice(0, 3).map((question) => ({
    question: question.question,
    options: question.options,
    correct: Number(question.correctAnswer),
    explanation: String(question.explanation),
  }));
  const optionSet = (question: AuthoredQuestion) =>
    question.options.map((text, index) => ({
      text,
      isCorrect: index === question.correctAnswer,
      feedback:
        index === question.correctAnswer
          ? String(question.explanation)
          : `Review ${sections[index % sections.length]?.heading ?? section0.heading} and compare this choice with the lesson evidence.`,
    }));
  const summary = clean(`${section0.body} ${section1.body}`).slice(0, 700);
  const narrationScript = clean(
    `${input.lessonTitle}. ${objectives.join(' ')} ${sections.map((section) => `${section.heading}. ${section.body}`).join(' ')}`,
  ).slice(0, 12000);

  const experience = CourseExperienceSchema.parse({
    readingGuide: {
      title: `${input.lessonTitle} learning guide`,
      summary,
      sections,
      keyTakeaways: objectives.slice(0, 5),
    },
    content: sourceText,
    narrationScript,
    visualPrompt: `Create a bright Elevate for Humanity instructional scene for “${input.lessonTitle}” in ${input.moduleTitle}. Show an adult learner actively demonstrating: ${objective0} Include visible work evidence, accessible captions, warm brand colors, and a clear successful outcome.`,
    flashcards,
    quickClips: sections.slice(0, 2).map((section, index) => ({
      id: `${input.lessonSlug}-clip-${index + 1}`,
      title: section.heading,
      objective: objectives[index] ?? objective0,
      durationSeconds: 180,
      script: clean(`${section.heading}. ${section.body}`).slice(0, 3000),
      visualPrompt: `Bright Elevate micro-lesson illustrating ${section.heading} for ${input.lessonTitle}, with the learner applying ${objectives[index] ?? objective0} and showing the completed evidence.`,
    })),
    knowledgeChecks: checks,
    scenario: {
      title: `${input.lessonTitle}: applied decision`,
      context: section1.body,
      question: question0.question,
      options: optionSet(question0),
    },
    caseStudy: {
      title: `${input.lessonTitle}: evidence case`,
      context: section2.body,
      question: question1.question,
      options: optionSet(question1),
    },
    exercises: [
      {
        id: `${input.lessonSlug}-exercise-1`,
        title: `Apply ${objectiveLabel(objective0)}`,
        instructions: [
          `Use the ${section0.heading} section to identify the facts and criteria that matter.`,
          `Complete an example that demonstrates this objective: ${objective0}`,
          `Compare your result with the evidence and method explained in ${section1.heading}.`,
        ],
        expectedArtifact: `A completed ${input.lessonTitle} work product with the supporting lesson evidence identified.`,
        autoGrade: {
          type: 'checklist',
          criteria: objectives.slice(0, 3),
        },
      },
    ],
    practicalTask: {
      title: `${input.lessonTitle} practical application`,
      description: `Demonstrate the lesson objectives through an observable application of ${input.lessonTitle}.`,
      instructions: [
        `Review the required method and evidence in ${section0.heading}.`,
        `Perform or document the application described by: ${objective0}`,
        `Check the completed work against ${objective1} and record the result.`,
      ],
      evidence: `Submit the completed work product and an explanation connecting it to ${section0.heading} and ${section1.heading}.`,
    },
    resources: sections.slice(0, 2).map((section, index) => ({
      type: index === 0 ? 'worksheet' : 'reference',
      title:
        index === 0
          ? `${section.heading} application worksheet`
          : `${section.heading} quick reference`,
      description: `Use the authored ${section.heading} material while completing ${input.lessonTitle}.`,
      content: section.body,
    })),
    glossary: glossary.slice(0, 8),
    remediation: {
      passingScore: 80,
      reviewMessage: `Return to the named ${input.lessonTitle} reading section, review its flashcards, complete the applied exercise, and retry the mapped check.`,
      objectiveMap: objectives.slice(0, 3),
      targetedActions: objectives.slice(0, 3).map((objective, index) => ({
        objective,
        action: `Review ${sections[index % sections.length]?.heading ?? section0.heading}, replay its narrated clip, complete the lesson exercise, and retry the objective-aligned question.`,
      })),
    },
    readiness: {
      domainKey: input.domainKey,
      masteryThreshold: 80,
      evidenceSignals: [
        `${input.lessonTitle} knowledge-check mastery`,
        `${input.lessonTitle} exercise completion`,
        `${input.lessonTitle} practical evidence`,
      ],
    },
  });

  return { experience, objectives, questions, learningPoints: objectives.slice(0, 5) };
}

function lessonContentRecord(content: unknown): Record<string, any> {
  if (content && typeof content === 'object' && !Array.isArray(content))
    return content as Record<string, any>;
  if (typeof content !== 'string') return {};
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
  } catch {
    return { html: content };
  }
  return {};
}

function compileBlueprintLesson(
  courseTitle: string,
  courseModule: BlueprintModule,
  lesson: BlueprintLessonRef,
): BlueprintLessonRef {
  const content = lessonContentRecord(lesson.content);
  const html = clean(content.html ?? content.content ?? content.body);
  let compiled: ReturnType<typeof compileAuthoredLessonExperience>;
  try {
    compiled = compileAuthoredLessonExperience({
      courseTitle,
      moduleTitle: courseModule.title,
      lessonTitle: lesson.title,
      lessonSlug: lesson.slug,
      domainKey: clean(lesson.domainKey ?? courseModule.domainKey) || courseModule.slug,
      html,
      learningObjectives: lesson.learningObjectives ?? [lesson.objective].filter(Boolean),
      quizQuestions: lesson.quizQuestions,
      keyTerms: content.key_terms ?? content.keyTerms,
      existingExperience: content.experience,
    });
  } catch (error) {
    throw new Error(
      `${courseModule.title} / ${lesson.title}: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
  const objective = lesson.objective ?? compiled.objectives[0];
  return {
    ...lesson,
    stepType: inferStepType(lesson.slug),
    ...(objective ? { objective } : {}),
    learningObjectives: compiled.objectives,
    content: JSON.stringify({
      ...content,
      html,
      learning_points: compiled.learningPoints,
      experience: compiled.experience,
    }),
    quizQuestions: compiled.questions.map((question, index) => ({
      id: question.id ?? `${lesson.slug}-q${index + 1}`,
      question: question.question,
      options: question.options,
      correctAnswer: Number(question.correctAnswer),
      explanation: question.explanation,
      domainKey: question.domainKey,
      competencyKeys: question.competencyKeys,
    })) as BlueprintQuizQuestion[],
    script: compiled.experience.narrationScript,
    scriptText: compiled.experience.narrationScript,
    bulletPoints: compiled.learningPoints,
    aiGenerated: false,
  };
}

export function buildAuthoredCoursePackage(
  blueprint: CredentialBlueprint,
  courseTitle: string,
): CredentialBlueprint {
  return {
    ...blueprint,
    modules: blueprint.modules.map((courseModule) => ({
      ...courseModule,
      lessons: (courseModule.lessons ?? []).map((lesson) =>
        compileBlueprintLesson(courseTitle, courseModule, lesson),
      ),
    })),
  };
}
