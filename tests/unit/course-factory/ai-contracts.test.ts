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
  content: `<h2>Procedure</h2>${'Follow the documented workforce procedure and verify each required control before continuing. '.repeat(12)}`.trim(),
  quiz_questions: [validQuestion],
};

describe('Course Factory AI contracts', () => {
  it('accepts a valid lesson contract', () => {
    expect(
      parseStrictAIJson(JSON.stringify(validLesson), generatedLessonContentSchema, 'lesson'),
    ).toEqual(validLesson);
  });

  it('rejects markdown-wrapped JSON', () => {
    expect(() =>
      parseStrictAIJson(`\`\`\`json\n${JSON.stringify(validLesson)}\n\`\`\``, generatedLessonContentSchema, 'lesson'),
    ).toThrow(/markdown/i);
  });

  it('rejects malformed JSON', () => {
    expect(() => parseStrictAIJson('{"objective":', generatedLessonContentSchema, 'lesson')).toThrow(
      /malformed JSON/i,
    );
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
