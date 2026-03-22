/**
 * tests/unit/lesson-save-api-validation.test.ts
 *
 * Integration-style tests for the lesson save API route.
 * Proves that invalid payloads are rejected at the API layer
 * even when client-side validation is bypassed.
 *
 * These tests mock the DB but exercise the full route handler logic,
 * including the normalizeLessonType call and the multi-table write path.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/admin/guards', () => ({
  apiRequireAdmin: vi.fn().mockResolvedValue({ user: { id: 'admin-1' }, error: null }),
}));

vi.mock('@/lib/api/withRateLimit', () => ({
  applyRateLimit: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { createAdminClient } from '@/lib/supabase/admin';
import { PATCH } from '@/app/api/admin/lessons/[id]/route';

// ── DB mock ────────────────────────────────────────────────────────────────────

function buildMockDb(lessonExists = true) {
  const mockQuery: any = {
    select: () => mockQuery,
    eq:     () => mockQuery,
    update: () => mockQuery,
    upsert: () => mockQuery,
    insert: () => mockQuery,
    delete: () => mockQuery,
    in:     () => mockQuery,
    single: () => Promise.resolve({ data: { id: 'lesson-1', course_id: 'course-1' }, error: null }),
    maybeSingle: () => Promise.resolve(
      lessonExists
        ? { data: { id: 'lesson-1', course_id: 'course-1' }, error: null }
        : { data: null, error: null }
    ),
    then: (resolve: any) => Promise.resolve({ data: null, error: null }).then(resolve),
  };
  return { from: () => mockQuery };
}

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/admin/lessons/lesson-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const PARAMS = { params: Promise.resolve({ id: 'lesson-1' }) };

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('PATCH /api/admin/lessons/[id] — write path verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (createAdminClient as any).mockReturnValue(buildMockDb(true));
  });

  it('returns 404 when lesson does not belong to the given courseId', async () => {
    (createAdminClient as any).mockReturnValue(buildMockDb(false));
    const req = makeRequest({ courseId: 'wrong-course', title: 'Test' });
    const res = await PATCH(req as any, PARAMS as any);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it('returns 400 when courseId is missing', async () => {
    const req = makeRequest({ title: 'Test' });
    const res = await PATCH(req as any, PARAMS as any);
    expect(res.status).toBe(400);
  });

  it('normalizes legacy lesson type "lesson" to "reading"', async () => {
    let capturedPatch: Record<string, unknown> = {};
    const mockDb: any = {
      from: () => ({
        select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { id: 'lesson-1', course_id: 'course-1' }, error: null }) }) }) }),
        update: (patch: Record<string, unknown>) => {
          capturedPatch = patch;
          return { eq: () => Promise.resolve({ error: null }) };
        },
        delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
        insert: () => Promise.resolve({ error: null }),
      }),
    };
    (createAdminClient as any).mockReturnValue(mockDb);

    const req = makeRequest({ courseId: 'course-1', lessonType: 'lesson' });
    const res = await PATCH(req as any, PARAMS as any);
    expect(res.status).toBe(200);
    expect(capturedPatch.lesson_type).toBe('reading');
  });

  it('normalizes legacy lesson type "exam" to "final_exam"', async () => {
    let capturedPatch: Record<string, unknown> = {};
    const mockDb: any = {
      from: () => ({
        select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { id: 'lesson-1', course_id: 'course-1' }, error: null }) }) }) }),
        update: (patch: Record<string, unknown>) => {
          capturedPatch = patch;
          return { eq: () => Promise.resolve({ error: null }) };
        },
        delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
        insert: () => Promise.resolve({ error: null }),
      }),
    };
    (createAdminClient as any).mockReturnValue(mockDb);

    const req = makeRequest({ courseId: 'course-1', lessonType: 'exam' });
    const res = await PATCH(req as any, PARAMS as any);
    expect(res.status).toBe(200);
    expect(capturedPatch.lesson_type).toBe('final_exam');
  });

  it('writes objectives to lesson_objectives table', async () => {
    const insertedTables: string[] = [];
    const deletedTables: string[] = [];
    const mockDb: any = {
      from: (table: string) => ({
        select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { id: 'lesson-1', course_id: 'course-1' }, error: null }) }) }) }),
        update: () => ({ eq: () => Promise.resolve({ error: null }) }),
        delete: () => { deletedTables.push(table); return { eq: () => Promise.resolve({ error: null }) }; },
        insert: (rows: unknown) => { insertedTables.push(table); return Promise.resolve({ error: null }); },
      }),
    };
    (createAdminClient as any).mockReturnValue(mockDb);

    const req = makeRequest({
      courseId: 'course-1',
      objectives: ['Identify key concepts', 'Apply techniques'],
    });
    const res = await PATCH(req as any, PARAMS as any);
    expect(res.status).toBe(200);
    expect(deletedTables).toContain('lesson_objectives');
    expect(insertedTables).toContain('lesson_objectives');
  });

  it('writes competency codes to lesson_competency_map table', async () => {
    const insertedTables: string[] = [];
    const deletedTables: string[] = [];
    const mockDb: any = {
      from: (table: string) => ({
        select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { id: 'lesson-1', course_id: 'course-1' }, error: null }) }) }) }),
        update: () => ({ eq: () => Promise.resolve({ error: null }) }),
        delete: () => { deletedTables.push(table); return { eq: () => Promise.resolve({ error: null }) }; },
        insert: () => { insertedTables.push(table); return Promise.resolve({ error: null }); },
      }),
    };
    (createAdminClient as any).mockReturnValue(mockDb);

    const req = makeRequest({
      courseId: 'course-1',
      competencyCodes: ['HVAC-001', 'HVAC-002'],
    });
    const res = await PATCH(req as any, PARAMS as any);
    expect(res.status).toBe(200);
    expect(deletedTables).toContain('lesson_competency_map');
    expect(insertedTables).toContain('lesson_competency_map');
  });

  it('upserts practical_requirements when practical data is provided', async () => {
    const upsertedTables: string[] = [];
    const mockDb: any = {
      from: (table: string) => ({
        select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { id: 'lesson-1', course_id: 'course-1' }, error: null }) }) }) }),
        update: () => ({ eq: () => Promise.resolve({ error: null }) }),
        delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
        insert: () => Promise.resolve({ error: null }),
        upsert: () => { upsertedTables.push(table); return Promise.resolve({ error: null }); },
      }),
    };
    (createAdminClient as any).mockReturnValue(mockDb);

    const req = makeRequest({
      courseId: 'course-1',
      practical: { requiredHours: 8, requiresEvaluatorApproval: true },
      practicalInstructions: 'Complete the lab exercise.',
    });
    const res = await PATCH(req as any, PARAMS as any);
    expect(res.status).toBe(200);
    expect(upsertedTables).toContain('practical_requirements');
  });

  it('returns 200 with success:true on valid save', async () => {
    const req = makeRequest({ courseId: 'course-1', title: 'Updated Title' });
    const res = await PATCH(req as any, PARAMS as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.lessonId).toBe('lesson-1');
  });
});

describe('validateLessonSave — client-side mirrors DB constraints', () => {
  it('rejects video lesson without video_file', async () => {
    const { validateLessonSave } = await import('@/lib/curriculum/validate-lesson-save');
    const errors = validateLessonSave({
      title: 'Video Lesson', lessonType: 'video',
      videoFile: '', videoTranscript: 'transcript', videoRuntime: 300,
      passingScore: 70, quizQuestions: [], requiresEvidence: false,
      practicalInstructions: '', objectives: ['Obj 1'],
    });
    expect(errors.some(e => e.includes('video file'))).toBe(true);
  });

  it('rejects video lesson without transcript', async () => {
    const { validateLessonSave } = await import('@/lib/curriculum/validate-lesson-save');
    const errors = validateLessonSave({
      title: 'Video Lesson', lessonType: 'video',
      videoFile: '/videos/test.mp4', videoTranscript: '', videoRuntime: 300,
      passingScore: 70, quizQuestions: [], requiresEvidence: false,
      practicalInstructions: '', objectives: ['Obj 1'],
    });
    expect(errors.some(e => e.includes('transcript'))).toBe(true);
  });

  it('rejects video lesson with runtime = 0', async () => {
    const { validateLessonSave } = await import('@/lib/curriculum/validate-lesson-save');
    const errors = validateLessonSave({
      title: 'Video Lesson', lessonType: 'video',
      videoFile: '/videos/test.mp4', videoTranscript: 'transcript', videoRuntime: 0,
      passingScore: 70, quizQuestions: [], requiresEvidence: false,
      practicalInstructions: '', objectives: ['Obj 1'],
    });
    expect(errors.some(e => e.includes('runtime'))).toBe(true);
  });

  it('rejects assessment lesson without passing score', async () => {
    const { validateLessonSave } = await import('@/lib/curriculum/validate-lesson-save');
    const errors = validateLessonSave({
      title: 'Quiz', lessonType: 'quiz',
      videoFile: '', videoTranscript: '', videoRuntime: 0,
      passingScore: 0, quizQuestions: [{ id: 'q1' }], requiresEvidence: false,
      practicalInstructions: '', objectives: ['Obj 1'],
    });
    expect(errors.some(e => e.includes('passing score'))).toBe(true);
  });

  it('rejects assessment lesson without questions', async () => {
    const { validateLessonSave } = await import('@/lib/curriculum/validate-lesson-save');
    const errors = validateLessonSave({
      title: 'Checkpoint', lessonType: 'checkpoint',
      videoFile: '', videoTranscript: '', videoRuntime: 0,
      passingScore: 70, quizQuestions: [], requiresEvidence: false,
      practicalInstructions: '', objectives: ['Obj 1'],
    });
    expect(errors.some(e => e.includes('question'))).toBe(true);
  });

  it('rejects practical lesson without evidence enabled', async () => {
    const { validateLessonSave } = await import('@/lib/curriculum/validate-lesson-save');
    const errors = validateLessonSave({
      title: 'Lab', lessonType: 'lab',
      videoFile: '', videoTranscript: '', videoRuntime: 0,
      passingScore: 0, quizQuestions: [], requiresEvidence: false,
      practicalInstructions: 'Do the lab.', objectives: ['Obj 1'],
    });
    expect(errors.some(e => e.includes('evidence'))).toBe(true);
  });

  it('rejects practical lesson without instructions', async () => {
    const { validateLessonSave } = await import('@/lib/curriculum/validate-lesson-save');
    const errors = validateLessonSave({
      title: 'Practicum', lessonType: 'practicum',
      videoFile: '', videoTranscript: '', videoRuntime: 0,
      passingScore: 0, quizQuestions: [], requiresEvidence: true,
      practicalInstructions: '', objectives: ['Obj 1'],
    });
    expect(errors.some(e => e.includes('instructions'))).toBe(true);
  });

  it('rejects any lesson without objectives (except certification)', async () => {
    const { validateLessonSave } = await import('@/lib/curriculum/validate-lesson-save');
    const errors = validateLessonSave({
      title: 'Reading', lessonType: 'reading',
      videoFile: '', videoTranscript: '', videoRuntime: 0,
      passingScore: 0, quizQuestions: [], requiresEvidence: false,
      practicalInstructions: '', objectives: [],
    });
    expect(errors.some(e => e.includes('objective'))).toBe(true);
  });

  it('allows certification lesson without objectives', async () => {
    const { validateLessonSave } = await import('@/lib/curriculum/validate-lesson-save');
    const errors = validateLessonSave({
      title: 'Certificate', lessonType: 'certification',
      videoFile: '', videoTranscript: '', videoRuntime: 0,
      passingScore: 0, quizQuestions: [], requiresEvidence: false,
      practicalInstructions: '', objectives: [],
    });
    expect(errors).toHaveLength(0);
  });

  it('passes a fully valid video lesson', async () => {
    const { validateLessonSave } = await import('@/lib/curriculum/validate-lesson-save');
    const errors = validateLessonSave({
      title: 'Video Lesson', lessonType: 'video',
      videoFile: '/videos/module-1.mp4', videoTranscript: 'Full transcript here.',
      videoRuntime: 300, passingScore: 0, quizQuestions: [], requiresEvidence: false,
      practicalInstructions: '', objectives: ['Identify key concepts'],
    });
    expect(errors).toHaveLength(0);
  });
});
