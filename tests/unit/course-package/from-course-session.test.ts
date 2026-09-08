import { describe, expect, it } from 'vitest';
import { coursePackageFromSession } from '@/lib/course-package/from-course-session';
import type { CourseSession } from '@/lib/studio/course-session';

function session(): CourseSession {
  const now = '2026-09-08T00:00:00.000Z';
  return {
    course: {
      id: 'course-1', title: 'EPA 608 Core', slug: 'epa-608-core', description: 'Core preparation',
      short_description: null, status: 'draft', is_active: false, published_at: null,
      thumbnail_url: null, duration_hours: 1, total_lessons: 1, generation_status: 'completed',
      generation_progress: 100, review_status: 'pending', program_id: null, org_id: null,
      version: 1, compliance_profile_key: 'epa-608-core', governing_body: 'ESCO Institute',
      governing_standard_version: '2026', created_at: now, updated_at: now,
    },
    modules: [{
      id: 'module-1', course_id: 'course-1', title: 'Core', description: null, order_index: 1,
      slug: 'core', is_published: false, is_required: true, duration_minutes: 30,
      target_hours: 0.5, domain_key: 'core', created_at: now, updated_at: now,
    }],
    lessons: [{
      id: 'lesson-1', course_id: 'course-1', module_id: 'module-1', title: 'Clean Air Act',
      slug: 'clean-air-act', lesson_type: 'lesson', order_index: 1, status: 'draft',
      is_published: false, is_required: true, passing_score: 80, duration_minutes: 30,
      content: '<h2>Clean Air Act</h2>', rendered_html: null,
      content_json: { experience: { knowledgeChecks: [{ question: 'Why?', options: ['A', 'B'], correct: 0, explanation: 'Because.' }] } },
      video_url: 'https://example.com/video.mp4', media_asset_id: null, video_status: 'ready',
      video_job_id: null, video_error: null, video_config: null, activities: null,
      quiz_questions: [{ id: 'q1', question: 'What is prohibited?', options: ['Venting', 'Recovery'], correct: 0, explanation: 'Intentional venting is prohibited.' }],
      ai_generated: true, approved: false, generation_status: 'generated', practical_required: false,
      required_artifacts: [], requires_instructor_signoff: false,
      learning_objectives: ['Explain the venting prohibition'], competency_checks: null,
      created_at: now, updated_at: now,
    }],
    quizzes: [], videos: [], automationRules: [], workflows: [], warnings: [], loadedAt: now,
    publishState: { isPublished: false, publishedAt: null, reviewStatus: 'pending', generationStatus: 'completed', generationProgress: 100, totalLessons: 1, publishedLessons: 0, approvedLessons: 0, readyToPublish: false },
  };
}

describe('coursePackageFromSession', () => {
  it('maps the canonical Studio course into one portable course package', () => {
    const result = coursePackageFromSession(session());
    expect(result.modules[0].lessons[0].questions[0].prompt).toBe('What is prohibited?');
    expect(result.modules[0].lessons[0].completion.requiredInteractionIds).toContain('clean-air-act-kc');
    expect(result.modules[0].lessons[0].completion.requiredWatchPercent).toBe(95);
  });
});
