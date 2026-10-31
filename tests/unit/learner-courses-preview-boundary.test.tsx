import { beforeEach, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
const state = vi.hoisted(() => ({ role: 'admin', portalPreview: false, coursePreview: false }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'actor' } } }) } }) }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { role: state.role } }) }) }) }) }) }));
vi.mock('@/lib/admin/portal-preview', () => ({ resolvePortalPreviewSubject: async () => ({ userId: state.portalPreview ? 'selected-learner' : 'actor', previewing: state.portalPreview }) }));
vi.mock('@/lib/admin/course-preview', () => ({ resolveCoursePreview: async () => ({ active: state.coursePreview }) }));
vi.mock('@/components/lms/LearnerWorkspaceLayout', () => ({ default: ({ children }: { children: React.ReactNode }) => <section>{children}</section> }));
import LearnerCoursesLayout from '@/apps/lms/app/lms/courses/layout';
const page = async () => renderToStaticMarkup(await LearnerCoursesLayout({ children: <p>Assigned course content</p> }));
beforeEach(() => { state.role = 'admin'; state.portalPreview = false; state.coursePreview = false; });
it('keeps an unselected admin session out of learner course content', async () => {
  const html = await page();
  expect(html).toContain('Select or manage a learner');
  expect(html).not.toContain('Assigned course content');
});
it('allows an authorized selected-learner preview instead of replacing it with the admin placeholder', async () => {
  state.portalPreview = true;
  const html = await page();
  expect(html).toContain('Assigned course content');
  expect(html).not.toContain('Select or manage a learner');
});
it('preserves the separately authorized course-builder preview', async () => {
  state.coursePreview = true;
  expect(await page()).toContain('Assigned course content');
});
it('renders normal learner content without administrator management prompts', async () => {
  state.role = 'student';
  const html = await page();
  expect(html).toContain('Assigned course content');
  expect(html).not.toContain('Exit learner preview');
});
