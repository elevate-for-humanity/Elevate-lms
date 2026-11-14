import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DemoTabs from '@/apps/marketing/app/store/demos/DemoTabs';
import { DEMO_STUDENTS } from '@/lib/store/demo-preview-data';

vi.mock('@/components/store/StoreDemoAdvisor', () => ({ default: () => null }));
afterEach(cleanup);

describe('store demo visual previews', () => {
  it('uses the public sample records and switches the preview with the selected role', () => {
    render(<DemoTabs />);
    expect(screen.getByText(DEMO_STUDENTS[0].name)).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: `${DEMO_STUDENTS[0].name} progress` })).toHaveAttribute('aria-valuenow', String(DEMO_STUDENTS[0].progress));
    fireEvent.click(screen.getByRole('button', { name: /Employer Portal/ }));
    expect(screen.getByText('Marcus Sample')).toBeInTheDocument();
    expect(screen.queryByText('Jordan Sample')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Launch interactive demo/ })).toHaveAttribute('href', '/store/demo/employer');
    fireEvent.click(screen.getByRole('button', { name: /Student Portal/ }));
    expect(screen.getByText('Barber Fundamentals')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Workforce Board/ }));
    expect(screen.getByText('28 participants')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Launch interactive demo/ })).toHaveAttribute('href', '/store/demo/institutional');
  });
});
