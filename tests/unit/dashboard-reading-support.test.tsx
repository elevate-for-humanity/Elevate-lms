import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DashboardReadingSupport } from '@/components/accessibility/DashboardReadingSupport';

describe('universal dashboard reading view', () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);
  it('starts with reading support and preserves dashboard tools', () => {
    render(
      <DashboardReadingSupport>
        <a href="/students">My students</a>
      </DashboardReadingSupport>,
    );
    expect(screen.getByRole('button', { name: 'Reading view' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText('Text size: Larger')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reading view' }).textContent).toBe(
      'Use standard text',
    );
    expect(screen.getByRole('link', { name: 'My students' })).toHaveAttribute('href', '/students');
  });
  it('leaves public marketing pages unchanged when dashboard-only mode is used', () => {
    render(
      <DashboardReadingSupport dashboardOnly>
        <h1>Public home page</h1>
      </DashboardReadingSupport>,
    );
    expect(screen.getByRole('heading', { name: 'Public home page' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Reading view' })).toBeNull();
  });
  it('lets the user switch views and remembers the presentation choice', () => {
    const { unmount } = render(<DashboardReadingSupport>Dashboard</DashboardReadingSupport>);
    fireEvent.click(screen.getByRole('button', { name: 'Reading view' }));
    expect(localStorage.getItem('elevate-reading-view')).toBe('compact');
    unmount();
    render(<DashboardReadingSupport>Dashboard</DashboardReadingSupport>);
    expect(screen.getByRole('button', { name: 'Reading view' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reading view' }));
    expect(localStorage.getItem('elevate-reading-view')).toBe('reading');
  });
});
