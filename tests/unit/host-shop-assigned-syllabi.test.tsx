import { expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HostShopProgramsPage from '@/apps/lms/app/host-shop/dashboard/programs/page';

vi.mock('@/lib/admin/host-shop-preview', () => ({ resolveHostShopAdminPreview: async () => null }));
vi.mock('@/lib/auth/require-role', () => ({ requireRole: async () => ({ user: { id: 'shop-owner' } }) }));
vi.mock('@/components/host-shop/HostShopCourses', () => ({ default: () => null }));
vi.mock('@/lib/partner/board', () => ({
  getHostShopBoard: async () => ({
    partner: { programs: ['esthetician', 'nail_technician'] },
    unconfiguredPrograms: [],
    timeBasedPrograms: [],
    hybridPrograms: [],
    registeredPrograms: [],
    tradeInfo: { label: 'Esthetician', programSlug: 'esthetician-apprenticeship' },
    programType: 'esthetician',
    apprentices: [],
  }),
}));

it('shows both assigned occupation syllabi before any student placements', async () => {
  render(await HostShopProgramsPage());
  expect(screen.getByRole('link', { name: /open the .*esthetician.* syllabus/i })).toHaveAttribute(
    'href', '/docs/syllabi/professional-esthetician.md',
  );
  expect(screen.getByRole('link', { name: /open the .*nail technician.* syllabus/i })).toHaveAttribute(
    'href', '/docs/syllabi/nail-technician-apprenticeship.md',
  );
  expect(screen.queryByRole('link', { name: /open the .*barber.* syllabus/i })).toBeNull();
});
