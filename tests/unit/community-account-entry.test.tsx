import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

const state = vi.hoisted(() => ({ requireRole: vi.fn() }));
vi.mock('@/lib/auth/require-role', () => ({ requireRole: state.requireRole }));
vi.mock('next/navigation', () => ({
  redirect: (path: string) => { throw new Error(`redirect:${path}`); },
}));
vi.mock('@/components/SocialLearningCommunity', () => ({
  default: ({ userId, navigationContext }: { userId: string; navigationContext: string }) =>
    <section data-testid="community" data-user-id={userId} data-context={navigationContext}>Community feed and groups</section>,
}));
vi.mock('@/components/portal/BusinessNetworkCard', () => ({ BusinessNetworkCard: () => null }));
import CommunityPage from '@/apps/lms/app/community/page';
import { ALL_AUTHENTICATED_ROLES } from '@/lib/rbac/role-matrix';

function account(roles: string[]) {
  return { user: { id: 'new-network-member' }, profile: { full_name: 'Network Member' }, effectiveRoles: roles };
}
beforeEach(() => {
  vi.clearAllMocks();
  state.requireRole.mockResolvedValue(account(['student']));
});
afterEach(cleanup);

it('opens the authenticated community for a new account without learner enrollment', async () => {
  render(await CommunityPage());
  expect(screen.getByTestId('community')).toHaveAttribute('data-user-id', 'new-network-member');
  expect(screen.getByTestId('community')).toHaveAttribute('data-context', 'community');
  expect(state.requireRole).toHaveBeenCalledWith(ALL_AUTHENTICATED_ROLES);
});

it.each([
  [['program_holder'], '/program-holder/community'],
  [['provider_admin'], '/program-holder/community'],
  [['host_shop'], '/host-shop/dashboard/community'],
  [['partner'], '/host-shop/dashboard/community'],
  [['employer'], '/employer/community'],
  [['sponsor'], '/employer/community'],
  [['program_holder', 'employer'], '/program-holder/community'],
] as const)('preserves approved %j routing to %s', async (roles, destination) => {
  state.requireRole.mockResolvedValue(account([...roles]));
  await expect(CommunityPage()).rejects.toThrow(`redirect:${destination}`);
});

it('preserves the administrator community instead of entering a business portal', async () => {
  state.requireRole.mockResolvedValue(account(['admin', 'employer']));
  render(await CommunityPage());
  expect(screen.getByTestId('community')).toBeInTheDocument();
});

it.each(['/login?redirect=%2Fcommunity', '/unauthorized'])('does not swallow the authentication guard redirect %s', async destination => {
  state.requireRole.mockRejectedValue(new Error(`redirect:${destination}`));
  await expect(CommunityPage()).rejects.toThrow(`redirect:${destination}`);
  expect(screen.queryByTestId('community')).not.toBeInTheDocument();
});
