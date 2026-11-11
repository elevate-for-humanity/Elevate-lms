import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import HostShopShowcase from '@/components/programs/beauty/HostShopShowcase';
import { FEATURED_BEAUTY_HOST_PARTNERS } from '@/lib/apprenticeship-programs/host-partners';

vi.mock('@/components/voice/useNaturalVoice', () => ({ stopAllNaturalVoicePlayback: vi.fn() }));
const shops = FEATURED_BEAUTY_HOST_PARTNERS.slice(0, 2);
afterEach(cleanup);

describe('Host Shop hero interaction readiness', () => {
  it('disables the pause control until its event handler can receive the first tap', () => {
    const html = renderToString(<HostShopShowcase shops={shops} />);
    const document = new DOMParser().parseFromString(html, 'text/html');
    expect(document.querySelector('[aria-label="Pause host shop slideshow"]')?.hasAttribute('disabled')).toBe(true);
  });
  it('accepts the first ready pause and resume activation', () => {
    render(<HostShopShowcase shops={shops} />);
    const pause = screen.getByRole('button', { name: 'Pause host shop slideshow', exact: true });
    expect(pause).toBeEnabled();
    fireEvent.click(pause);
    expect(screen.getByRole('button', { name: 'Resume host shop slideshow', exact: true })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Resume host shop slideshow', exact: true }));
    expect(screen.getByRole('button', { name: 'Pause host shop slideshow', exact: true })).toHaveAttribute('aria-pressed', 'false');
  });
});
