import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ actor: 'admin', target: 'program_holder', redirects: [] as string[] }));
vi.mock('next/navigation', () => ({ redirect: (url: string) => { state.redirects.push(url); throw new Error(`REDIRECT:${url}`); } }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'actor' } } }) } }) }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({ from: () => ({ select: () => ({ eq: (_: string, id: string) => ({ maybeSingle: async () => ({ data: id === 'actor' ? { role: state.actor } : { id, role: state.target, full_name: 'Selected user' } }) }) }) }) }) }));
import AdminPreviewPage from '@/apps/lms/app/admin-preview/page';

function findForm(node: any): any {
  if (!node || typeof node !== 'object') return null;
  if (node.type === 'form') return node;
  for (const child of [node.props?.children].flat()) { const form = findForm(child); if (form) return form; }
  return null;
}

beforeEach(() => { state.actor = 'admin'; state.target = 'program_holder'; state.redirects = []; });
describe('legacy preview entry', () => {
  it('sends the selected identity through the complete signed-session replacement flow', async () => {
    const page = await AdminPreviewPage({ searchParams: Promise.resolve({ user_id: 'selected-user' }) });
    const form = findForm(page);
    expect(form).toBeTruthy();
    const data = new FormData(); data.set('user_id', 'selected-user');
    await expect(form.props.action(data)).rejects.toThrow('REDIRECT:/api/admin/preview?user_id=selected-user');
  });
  it('reauthorizes the actor at submission even after the page was opened', async () => {
    const page = await AdminPreviewPage({ searchParams: Promise.resolve({ user_id: 'selected-user' }) });
    state.actor = 'student';
    const data = new FormData(); data.set('user_id', 'selected-user');
    await expect(findForm(page).props.action(data)).rejects.toThrow('REDIRECT:/unauthorized');
    expect(state.redirects).not.toContain('/api/admin/preview?user_id=selected-user');
  });
});
