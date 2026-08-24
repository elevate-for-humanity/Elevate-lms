import { describe, expect, it } from 'vitest';
import {
  generatedAssessmentSchema,
  generatedBlueprintSchema,
  generatedLessonContentSchema,
  parseStrictAIJson,
} from '../../../lib/course-factory/ai-contracts';

const validQuestion = {
  question: 'What should the learner do first?',
  options: ['Inspect the workstation', 'Skip inspection', 'Guess', 'Leave'],
  correct: 0,
  explanation: 'Inspection is the required first step.',
};

const validLesson = {
  objective: 'Demonstrate the required workplace procedure safely.',
  learning_points: [
    'Inspect the work area before beginning the procedure.',
    'Follow the documented sequence without skipping required controls.',
    'Document completion and report any exception immediately.',
  ],
  scenario:
    'A learner arrives for a scheduled shift and notices that the normal work area has been rearranged after maintenance. The supervisor asks the learner to begin immediately because the team is behind schedule. The learner must decide how to verify the environment, identify hazards, follow the documented procedure, communicate delays, and record the completed work without bypassing required controls or creating a new safety risk for coworkers.',
  content:
    `<h2>Procedure</h2>${'Follow the documented workforce procedure and verify each required control before continuing. '.repeat(12)}`.trim(),
  quiz_questions: [
    validQuestion,
    {
      ...validQuestion,
      question: 'What verifies the learner followed the required procedure?',
    },
    {
      ...validQuestion,
      question: 'When should the learner report an exception?',
    },
  ],
  experience: {
    readingGuide: {
      title: 'Verified workplace procedure reading guide',
      summary:
        'Use this guide to inspect the work area, follow every documented control, record evidence, and report exceptions before they create a safety or quality risk.',
      sections: [
        {
          heading: 'Inspect before work begins',
          body: 'Inspect the complete work area before beginning. Confirm that equipment, materials, safeguards, and documentation match the approved procedure. Record any change and stop when a required control cannot be verified. '.repeat(2).trim(),
        },
        {
          heading: 'Follow the controlled sequence',
          body: 'Complete each step in the documented order and use the named evidence to verify the result. Do not skip a control because the team is behind schedule or because the work appears routine. '.repeat(2).trim(),
        },
        {
          heading: 'Document and report results',
          body: 'Document completion, identify the evidence reviewed, and report every exception to the responsible supervisor. A complete record protects the learner, coworkers, and the organization. '.repeat(2).trim(),
        },
      ],
      keyTakeaways: ['Inspect first', 'Follow every control', 'Document and report exceptions'],
    },
    narrationScript:
      'The instructor explains the exact workplace procedure, shows how to inspect the environment, names the evidence the learner must record, demonstrates the required controls, and closes by connecting a safe result to the lesson objective and applied practice.',
    visualPrompt:
      'Bright Elevate workforce visual showing the learner inspecting a real workstation, documenting evidence, completing the procedure, and verifying the result.',
    flashcards: Array.from({ length: 6 }, (_, index) => ({
      id: `card-${index + 1}`,
      front: `Procedure term ${index + 1}`,
      back: `Lesson-specific explanation ${index + 1}`,
      tags: ['procedure'],
    })),
    quickClips: [
      {
        id: 'clip-1',
        title: 'Inspect the work area',
        objective: 'Verify every required control before work begins.',
        durationSeconds: 180,
        script: 'The learner inspects equipment, materials, safeguards, and documentation before beginning work. The learner records any changed condition and stops when a required control cannot be verified. '.repeat(2).trim(),
        visualPrompt: 'Show a learner inspecting a realistic workstation and recording visible safety evidence before beginning the procedure.',
      },
      {
        id: 'clip-2',
        title: 'Record and report exceptions',
        objective: 'Document the completed procedure and escalate every exception.',
        durationSeconds: 180,
        script: 'The learner completes the documented sequence, verifies the result with the required evidence, and records completion. Any exception is reported to the responsible supervisor before work continues. '.repeat(2).trim(),
        visualPrompt: 'Show a learner completing a procedure record and reporting a documented exception to a workplace supervisor.',
      },
    ],
    knowledgeChecks: [validQuestion, { ...validQuestion }, { ...validQuestion }],
    scenario: {
      title: 'Rearranged workstation',
      context: 'The workstation changed after maintenance and must be inspected before use.',
      question: 'What should the learner do first?',
      options: [
        { text: 'Inspect and document', isCorrect: true, feedback: 'Correct.' },
        { text: 'Begin without checking', isCorrect: false, feedback: 'Review the inspection rule.' },
      ],
    },
    caseStudy: {
      title: 'Procedure evidence review',
      context: 'The record shows a missed control and an unexplained exception.',
      question: 'Which conclusion is supported?',
      options: [
        { text: 'Correct the missing control', isCorrect: true, feedback: 'Correct.' },
        { text: 'Ignore the record', isCorrect: false, feedback: 'The evidence must be resolved.' },
      ],
    },
    exercises: [
      {
        id: 'procedure-review',
        title: 'Verify a workplace procedure',
        instructions: ['Inspect the work area and identify required controls.', 'Complete the sequence and document supporting evidence.'],
        expectedArtifact: 'A completed procedure checklist with an exception record.',
        autoGrade: {
          type: 'checklist' as const,
          criteria: ['Every required control and evidence item is documented.'],
        },
      },
    ],
    practicalTask: {
      title: 'Complete the procedure',
      description: 'Produce a verified workplace procedure record.',
      instructions: ['Inspect the area', 'Complete the sequence', 'Verify and document the result'],
      evidence: 'Completed checklist and exception record.',
    },
    resources: [
      {
        type: 'worksheet' as const,
        title: 'Procedure verification worksheet',
        description: 'Record each required control, the evidence reviewed, and any exception.',
        content: 'Control checked; evidence reviewed; result verified; exception reported; supervisor response documented.',
      },
      {
        type: 'reference' as const,
        title: 'Exception reporting reference',
        description: 'Use this reference when a required control cannot be verified.',
        content: 'Stop the procedure, protect the work area, document the condition, and notify the responsible supervisor.',
      },
    ],
    glossary: [
      { term: 'Control', definition: 'A required safeguard or verification step.' },
      { term: 'Evidence', definition: 'A record or observation that verifies completion.' },
      { term: 'Exception', definition: 'A condition that differs from the approved procedure.' },
      { term: 'Escalation', definition: 'Reporting an exception to the responsible authority.' },
    ],
    remediation: {
      passingScore: 80,
      reviewMessage: 'Review the missed control and retry.',
      objectiveMap: ['Inspection', 'Sequence', 'Documentation'],
      targetedActions: [
        { objective: 'Inspection', action: 'Review the inspection section and repeat the verification exercise.' },
      ],
    },
    readiness: {
      domainKey: 'workplace-procedure',
      masteryThreshold: 80,
      evidenceSignals: ['knowledge-check mastery', 'exercise completion', 'verified practical task'],
    },
  },
};

describe('Course Factory AI contracts', () => {
  it('accepts a valid lesson contract', () => {
    expect(
      parseStrictAIJson(JSON.stringify(validLesson), generatedLessonContentSchema, 'lesson'),
    ).toEqual(validLesson);
  });

  it('rejects markdown-wrapped JSON', () => {
    expect(() =>
      parseStrictAIJson(
        `\`\`\`json\n${JSON.stringify(validLesson)}\n\`\`\``,
        generatedLessonContentSchema,
        'lesson',
      ),
    ).toThrow(/markdown/i);
  });

  it('rejects malformed JSON', () => {
    expect(() =>
      parseStrictAIJson('{"objective":', generatedLessonContentSchema, 'lesson'),
    ).toThrow(/malformed JSON/i);
  });

  it('rejects missing required lesson data', () => {
    const invalid = { ...validLesson, objective: '' };
    expect(() =>
      parseStrictAIJson(JSON.stringify(invalid), generatedLessonContentSchema, 'lesson'),
    ).toThrow(/output contract/i);
  });

  it('rejects unexpected lesson fields', () => {
    const invalid = { ...validLesson, unexpected: true };
    expect(() =>
      parseStrictAIJson(JSON.stringify(invalid), generatedLessonContentSchema, 'lesson'),
    ).toThrow(/unrecognized|output contract/i);
  });

  it('rejects invalid answer indexes and option counts', () => {
    const invalid = {
      questions: [{ ...validQuestion, options: ['A', 'B'], correct: 4 }],
    };
    expect(() =>
      parseStrictAIJson(JSON.stringify(invalid), generatedAssessmentSchema, 'assessment'),
    ).toThrow(/output contract/i);
  });

  it('rejects blueprint slugs and step types outside the canonical contract', () => {
    const invalid = {
      title: 'Test Course',
      description: 'A workforce training test course.',
      modules: [
        {
          title: 'Module One',
          description: 'The first module.',
          lessons: [{ title: 'Lesson', slug: 'Bad Slug', stepType: 'video' }],
        },
      ],
    };
    expect(() =>
      parseStrictAIJson(JSON.stringify(invalid), generatedBlueprintSchema, 'blueprint'),
    ).toThrow(/output contract/i);
  });
});
