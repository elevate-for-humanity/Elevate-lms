// @vitest-environment node

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('learner path production contract', () => {
  it('loads real path JSON instead of a nonexistent learning_path_courses relation', () => {
    const component = read('components/AdaptiveLearningPath.tsx');
    expect(component).toContain("fetch('/api/learning-paths'");
    expect(component).toContain('path.programs');
    expect(component).not.toContain('learning_path_courses');
    expect(component).not.toContain('training_programs');
  });

  it('requires authentication and scopes skill data to the current learner', () => {
    const route = read('apps/lms/app/api/learning-paths/route.ts');
    expect(route).toContain('getCurrentUser');
    expect(route).toContain("eq('user_id', user.id)");
    expect(route).toContain("eq('is_active', true)");
    expect(route).toContain("onConflict: 'user_id,learning_path_id'");
  });

  it('requires real programs before an administrator can publish a path', () => {
    const route = read('apps/admin/app/api/admin/learning-paths/route.ts');
    expect(route).toContain('At least one program is required');
    expect(route).toContain('normalizedPrograms');
    expect(route).toContain('is_active: true');
  });

  it('provides the missing authenticated next-action endpoint', () => {
    const route = read('apps/lms/app/api/enrollment/next-action/route.ts');
    const banner = read('components/enrollment/NextActionBanner.tsx');
    expect(route).toContain('resolveLatestEnrollment');
    expect(route).toContain('estimated_minutes');
    expect(route).toContain('why:');
    expect(banner).toContain('Why:');
    expect(banner).not.toContain("data.action !== 'CONTINUE_LEARNING'");
  });

  it('uses one access-controlled lesson notebook path and returns the saved record', () => {
    const sidebar = read('components/lesson/LessonSidebar.tsx');
    const route = read('apps/lms/app/api/lessons/[lessonId]/notes/route.ts');
    expect(sidebar).not.toContain("from('lesson_notes')");
    expect(sidebar).toContain('json.note');
    expect(route).toContain('assertLessonAccess');
    expect(route).toContain("textSearch('body'");
    expect(route).toContain('NextResponse.json({ note }, { status: 201 })');
  });
});
