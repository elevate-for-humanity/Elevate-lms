import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/video/job-queue', () => ({
  createJob: vi.fn(async () => ({})),
}));

vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: vi.fn(async () => {
    throw new Error('requireAdminClient must not be called when a client is provided');
  }),
  createAdminClient: vi.fn(() => {
    throw new Error('createAdminClient must not be called in this test');
  }),
}));

import {
  AuthoredCompileError,
  upgradePersistedAuthoredCourse,
} from '@/lib/course-factory/persisted-authored-upgrade';
import { createJob } from '@/lib/video/job-queue';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const MODULE_ID = '22222222-2222-4222-8222-222222222222';

const html = `
  <h2>Foundations of the task</h2>
  <p>The learner studies the approved method before touching any equipment, checks the evidence that the method requires, and records each observation in the lesson worksheet so a reviewer can trace every decision back to the source material presented in this section of the authored lesson.</p>
  <h2>Applying the method</h2>
  <p>With the foundations in place, the learner works through a complete example, compares the result against the criteria in the first section, and corrects any step whose evidence does not match the approved method before moving on to independent practice with a new scenario.</p>
  <h2>Checking the finished work</h2>
  <p>The final check confirms that every required step was completed in order, the recorded evidence supports the outcome, and nothing was skipped or assumed. The learner signs the worksheet, notes any open questions for the instructor, and stores the completed record with the course evidence.</p>
`;

const fourOptionQuestions = [0, 1, 2].map((index) => ({
  id: `q${index + 1}`,
  question: `Which statement is correct for step ${index + 1}?`,
  options: ['Follow the approved method', 'Skip the check', 'Guess the result', 'Hide the record'],
  correctAnswer: 0,
  explanation: 'The approved method governs every step.',
}));

const threeOptionQuestions = [0, 1, 2].map((index) => ({
  id: `q${index + 1}`,
  prompt: `Which decision is correct for case ${index + 1}?`,
  question: `Which decision is correct for case ${index + 1}?`,
  options: ['Hold the task', 'Estimate and proceed', 'Ask a peer'],
  correctAnswer: 0,
  explanation: 'Approved information governs the decision.',
}));

function makeLesson(overrides: Record<string, any>) {
  return {
    id: 'lesson-id',
    course_id: COURSE_ID,
    module_id: MODULE_ID,
    title: 'Lesson',
    slug: 'lesson',
    content: { html },
    content_json: {},
    rendered_html: html,
    learning_objectives: ['Explain the method.', 'Apply the method.', 'Check the result.'],
    quiz_questions: fourOptionQuestions,
    key_terms: [],
    activities: [],
    resources: [],
    video_url: null,
    video_config: {},
    lesson_type: 'lesson',
    domain_key: 'operations',
    approved: true,
    is_published: false,
    order_index: 1,
    script_text: null,
    script: null,
    bullet_points: [],
    scene_data: null,
    ...overrides,
  };
}

const goodLesson = makeLesson({ id: 'lesson-good', slug: 'good-lesson', title: 'Good Lesson' });
const threeOptionLesson = makeLesson({
  id: 'lesson-three-option',
  slug: 'three-option-lesson',
  title: 'Three Option Lesson',
  quiz_questions: threeOptionQuestions,
});
const badLesson = makeLesson({
  id: 'lesson-bad',
  slug: 'bad-lesson',
  title: 'Bad Lesson',
  quiz_questions: null,
});

function makeFakeDb(lessons: Array<Record<string, any>>) {
  const rpcCalls: Array<{ name: string; args: any }> = [];
  const course = { id: COURSE_ID, title: 'Partial Compile Course', slug: 'partial-compile-course', program_id: null };
  const modules = [{ id: MODULE_ID, title: 'Module One', slug: 'module-one', domain_key: 'operations', order_index: 1 }];
  const from = (table: string) => {
    const rows =
      table === 'courses'
        ? [course]
        : table === 'course_modules'
          ? modules
          : table === 'course_lessons'
            ? lessons
            : [];
    const builder: any = {
      select: () => builder,
      eq: () => builder,
      order: () => builder,
      single: async () => ({ data: rows[0] ?? null, error: null }),
      maybeSingle: async () => ({ data: rows[0] ?? null, error: null }),
      then: (resolve: (value: any) => void) => resolve({ data: rows, error: null }),
    };
    return builder;
  };
  const db: any = {
    from,
    rpc: async (name: string, args: any) => {
      rpcCalls.push({ name, args });
      return { data: { success: true }, error: null };
    },
  };
  return { db, rpcCalls };
}

describe('upgradePersistedAuthoredCourse partial compile', () => {
  beforeEach(() => {
    vi.mocked(createJob).mockClear();
  });

  it('compiles the lessons that meet the standard and carries the rest untouched', async () => {
    const { db, rpcCalls } = makeFakeDb([goodLesson, badLesson, threeOptionLesson]);
    const result = await upgradePersistedAuthoredCourse(COURSE_ID, db);

    expect(result.compiledLessonCount).toBe(2);
    expect(result.repairedLessonCount).toBe(2);
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]?.slug).toBe('bad-lesson');
    expect(result.failures[0]?.error).toMatch(/at least three complete authored assessment questions/i);

    // The atomic RPC still receives one entry per persisted lesson.
    expect(rpcCalls).toHaveLength(1);
    const payload = rpcCalls[0]?.args.p_lessons as Array<Record<string, any>>;
    expect(payload).toHaveLength(3);
    const badEntry = payload.find((entry) => entry.id === 'lesson-bad');
    expect(badEntry?.content).toEqual(badLesson.content);
    expect(badEntry?.quiz_questions).toBeNull();
    const goodEntry = payload.find((entry) => entry.id === 'lesson-good');
    expect(goodEntry?.content.experience).toBeDefined();

    // Video jobs are created only for compiled lessons.
    expect(vi.mocked(createJob).mock.calls.map((call) => (call[0] as any).lesson_id).sort()).toEqual([
      'lesson-good',
      'lesson-three-option',
    ]);
  });

  it('throws one error naming every lesson reason when nothing can compile', async () => {
    const secondBad = makeLesson({
      id: 'lesson-bad-2',
      slug: 'bad-lesson-2',
      title: 'Bad Lesson Two',
      content: { html: '<p>Too short.</p>' },
      quiz_questions: null,
    });
    const { db, rpcCalls } = makeFakeDb([badLesson, secondBad]);
    const attempt = upgradePersistedAuthoredCourse(COURSE_ID, db);
    await expect(attempt).rejects.toBeInstanceOf(AuthoredCompileError);
    await expect(upgradePersistedAuthoredCourse(COURSE_ID, makeFakeDb([badLesson, secondBad]).db)).rejects.toThrow(
      /bad-lesson: .*at least three complete authored assessment questions.*bad-lesson-2: .*at least 500 characters/s,
    );
    expect(rpcCalls).toHaveLength(0);
    expect(createJob).not.toHaveBeenCalled();
  });

  it('selective repair compiles only the requested lesson and passes the rest through', async () => {
    const { db, rpcCalls } = makeFakeDb([goodLesson, badLesson]);
    const result = await upgradePersistedAuthoredCourse(COURSE_ID, db, {
      lessonIds: ['lesson-good'],
    });
    expect(result.compiledLessonCount).toBe(1);
    expect(result.failures).toHaveLength(0);
    const payload = rpcCalls[0]?.args.p_lessons as Array<Record<string, any>>;
    expect(payload).toHaveLength(2);
    expect(payload.find((entry) => entry.id === 'lesson-bad')?.content).toEqual(badLesson.content);
    expect(vi.mocked(createJob).mock.calls).toHaveLength(1);
  });
});
