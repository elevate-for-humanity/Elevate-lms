import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import HostShopShowcase from '@/components/programs/beauty/HostShopShowcase';
import { FEATURED_BEAUTY_HOST_PARTNERS } from '@/lib/apprenticeship-programs/host-partners';

vi.mock('@/components/voice/useNaturalVoice', () => ({ stopAllNaturalVoicePlayback: vi.fn() }));
const shops = FEATURED_BEAUTY_HOST_PARTNERS.slice(0, 2);
afterEach(cleanup);

describe('Host Shop hero interaction readiness', () => {
  it.each([
    ['56 W Main St, New Palestine, IN, 46163', '', '56 W Main St, New Palestine, IN, 46163'],
    ['56 W Main St', '46163', '56 W Main St, New Palestine, IN 46163'],
    ['56 W Main St, Suite 2', '46163', '56 W Main St, Suite 2, New Palestine, IN 46163'],
  ])('shows one complete location for address %s', (address, zip, expected) => {
    render(<HostShopShowcase shops={[{ slug: 'address-test', name: 'Address Test', city: 'New Palestine', state: 'IN', zip, address, programs: ['barber-apprenticeship'], media: [{ src: '/shop.webp', alt: 'Shop portfolio', kind: 'photo' }] }]} asHero />);
    expect(screen.getByText(expected, { exact: true })).toBeInTheDocument();
    expect(screen.queryByText(/New Palestine, IN, 46163, New Palestine/)).not.toBeInTheDocument();
  });
  it('retains an approved shop hero when the fixed tour sequence has no approved matches', () => {
    const approved = [{ slug: 'approved-barber', name: 'Approved Barber', city: 'Indy', state: 'IN', zip: '', address: '1 Main Street', programs: ['barber-apprenticeship'], media: [{ src: '/approved-barber.webp', alt: 'Approved shop portfolio', kind: 'photo' as const }] }];
    render(<HostShopShowcase shops={approved} asHero mediaSequence={[{ shopSlug: 'pending-salon', media: { src: '/pending.webp', alt: 'Pending shop', kind: 'photo' } }]} />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByAltText('Approved shop portfolio')).toBeInTheDocument();
    expect(screen.queryByAltText('Pending shop')).not.toBeInTheDocument();
  });
  it('keeps the recruitment hero and primary heading when there are no approved photos', () => {
    render(<HostShopShowcase shops={[]} asHero />);
    expect(screen.getByRole('heading', { level: 1, name: 'Join the Elevate Host Shop network' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Apply free to become a Host Shop' })).toHaveAttribute('href', '/partners/host-shop/apply');
  });
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
