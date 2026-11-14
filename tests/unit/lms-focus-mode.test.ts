import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('canonical LMS lesson Focus Mode', () => {
  const shell = readFileSync('components/lms/LessonFocusShell.tsx', 'utf8');
  const lessonPage = readFileSync(
    'apps/lms/app/lms/courses/[courseId]/lessons/[lessonId]/page.tsx',
    'utf8',
  );

  it('uses one accessible mode toggle and preserves the canonical lesson experience', () => {
    expect(shell).toContain("aria-pressed={focused}");
    expect(shell).toContain("aria-label={focused ? 'Exit focus mode' : 'Enter focus mode'}");
    expect(shell).toContain("event.key === 'Escape'");
    expect(shell).toContain("data-focus-mode={focused ? 'active' : 'inactive'}");
    expect(lessonPage).toContain('<LessonFocusShell header={lessonHeader}>');
    expect(lessonPage).toContain('<InteractiveLessonExperience');
    expect(lessonPage).toContain('<LessonProgressClient');
  });
});
