import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { getStaticProgram } from '@/data/programs';

describe('visual-first program entry', () => {
  it('shows configured video and its photograph before program costs', () => {
    const program = getStaticProgram('nail-technician-apprenticeship')!;
    const { container } = render(
      <ProgramDetailPage
        program={program}
        banner={{
          pageKey: program.slug,
          analyticsName: program.slug,
          videoSrcDesktop: '/videos/nail-training.mp4',
          videoSrcMobile: '/videos/nail-training-mobile.mp4',
          belowHeroHeadline: program.title,
          belowHeroSubheadline: program.subtitle,
          primaryCta: { label: 'Apply', href: '/apply' },
        }}
        visualContent={
          <section aria-label="See the training">Student training photographs</section>
        }
        afterHero={<section aria-label="Enrollment promotion">Review enrollment costs</section>}
      />,
    );
    const video = container.querySelector('video')!;
    expect(video).not.toBeNull();
    expect(video.querySelector('source[media]')).toHaveAttribute(
      'src',
      '/videos/nail-training-mobile.mp4',
    );
    expect(container.querySelector('img')).not.toBeNull();
    const visuals = screen.getByRole('region', { name: 'See the training' });
    const promotion = screen.getByRole('region', { name: 'Enrollment promotion' });
    expect(video.compareDocumentPosition(visuals) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(
      visuals.compareDocumentPosition(promotion) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByText('Your next step starts here')).toBeInTheDocument();
  });
});
