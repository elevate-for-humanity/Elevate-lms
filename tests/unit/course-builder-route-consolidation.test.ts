import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const exists = (file: string) => existsSync(path.join(root, file));
const read = (file: string) => readFileSync(path.join(root, file), 'utf8');

const canonicalApiRoutes = [
  'apps/admin/app/api/admin/course-builder/automatic/route.ts',
  'apps/admin/app/api/admin/course-builder/chat/route.ts',
  'apps/admin/app/api/admin/course-builder/chat/save/route.ts',
  'apps/admin/app/api/admin/course-builder/import/ingest/route.ts',
  'apps/admin/app/api/admin/course-builder/import/parse-file/route.ts',
  'apps/admin/app/api/admin/course-builder/pipeline/route.ts',
  'apps/admin/app/api/admin/course-builder/course/route.ts',
  'apps/admin/app/api/admin/course-builder/course-settings/route.ts',
  'apps/admin/app/api/admin/course-builder/readiness/route.ts',
  'apps/admin/app/api/admin/course-builder/lesson-review/route.ts',
  'apps/admin/app/api/admin/course-builder/review/route.ts',
  'apps/admin/app/api/admin/course-builder/clone/route.ts',
  'apps/admin/app/api/admin/course-builder/enhance/route.ts',
  'apps/admin/app/api/admin/course-builder/versions/route.ts',
  'apps/admin/app/api/admin/course-builder/video-queue/route.ts',
  'apps/admin/app/api/admin/course-builder/video-render/route.ts',
  'apps/admin/app/api/admin/course-builder/scorm/route.ts',
  'apps/admin/app/api/admin/course-builder/automation-summary/route.ts',
];

const removedLegacyRoutes = [
  'apps/app/api/admin/courses/route.ts',
  'apps/app/api/admin/courses/ingest/route.ts',
  'apps/app/api/admin/courses/parse-file/route.ts',
  'apps/app/api/admin/courses/pipeline/route.ts',
  'apps/app/api/admin/courses/health/route.ts',
  'apps/app/api/admin/courses/lessons/route.ts',
  'apps/app/api/admin/courses/quizzes/route.ts',
  'apps/app/api/admin/courses/quiz-questions/route.ts',
  'apps/app/api/admin/courses/ai-builder/route.ts',
  'apps/app/api/admin/courses/ai-builder/chat/route.ts',
  'apps/app/api/admin/courses/generate/route.ts',
  'apps/app/api/admin/courses/generate/parse/route.ts',
  'apps/app/api/admin/courses/generate/publish/route.ts',
  'apps/app/api/admin/courses/generate/regenerate/route.ts',
  'apps/app/api/admin/courses/[courseId]/route.ts',
  'apps/app/api/admin/courses/[courseId]/clone/route.ts',
  'apps/app/api/admin/courses/[courseId]/generate/route.ts',
  'apps/app/api/admin/courses/[courseId]/generate-missing/route.ts',
  'apps/app/api/admin/courses/[courseId]/generate-videos/route.ts',
  'apps/app/api/admin/courses/[courseId]/lessons/route.ts',
  'apps/app/api/admin/courses/[courseId]/modules/route.ts',
  'apps/app/api/admin/courses/[courseId]/quiz/route.ts',
  'apps/app/api/admin/courses/[courseId]/publish/route.ts',
  'apps/app/api/admin/courses/[courseId]/review/route.ts',
  'apps/app/api/admin/courses/[courseId]/versions/route.ts',
];

const removedStudioRoutes = [
  'apps/admin/app/admin/studio/courses/page.tsx',
  'apps/admin/app/admin/studio/courses/[courseId]/page.tsx',
  'apps/admin/app/admin/studio/courses/[courseId]/edit/page.tsx',
  'apps/admin/app/admin/studio/courses/[courseId]/inspect/page.tsx',
  'apps/admin/app/admin/studio/courses/[courseId]/content/page.tsx',
  'apps/admin/app/admin/studio/courses/[courseId]/quizzes/page.tsx',
  'apps/admin/app/admin/studio/courses/create/page.tsx',
  'apps/admin/app/admin/studio/courses/generate/page.tsx',
  'apps/admin/app/admin/studio/courses/pipeline/page.tsx',
  'apps/admin/app/admin/studio/courses/ai-builder/page.tsx',
];

describe('canonical Course Builder consolidation', () => {
  it('has one canonical Admin authoring route and preserved capability surface', () => {
    expect(exists('apps/admin/app/course-builder/page.tsx')).toBe(true);
    expect(exists('components/admin/course-builder/UnifiedCourseBuilder.tsx')).toBe(true);

    const unified = read('components/admin/course-builder/UnifiedCourseBuilder.tsx');
    for (const label of [
      'Build',
      'AI Generate',
      'Import',
      'Pipeline',
      'Templates',
      'Blueprints',
      'Video + Audio',
      'Interactive',
      'Assessments',
      'Governance',
      'SCORM',
    ]) {
      expect(unified).toContain(label);
    }
  });

  it('preserves advanced features inside canonical components', () => {
    for (const file of [
      'components/admin/course-builder/AICourseBuilderChat.tsx',
      'components/admin/course-builder/CourseTemplateGallery.tsx',
      'components/admin/course-builder/CourseGovernancePanel.tsx',
      'components/admin/course-builder/CourseOperationsPanel.tsx',
      'components/admin/course-builder/CourseLessonReviewPanel.tsx',
      'components/admin/course-builder/CourseMediaAttachmentPanel.tsx',
      'components/admin/course-builder/CourseAwareAssistantPanel.tsx',
      'components/admin/course-builder/CourseAutomationSummary.tsx',
      'components/admin/course-builder/CourseScormPanel.tsx',
    ]) {
      expect(exists(file), file).toBe(true);
    }
  });

  it('owns all authoring APIs in the Admin Course Builder namespace', () => {
    for (const route of canonicalApiRoutes) {
      expect(exists(route), route).toBe(true);
    }
  });

  it('removed the App-service Course Builder API duplicates', () => {
    for (const route of removedLegacyRoutes) {
      expect(exists(route), route).toBe(false);
    }
  });

  it('removed duplicate Admin Course Studio page shells', () => {
    for (const route of removedStudioRoutes) {
      expect(exists(route), route).toBe(false);
    }
  });

  it('routes the flexible pipeline through Course Factory ownership', () => {
    const route = read('apps/admin/app/api/admin/course-builder/pipeline/route.ts');
    expect(route).toContain("@/lib/course-factory/orchestrator");
    expect(route).not.toContain("@/lib/course-builder/orchestrator");
  });

  it('does not allow the canonical Course Factory publisher to activate learner content directly', () => {
    const publisher = read('lib/course-factory/publisher.ts');
    expect(publisher).toContain("status: 'draft'");
    expect(publisher).toContain('is_active: false');
    expect(publisher).toContain('is_published: false');
    expect(publisher).not.toContain(".delete().eq('course_id'");
  });

  it('requires instructional review and version snapshots before controlled publication', () => {
    const readiness = read('apps/admin/app/api/admin/course-builder/readiness/route.ts');
    const versioning = read('lib/course-factory/versioning.ts');
    expect(readiness).toContain('lesson_approval');
    expect(versioning).toContain('snapshot');
    expect(versioning).toContain('lesson(s) are not instructionally approved');
  });
});
