import { describe, expect, it } from 'vitest';
import {
  APPLICATION_REVIEW_STATUSES,
  applicationProgramFilter,
  applicationSearchFilter,
} from '@/lib/admin/application-filters';

describe('Supabase application filters', () => {
  it('includes both admin and staff review states in the shared review queue', () => {
    expect(APPLICATION_REVIEW_STATUSES).toContain('under_review');
    expect(APPLICATION_REVIEW_STATUSES).toContain('pending_admin_review');
    expect(APPLICATION_REVIEW_STATUSES).not.toContain('enrolled');
  });
  it('filters a catalog program by canonical slug and saved legacy title', () => {
    expect(
      applicationProgramFilter({ slug: 'barber-apprenticeship', title: 'Barber Apprenticeship' }),
    ).toBe(
      'program_slug.eq."barber-apprenticeship",program_interest.eq."barber-apprenticeship",program_interest.eq."Barber Apprenticeship"',
    );
  });
  it('preserves the previously supported CDL legacy intake alias', () => {
    expect(applicationProgramFilter({ slug: 'cdl-training', title: 'CDL Training' })).toContain(
      'program_interest.ilike.%cdl%',
    );
  });
  it('quotes comma, parentheses, and quotes instead of letting names alter the filter expression', () => {
    expect(applicationSearchFilter('Smith, "Junior" (II)')).toContain(
      'first_name.ilike."%Smith, \\"Junior\\" (II)%"',
    );
    expect(applicationProgramFilter({ slug: 'business', title: 'Business, "Start-Up"' })).toContain(
      'program_interest.eq."Business, \\"Start-Up\\""',
    );
  });
});
