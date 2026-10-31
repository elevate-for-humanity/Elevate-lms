import { beforeEach, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { APPRENTICE_POLICY_KEYS, APPRENTICE_POLICY_VERSION } from '@/lib/apprenticeship/apprentice-policy';
const state = vi.hoisted(() => ({ tables: {} as Record<string, any[]>, fail: '' }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({ from: (table: string) => {
  const q: any = {};
  for (const op of ['select','eq','in','order','limit']) q[op] = () => q;
  const result = () => ({ data: state.tables[table] || [], error: table === state.fail ? { message: 'Unavailable' } : null });
  q.then = (resolve: any) => resolve(result());
  q.maybeSingle = async () => ({ ...result(), data: state.tables[table]?.[0] || null });
  return q;
} }) }));
import ApprenticeHomePanel from '@/components/apprenticeship/ApprenticeHomePanel';
const home = () => ApprenticeHomePanel({ userId: 'learner', programSlug: 'cosmetology-apprenticeship', runtime: { enrollment: { orientation_completed_at: '2026-01-01' }, placement: { supervisor_user_id: 'supervisor' } } as any, billing: { required: false } as any });
beforeEach(() => {
  state.fail = '';
  state.tables = { profiles: [{ first_name: 'Learner' }], apprentices: [{ created_at: '2026-01-01' }], agreement_acceptances: Object.values(APPRENTICE_POLICY_KEYS).map(agreement_key => ({ agreement_key, agreement_version: APPRENTICE_POLICY_VERSION })) };
});
it('keeps completed setup and orientation out of the landing page', async () => {
  const html = renderToStaticMarkup(await home());
  expect(html).toContain('Welcome, Learner');
  expect(html).toContain('No new alerts');
  for (const clutter of ['Explore programs', 'Your visual orientation', 'Review and sign', 'Course chapters', 'Payment dates']) expect(html).not.toContain(clutter);
});
it('alerts only for required documents that are not approved', async () => {
  state.tables.apprentice_document_types = [{ document_type: 'agreement' }, { document_type: 'license' }];
  state.tables.documents = [{ document_type: 'agreement', status: 'verified' }, { document_type: 'license', status: 'rejected' }];
  const html = renderToStaticMarkup(await home());
  expect(html).toContain('1 required document needs attention');
  expect(html).not.toContain('No new alerts');
});
it('does not claim the dashboard is clear when its data failed to load', async () => {
  state.fail = 'notifications';
  const html = renderToStaticMarkup(await home());
  expect(html).toContain('Some alerts could not load');
  expect(html).not.toContain('No new alerts');
});
