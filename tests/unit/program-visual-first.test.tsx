import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { getStaticProgram } from '@/data/programs';
import { getProgramHeroImage } from '@/lib/images/programImages';

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
          <section aria-label="See the training">
            <img src="/images/partners/style-and-scissor-salon/manicure-enhanced-2026.webp" alt="Host salon manicure portfolio" />
          </section>
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
    // A native video poster is the hero photograph. Do not rely on an
    // unrelated image later in the CTA to prove visual-first ordering.
    expect(video).toHaveAttribute('poster', getProgramHeroImage(program.slug));
    const photograph = screen.getByRole('img', { name: 'Host salon manicure portfolio' });
    expect(photograph).toBeVisible();
    expect(container.querySelectorAll('img')).toHaveLength(1);
    const visuals = screen.getByRole('region', { name: 'See the training' });
    const promotion = screen.getByRole('region', { name: 'Enrollment promotion' });
    expect(visuals).toContainElement(photograph);
    expect(photograph.compareDocumentPosition(promotion) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(video.compareDocumentPosition(visuals) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(
      visuals.compareDocumentPosition(promotion) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByText('Your next step starts here')).toBeInTheDocument();
  });
});
