import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase admin client
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { auditCourseForPublish } from '@/lib/services/course-publish-auditor';
import { createAdminClient } from '@/lib/supabase/admin';

// ── DB mock builder ────────────────────────────────────────────────────────────

function buildMockDb(overrides: Record<string, any> = {}) {
  const defaults: Record<string, any> = {
    courses: { data: { id: 'course-1', title: 'Test Course', slug: 'test-course', description: 'A description', status: 'draft' }, error: null },
    course_modules: { data: [{ id: 'mod-1', title: 'Module 1', order_index: 0 }], error: null },
    course_lessons: { data: [
      { id: 'lesson-1', slug: 'lesson-1', title: 'Intro', lesson_type: 'reading', order_index: 0, module_id: 'mod-1', passing_score: null, quiz_questions: null, content: 'Some content here that is long enough', content_structured: null, video_file: null, video_transcript: null, video_runtime_seconds: 0, requires_evidence: false, requires_signoff: false, requires_evaluator: false, is_required: true },
    ], error: null },
    course_objectives: { data: [{ id: 'obj-1' }], error: null },
    module_objectives: { data: [{ module_id: 'mod-1' }], error: null },
    lesson_objectives: { data: [{ lesson_id: 'lesson-1' }], error: null },
    module_competencies: { data: [{ module_id: 'mod-1' }], error: null },
    lesson_competency_map: { data: [], error: null },
    practical_requirements: { data: [], error: null },
    module_completion_rules: { data: [], error: null },
    course_accreditation_metadata: { data: null, error: null },
  };

  const merged = { ...defaults, ...overrides };

  const makeQuery = (table: string) => {
    const result = merged[table] ?? { data: [], error: null };
    const q: any = {
      select: () => q,
      eq: () => q,
      in: () => q,
      order: () => q,
      maybeSingle: () => Promise.resolve(result),
      then: (resolve: any) => Promise.resolve(result).then(resolve),
    };
    // Make it thenable for direct await
    Object.defineProperty(q, Symbol.toStringTag, { value: 'Promise' });
    return q;
  };

  return {
    from: (table: string) => makeQuery(table),
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('auditCourseForPublish', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns fatal COURSE_NOT_FOUND when course does not exist', async () => {
    (createAdminClient as any).mockReturnValue(buildMockDb({
      courses: { data: null, error: null },
    }));

    const audit = await auditCourseForPublish('nonexistent-id');
    expect(audit.publishable).toBe(false);
    expect(audit.issues.some(i => i.code === 'COURSE_NOT_FOUND')).toBe(true);
  });

  it('returns fatal COURSE_NO_TITLE when title is missing', async () => {
    (createAdminClient as any).mockReturnValue(buildMockDb({
      courses: { data: { id: 'c1', title: '', slug: 'test', description: 'desc', status: 'draft' }, error: null },
    }));

    const audit = await auditCourseForPublish('c1');
    expect(audit.publishable).toBe(false);
    expect(audit.issues.some(i => i.code === 'COURSE_NO_TITLE')).toBe(true);
  });

  it('returns blocking COURSE_NO_OBJECTIVES when no objectives', async () => {
    (createAdminClient as any).mockReturnValue(buildMockDb({
      course_objectives: { data: [], error: null },
    }));

    const audit = await auditCourseForPublish('course-1');
    expect(audit.publishable).toBe(false);
    expect(audit.issues.some(i => i.code === 'COURSE_NO_OBJECTIVES')).toBe(true);
  });

  it('returns fatal VIDEO_NO_FILE for video lesson without video_file', async () => {
    (createAdminClient as any).mockReturnValue(buildMockDb({
      course_lessons: { data: [
        { id: 'l1', slug: 'l1', title: 'Video Lesson', lesson_type: 'video', order_index: 0, module_id: 'mod-1', passing_score: null, quiz_questions: null, content: 'content', content_structured: null, video_file: null, video_transcript: 'transcript', video_runtime_seconds: 300, requires_evidence: false, requires_signoff: false, requires_evaluator: false, is_required: true },
      ], error: null },
    }));

    const audit = await auditCourseForPublish('course-1');
    expect(audit.publishable).toBe(false);
    expect(audit.issues.some(i => i.code === 'VIDEO_NO_FILE')).toBe(true);
  });

  it('returns blocking VIDEO_NO_TRANSCRIPT for video lesson without transcript', async () => {
    (createAdminClient as any).mockReturnValue(buildMockDb({
      course_lessons: { data: [
        { id: 'l1', slug: 'l1', title: 'Video Lesson', lesson_type: 'video', order_index: 0, module_id: 'mod-1', passing_score: null, quiz_questions: null, content: 'content', content_structured: null, video_file: '/videos/test.mp4', video_transcript: '', video_runtime_seconds: 300, requires_evidence: false, requires_signoff: false, requires_evaluator: false, is_required: true },
      ], error: null },
    }));

    const audit = await auditCourseForPublish('course-1');
    expect(audit.publishable).toBe(false);
    expect(audit.issues.some(i => i.code === 'VIDEO_NO_TRANSCRIPT')).toBe(true);
  });

  it('returns fatal ASSESSMENT_NO_QUESTIONS for checkpoint without quiz_questions', async () => {
    (createAdminClient as any).mockReturnValue(buildMockDb({
      course_lessons: { data: [
        { id: 'l1', slug: 'l1', title: 'Checkpoint', lesson_type: 'checkpoint', order_index: 0, module_id: 'mod-1', passing_score: 70, quiz_questions: [], content: 'content', content_structured: null, video_file: null, video_transcript: null, video_runtime_seconds: 0, requires_evidence: false, requires_signoff: false, requires_evaluator: false, is_required: true },
      ], error: null },
    }));

    const audit = await auditCourseForPublish('course-1');
    expect(audit.publishable).toBe(false);
    expect(audit.issues.some(i => i.code === 'ASSESSMENT_NO_QUESTIONS')).toBe(true);
  });

  it('returns blocking PRACTICAL_NO_EVIDENCE_FLAG for lab without requires_evidence', async () => {
    (createAdminClient as any).mockReturnValue(buildMockDb({
      course_lessons: { data: [
        { id: 'l1', slug: 'l1', title: 'Lab', lesson_type: 'lab', order_index: 0, module_id: 'mod-1', passing_score: null, quiz_questions: null, content: 'Lab instructions here that are long enough to pass the check', content_structured: null, video_file: null, video_transcript: null, video_runtime_seconds: 0, requires_evidence: false, requires_signoff: false, requires_evaluator: false, is_required: true },
      ], error: null },
    }));

    const audit = await auditCourseForPublish('course-1');
    expect(audit.publishable).toBe(false);
    expect(audit.issues.some(i => i.code === 'PRACTICAL_NO_EVIDENCE_FLAG')).toBe(true);
  });

  it('returns blocking MODULE_NO_OBJECTIVES when module has no objectives', async () => {
    (createAdminClient as any).mockReturnValue(buildMockDb({
      module_objectives: { data: [], error: null },
    }));

    const audit = await auditCourseForPublish('course-1');
    expect(audit.publishable).toBe(false);
    expect(audit.issues.some(i => i.code === 'MODULE_NO_OBJECTIVES')).toBe(true);
  });

  it('returns blocking MODULE_NO_COMPLETION_RULE when multi-module course lacks rules', async () => {
    (createAdminClient as any).mockReturnValue(buildMockDb({
      course_modules: { data: [
        { id: 'mod-1', title: 'Module 1', order_index: 0 },
        { id: 'mod-2', title: 'Module 2', order_index: 1 },
      ], error: null },
      course_lessons: { data: [
        { id: 'l1', slug: 'l1', title: 'Lesson 1', lesson_type: 'reading', order_index: 0, module_id: 'mod-1', passing_score: null, quiz_questions: null, content: 'Content here that is long enough', content_structured: null, video_file: null, video_transcript: null, video_runtime_seconds: 0, requires_evidence: false, requires_signoff: false, requires_evaluator: false, is_required: true },
        { id: 'l2', slug: 'l2', title: 'Lesson 2', lesson_type: 'reading', order_index: 1, module_id: 'mod-2', passing_score: null, quiz_questions: null, content: 'Content here that is long enough', content_structured: null, video_file: null, video_transcript: null, video_runtime_seconds: 0, requires_evidence: false, requires_signoff: false, requires_evaluator: false, is_required: true },
      ], error: null },
      module_objectives: { data: [{ module_id: 'mod-1' }, { module_id: 'mod-2' }], error: null },
      module_competencies: { data: [{ module_id: 'mod-1' }, { module_id: 'mod-2' }], error: null },
      lesson_objectives: { data: [{ lesson_id: 'l1' }, { lesson_id: 'l2' }], error: null },
      module_completion_rules: { data: [], error: null },
    }));

    const audit = await auditCourseForPublish('course-1');
    expect(audit.publishable).toBe(false);
    expect(audit.issues.some(i => i.code === 'MODULE_NO_COMPLETION_RULE')).toBe(true);
  });

  it('issues array contains severity for every issue', async () => {
    (createAdminClient as any).mockReturnValue(buildMockDb({
      courses: { data: { id: 'c1', title: '', slug: '', description: '', status: 'draft' }, error: null },
    }));

    const audit = await auditCourseForPublish('c1');
    for (const issue of audit.issues) {
      expect(['fatal', 'blocking', 'warning']).toContain(issue.severity);
      expect(issue.code).toBeTruthy();
      expect(issue.message).toBeTruthy();
    }
  });
});
