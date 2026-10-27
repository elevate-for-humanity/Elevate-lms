// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import ProgramGuideResources from '../../components/resources/ProgramGuideResources';
import PodcastProgramGuideReview from '../../components/admin/PodcastProgramGuideReview';

describe('podcast and program guide access', () => {
  it('renders no owner-only links when review access is denied', () => {
    expect(renderToStaticMarkup(<PodcastProgramGuideReview authorized={false} />)).toBe('');
  });

  it('keeps public resources on canonical public destinations', () => {
    const html = renderToStaticMarkup(<ProgramGuideResources />);
    expect(html).toContain('https://www.elevateforhumanity.org/programs');
    expect(html).toContain('https://www.elevateforhumanity.org/store#platform-demos');
    expect(html).not.toContain('chatgpt.site');
    expect(html).not.toContain('<iframe');
    expect(html).not.toContain('<audio');
    expect(html).not.toContain('<video');
    expect(html).toContain('does not complete a lesson or award training hours');
  });

  it('exposes the exact review media only with authorization and safe new-tab links', () => {
    const html = renderToStaticMarkup(<PodcastProgramGuideReview authorized />);
    for (const path of [
      '/episode-01-paris.mp3', '/episode-01-transcript.md',
      '/reel-education-paris.mp4', '/reel-ai-workflows-paris.mp4',
      '/reel-host-shops-paris.mp4',
    ]) expect(html).toContain(`https://elevate-podcast-review.elizabethpowell6262.chatgpt.site${path}`);
    expect(html.match(/rel="noopener noreferrer"/g)).toHaveLength(6);
    expect(html).toContain('Reels are artwork-based narrated drafts.');
    expect(html).not.toContain('<iframe');
    expect(html).not.toContain('autoplay');
  });
});
