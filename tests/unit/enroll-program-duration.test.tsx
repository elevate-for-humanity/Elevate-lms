import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import EnrollPage from '@/apps/marketing/app/enroll/page';
import { FORKLIFT_MANUFACTURING } from '@/lib/programs/forklift-manufacturing';
import { loadPublicProgramList } from '@/lib/programs/public-program-list';

vi.mock('@/lib/programs/public-program-list', () => ({ loadPublicProgramList: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe('enrollment catalog duration', () => {
  it.each([FORKLIFT_MANUFACTURING.duration, '8–12 weeks', '1 week', '160 hours', null])(
    'renders the public duration without changing its units: %s',
    async (duration) => {
      vi.mocked(loadPublicProgramList).mockResolvedValue({
        source: 'static-catalog',
        programs: [{
          slug: 'forklift',
          title: FORKLIFT_MANUFACTURING.title,
          description: 'Online theory and employer-led workplace practice.',
          category: 'trades',
          duration,
          credential: 'Elevate Online Learning Completion Record',
          funding_eligible: false,
          funding_tier: 'self-pay',
          funding_labels: ['Self-Pay'],
          top_jobs_stars: null,
          tuition: null,
          price_label: 'Contact admissions',
        }],
      });

      render(await EnrollPage());

      const card = screen.getByRole('link', { name: /Forklift and Manufacturing Operations/ });
      expect(card).toHaveAttribute('href', '/apply?program=forklift');
      expect(within(card).getByText('Contact admissions')).toBeInTheDocument();
      if (duration) {
        expect(within(card).getByText(`Duration: ${duration}`)).toBeInTheDocument();
      } else {
        expect(within(card).queryByText(/Duration:/)).not.toBeInTheDocument();
      }
      expect(within(card).queryByText('Duration: 48 weeks')).not.toBeInTheDocument();
      expect(within(card).queryByText('Free with funding')).not.toBeInTheDocument();
    },
  );
});
