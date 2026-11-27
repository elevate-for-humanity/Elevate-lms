import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  pathname: '/community', joined: false, insertError: null as null | { message: string; code?: string },
  writes: [] as Array<{ table: string; payload: Record<string, unknown> }>,
}));
vi.mock('next/navigation', () => ({ usePathname: () => state.pathname }));
vi.mock('@/lib/supabase/client', () => ({ createClient: () => ({
  rpc: async () => ({ data: [], error: null }),
  from: (table: string) => {
    let inserted = false;
    const query: Record<string, any> = {};
    for (const method of ['select', 'eq', 'is', 'order', 'limit']) query[method] = () => query;
    query.insert = (payload: Record<string, unknown>) => {
      inserted = true;
      state.writes.push({ table, payload });
      if (table === 'study_group_members' && !state.insertError) state.joined = true;
      return query;
    };
    const result = () => {
      if (inserted) return { data: state.insertError ? null : { id: 'saved-record' }, error: state.insertError };
      if (table === 'study_groups') return { data: [{ id: 'cleaning-group', name: 'Cleaning professionals', topic: 'Janitorial', member_count: state.joined ? 1 : 0 }], error: null };
      if (table === 'study_group_members') return { data: state.joined ? [{ study_group_id: 'cleaning-group' }] : [], error: null };
      return { data: [], error: null };
    };
    query.single = async () => result();
    query.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result()).then(resolve);
    return query;
  },
}) }));
import SocialLearningCommunity from '@/components/SocialLearningCommunity';

beforeEach(() => {
  state.pathname = '/community'; state.joined = false; state.insertError = null; state.writes = [];
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it.each(['/community', '/employer/community', '/program-holder/community', '/host-shop/dashboard/community'])('keeps %s navigation out of the paid learner workspace', async pathname => {
  state.pathname = pathname;
  const { container } = render(<SocialLearningCommunity userId="network-member" />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Explore groups' })).toBeInTheDocument());
  expect(container.querySelector('a[href^="/lms/"]')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Explore groups' }));
  expect(await screen.findByText('Cleaning professionals')).toBeInTheDocument();
});

it('preserves the enrolled learner shortcuts in the learner workspace', async () => {
  state.pathname = '/lms/community';
  render(<SocialLearningCommunity userId="learner" />);
  expect(screen.getByRole('link', { name: 'Members', exact: true })).toHaveAttribute('href', '/lms/members');
  expect(screen.getByRole('link', { name: 'Manage privacy →' })).toHaveAttribute('href', '/lms/settings/privacy');
  await screen.findByRole('button', { name: 'feed' });
});

it('lets a community-only account join a group using its own identity', async () => {
  render(<SocialLearningCommunity userId="network-member" />);
  fireEvent.click(screen.getByRole('button', { name: 'Browse groups' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Join', exact: true }));
  expect(await screen.findByRole('button', { name: 'Leave' })).toBeInTheDocument();
  expect(state.writes).toContainEqual({ table: 'study_group_members', payload: { study_group_id: 'cleaning-group', user_id: 'network-member' } });
});

it('does not claim a failed group join succeeded', async () => {
  state.insertError = { message: 'Membership could not be saved' };
  render(<SocialLearningCommunity userId="network-member" />);
  fireEvent.click(screen.getByRole('button', { name: 'Browse groups' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Join', exact: true }));
  await screen.findByText('Membership could not be saved');
  expect(screen.queryByRole('button', { name: 'Leave' })).not.toBeInTheDocument();
});

it('keeps posting available without navigating to learner pages', async () => {
  render(<SocialLearningCommunity userId="network-member" />);
  const composer = screen.getByPlaceholderText('Share an update, question, milestone, resource, or opportunity…');
  fireEvent.change(composer, { target: { value: 'Our cleaning team serves Indianapolis.' } });
  fireEvent.click(screen.getByRole('button', { name: 'Post', exact: true }));
  await waitFor(() => expect(composer).toHaveValue(''));
  expect(state.writes).toContainEqual({ table: 'community_posts', payload: expect.objectContaining({ user_id: 'network-member', content: 'Our cleaning team serves Indianapolis.' }) });
});

it('opens and publishes discussions from community shortcuts', async () => {
  render(<SocialLearningCommunity userId="network-member" />);
  fireEvent.click(screen.getByRole('button', { name: 'Open discussions' }));
  fireEvent.click(screen.getByRole('button', { name: 'Start discussion' }));
  fireEvent.change(screen.getByPlaceholderText('Discussion title'), { target: { value: 'Floor care training' } });
  fireEvent.change(screen.getByPlaceholderText('Question, resource, or discussion'), { target: { value: 'Which supervised training sessions are available?' } });
  fireEvent.click(screen.getByRole('button', { name: 'Publish discussion' }));
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Publish discussion' })).not.toBeInTheDocument());
  expect(state.writes).toContainEqual({ table: 'forum_topics', payload: expect.objectContaining({ author_id: 'network-member', title: 'Floor care training' }) });
});

it('keeps administrator previews read-only in the standalone community', async () => {
  render(<SocialLearningCommunity userId="network-member" readOnly />);
  fireEvent.click(screen.getByRole('button', { name: 'Browse groups' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Join', exact: true }));
  expect(await screen.findByText('This administrator preview cannot post or act for the shop. Use your own account to participate.')).toBeInTheDocument();
  expect(state.writes).toEqual([]);
});
