import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  normalizeManualAssessmentQuestions,
  toQuizQuestion,
} from '@/lib/course-builder/assessment-generator';
import { assessmentQuestionIssues } from '@/lib/course-builder/assessment-validation';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('canonical Course Builder assessment authoring', () => {
  it('normalizes manually authored multiple-choice questions with course mappings', () => {
    const [question] = normalizeManualAssessmentQuestions('lesson-1', [{
      id: 'q1',
      prompt: 'Which action protects a client record before it is shared?',
      type: 'multiple_choice',
      options: ['Verify authorization', 'Skip documentation', 'Use a public channel', 'Share all fields'],
      correctAnswer: 'Verify authorization',
      explanation: 'Authorization and minimum-necessary disclosure protect the record.',
    }], { domainKey: 'privacy', competencyKeys: ['privacy.verify'] });

    expect(question.correctAnswer).toBe(0);
    expect(question.domainKey).toBe('privacy');
    expect(question.competencyKey).toBe('privacy.verify');
    expect(toQuizQuestion(question)).toMatchObject({
      question: question.prompt,
      correctAnswer: 0,
    });
  });

  it('normalizes true/false answers into the learner projection', () => {
    const [question] = normalizeManualAssessmentQuestions('lesson-1', [{
      prompt: 'A learner may disclose protected information without checking authorization.',
      type: 'true_false',
      correctAnswer: false,
      explanation: 'Authorization must be verified before disclosure.',
    }], { domainKey: 'privacy' });

    expect(question.choices).toEqual(['True', 'False']);
    expect(toQuizQuestion(question)?.correctAnswer).toBe(1);
  });

  it('rejects duplicated options and answers that do not match an option', () => {
    expect(() => normalizeManualAssessmentQuestions('lesson-1', [{
      prompt: 'Choose the valid response.',
      type: 'multiple_choice',
      options: ['Same', 'Same'],
      correctAnswer: 'Different',
    }])).toThrow(/duplicate answer options/i);

    expect(() => normalizeManualAssessmentQuestions('lesson-1', [{
      prompt: 'Choose the valid response.',
      type: 'multiple_choice',
      options: ['One', 'Two'],
      correctAnswer: 'Three',
    }])).toThrow(/does not match an option/i);
  });

  it('blocks placeholder and structurally invalid questions at publication', () => {
    expect(assessmentQuestionIssues({
      id: 'q1',
      prompt: 'TODO placeholder question',
      type: 'multiple_choice',
      options: ['A', 'A'],
      correctAnswer: 'B',
    }, 0)).toEqual(expect.arrayContaining([
      'question 1 contains placeholder text',
      'question 1 options are duplicated',
      'question 1 correct answer does not match an option',
      'question 1 rationale missing',
      'question 1 standards/competency mapping missing',
    ]));
  });

  it('accepts the learner runtime projection with a numeric answer index', () => {
    expect(assessmentQuestionIssues({
      id: 'q1',
      question: 'Which action is correct?',
      prompt: 'Which action is correct?',
      type: 'multiple_choice',
      options: ['Verify', 'Guess'],
      correctAnswer: 0,
      explanation: 'Verification is the required action.',
      domainKey: 'privacy',
    }, 0)).toEqual([]);
  });

  it('replaces canonical rows and learner projection in one service-role RPC', () => {
    const generator = read('lib/course-builder/assessment-generator.ts');
    const migration = read('supabase/migrations/20260922061824_replace_lesson_assessment_questions.sql');
    expect(generator).toContain("'replace_lesson_assessment_questions'");
    expect(generator).not.toContain('JSON.stringify(question.choices)');
    expect(migration).toContain('for update');
    expect(migration).toContain('delete from public.assessment_questions');
    expect(migration).toContain('update public.course_lessons');
    expect(migration).toContain('from public, anon, authenticated');
    expect(migration).toContain('to service_role');
  });

  it('exposes manual save and AI hydration through canonical Course Builder routes', () => {
    const route = read('apps/admin/app/api/admin/course-builder/route.ts');
    const hydrate = read('apps/admin/app/api/admin/course-builder/hydrate/route.ts');
    expect(route).toContain("'save-assessment'");
    expect(route).toContain('normalizeManualAssessmentQuestions');
    expect(hydrate).toContain('questions: result.questions.map(toQuizQuestion)');
    expect(hydrate).toContain('{ status: result.errors.length ? 422 : 200 }');
  });

  it('uses automated course-content acceptance while retaining practical learner sign-off', () => {
    const publishPanel = read('components/studio/panels/PublishPanel.tsx');
    const agentPanel = read('components/studio/AgenticCourseRunPanel.tsx');
    const gate = read('lib/course-builder/persisted-publish-service.ts');
    expect(publishPanel).toContain('no human course-content review required');
    expect(publishPanel).not.toContain('Submit course for review');
    expect(agentPanel).toContain('publishes without waiting for human course-content review');
    expect(gate).toContain('authorized human sign-off missing for practical competency');
  });
});
