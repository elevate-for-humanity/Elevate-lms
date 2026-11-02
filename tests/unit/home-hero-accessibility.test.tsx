import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlatformHubHero } from '@/components/home/PlatformHubHero';

describe('homepage enrollment choices', () => {
  it('provides a single main heading and readable, named enrollment links', () => {
    render(<PlatformHubHero />);
    expect(screen.getByRole('heading', { level: 1, name: 'Train for your next career.' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Explore Career Training' })).toHaveAttribute('href', '/programs');
    const funding = screen.getByRole('link', { name: 'Check Funding Options' });
    expect(funding).toHaveAttribute('href', '/check-eligibility');
    // This secondary CTA sits inside the dark hero. Its dark text needs an
    // explicit light background in the normal state, before any hover occurs.
    expect(funding).toHaveClass('bg-white', 'text-slate-950');
  });
});
