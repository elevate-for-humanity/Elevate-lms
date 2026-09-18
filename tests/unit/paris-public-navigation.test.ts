import { describe, expect, it } from 'vitest';
import { linkifyParisRoutes, resolvePublicNavigation } from '@/lib/paris/public-navigation';

describe('PARIS public navigation', () => {
  it('opens the barber program for the exact mobile chat request', () => {
    expect(resolvePublicNavigation('can you take me to the barber program')).toEqual({
      href: '/programs/barber-apprenticeship',
      label: 'Barber Apprenticeship',
    });
  });

  it('does not redirect informational questions', () => {
    expect(resolvePublicNavigation('How many hours is the barber program?')).toBeNull();
  });

  it('makes plain internal routes tappable without altering external links', () => {
    expect(linkifyParisRoutes('Review /programs/barber-apprenticeship.')).toBe(
      'Review [/programs/barber-apprenticeship](/programs/barber-apprenticeship).',
    );
    expect(linkifyParisRoutes('Visit https://example.com/help')).toBe(
      'Visit [https://example.com/help](https://example.com/help)',
    );
  });
});
