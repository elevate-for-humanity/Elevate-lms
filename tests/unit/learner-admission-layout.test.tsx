import { beforeEach, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const state = vi.hoisted(() => ({ pathname: '/lms/dashboard', admitted: false, previewing: false }));
const admission = vi.hoisted(() => vi.fn(async () => state.admitted));
vi.mock('next/headers', () => ({ headers: async () => new Map([['x-pathname', state.pathname]]) }));
vi.mock('next/navigation', () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'learner', email: 'qa@example.invalid' } } }) } }) }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { role: 'student' } }) }) }) }) }) }));
vi.mock('@/lib/admin/portal-preview', () => ({ resolvePortalPreviewSubject: async () => ({ userId: 'learner', previewing: state.previewing }) }));
vi.mock('@/lib/learner/approved-paid-admission.mjs', () => ({ hasApprovedPaidLearnerEnrollment: admission }));
vi.mock('@/lib/apprenticeship/beauty-payment-gate.mjs', () => ({ loadBeautyPaymentGate: async () => null }));
vi.mock('@/components/apprenticeship/BeautyPaymentLock', () => ({ BeautyPaymentLock: () => <p>Locked</p> }));
vi.mock('@/components/lms/LearnerWorkspaceLayout', () => ({ default: ({ children }: { children: React.ReactNode }) => <section>{children}</section> }));
import Layout from '@/apps/lms/app/lms/(app)/layout';
const render = async () => renderToStaticMarkup(await Layout({ children: <p>Route content</p> }));
beforeEach(() => { state.pathname = '/lms/dashboard'; state.admitted = false; state.previewing = false; admission.mockClear(); });

it.each([
  '/lms/payments',
  '/lms/payments/invoice',
  '/lms/enroll',
  '/lms/enroll/program',
  '/lms/apply',
  '/lms/apply/status',
  '/lms/documents',
  '/lms/documents/upload',
  '/lms/agreements',
  '/lms/onboarding',
  '/lms/profile',
  '/lms/handbook',
  '/lms/orientation',
  '/lms/legal/enrollment-agreement',
  '/lms/legal/student-handbook',
  '/lms/legal/privacy',
  '/lms/legal/student-mou',
  '/lms/legal/apprenticeship-agreement',
])('allows pending applicants to reach %s', async pathname => {
  state.pathname = pathname;
  expect(await render()).toContain('Route content');
  expect(admission).not.toHaveBeenCalled();
});
it.each([
  '/lms/dashboard',
  '/lms/courses/example',
  '/lms/payments-private',
  '/lms/enrollment-materials',
  '/lms/apply/coursework',
  '/lms/documents/course-materials',
  '/lms/onboarding/coursework',
  '/lms/legal/other-materials',
])('continues to deny protected route %s', async pathname => {
  state.pathname = pathname;
  await expect(render()).rejects.toThrow('redirect:/lms/access-pending');
});
it('preserves admitted learner access', async () => {
  state.admitted = true;
  expect(await render()).toContain('Route content');
});
it('retains validated read-only administrator preview', async () => {
  state.previewing = true;
  state.pathname = '/lms/calendar';
  expect(await render()).toContain('learner records are read-only');
  expect(admission).not.toHaveBeenCalled();
});
