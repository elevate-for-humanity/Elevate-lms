import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ProgramHolderWorkspace } from '@/lib/program-holder/workspace';
vi.mock('@/components/orientation/VisualDashboardOrientation', () => ({
  default: () => <div>Visual guide</div>,
}));
import { ReadingDashboard } from '@/components/program-holder/ReadingDashboard';
afterEach(cleanup);
describe('reading dashboard', () => {
  it('shows every assigned program and clear links to students, applications and the shop', () => {
    const data = {
      profile: { full_name: 'Jozanna George' },
      programs: [
        { id: 'cos', title: 'Cosmetology' },
        { id: 'nail', title: 'Nail Technician' },
        { id: 'est', title: 'Esthetician' },
        { id: 'barber', title: 'Barber' },
      ],
      enrollments: [],
    } as unknown as ProgramHolderWorkspace;
    render(<ReadingDashboard data={data} />);
    for (const title of ['Cosmetology', 'Nail Technician', 'Esthetician', 'Barber'])
      expect(screen.getByRole('heading', { name: title })).toBeTruthy();
    expect(screen.getByRole('link', { name: /New applications/ })).toHaveAttribute(
      'href',
      '/program-holder/students/pending',
    );
    expect(screen.getByRole('link', { name: /My host shop/ })).toHaveAttribute(
      'href',
      '/host-shop/dashboard',
    );
  });
});
