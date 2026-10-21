import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import DashboardOrientation, {
  DashboardOrientationPanel,
} from '@/components/learner/DashboardOrientation';

afterEach(cleanup);

describe('dashboard orientation', () => {
  it('keeps the landing screen clear and opens the guide through its sidebar anchor', () => {
    const { container } = render(<DashboardOrientationPanel />);
    const panel = container.querySelector('details')!;
    expect(panel.open).toBe(false);
    window.history.replaceState(null, '', '#orientation');
    fireEvent(window, new HashChangeEvent('hashchange'));
    expect(panel.open).toBe(true);
    window.history.replaceState(null, '', '/');
  });
  it('keeps generic learners separate from bookkeeping contacts and supports navigation', () => {
    render(<DashboardOrientation />);
    expect(screen.getByRole('button', { name: 'Previous slide' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(
      screen.getByRole('heading', { name: 'Your course and provider access' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Previous slide' }));
    expect(
      screen.getByRole('heading', { name: 'Welcome to your student dashboard' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Wilkes/)).not.toBeInTheDocument();
  });

  it('shows the full photo orientation and opens an addressed interoffice message', () => {
    render(
      <DashboardOrientation
        bookkeeping
        instructorEmail="center.of.destiny@elevateforhumanity.org"
      />,
    );
    const headings: string[] = [];
    const images = new Set<string>();
    for (let i = 0; i < 15; i++) {
      headings.push(screen.getByRole('heading').textContent || '');
      images.add(screen.getByRole('img').getAttribute('src') || '');
      if (i === 4) {
        const link = screen.getByRole('link', { name: 'Write my introduction to Dr. Wilkes' });
        const url = new URL(link.getAttribute('href')!, 'https://app.elevateforhumanity.org');
        expect(url.pathname).toBe('/communications/email');
        expect(url.searchParams.get('to')).toBe('center.of.destiny@elevateforhumanity.org');
      }
      fireEvent.click(
        screen.getByRole('button', { name: i === 14 ? 'Restart orientation' : 'Next slide' }),
      );
    }
    expect(images.size).toBeGreaterThan(7);
    expect(headings).toContain('Meet Dr. Carlina Wilkes');
    expect(headings).toContain('How interoffice email works');
    expect(headings).toContain('Documents and enrollment records');
    expect(headings).toContain('Career services and your next step');
    expect(screen.getByRole('button', { name: 'Previous slide' })).toBeDisabled();
  });

  it('does not invent an instructor mailbox when an assignment is missing', () => {
    render(<DashboardOrientation bookkeeping />);
    for (let i = 0; i < 4; i++) fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(screen.getByRole('link', { name: 'Confirm my instructor contact' })).toHaveAttribute(
      'href',
      '/lms/support',
    );
  });
});
