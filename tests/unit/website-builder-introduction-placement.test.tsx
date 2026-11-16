import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { PublicTenantComposableSite } from '@/components/tenant/PublicTenantComposableSite';
import { TenantPreviewProvider } from '@/components/tenant/TenantPreviewContext';
import { buildDefaultSiteConfig } from '@/lib/tenant/default-site-config';
import { ensureComposableSiteConfig } from '@/lib/tenant/site-composition';

vi.mock('@/components/voice/useNaturalVoice', () => ({
  useNaturalVoice: () => ({ isPlaying: false, isLoading: false, play: vi.fn(), stop: vi.fn() }),
}));
afterEach(cleanup);

function site(placement?: unknown, narration = 'Customer approved introduction', recording = true) {
  const config = buildDefaultSiteConfig({ organizationName: 'Subscriber studio' });
  config.pages = [{ id: 'home', slug: '/', title: 'Home', sections: [{
    id: 'hero', type: 'hero', settings: { introductionPlacement: placement },
    content: { title: 'Customer headline', image: '/owner.webp', narration,
      introductionTitle: 'A note from our studio',
      ...(recording ? { audioUrl: '/audio/studio/intro.mp3', musicUrl: '/audio/studio/music.mp3' } : {}),
    },
  }] }];
  return { id: 'subscriber', subdomain: 'studio', siteName: 'Subscriber studio', organizationId: null, config };
}

describe('shared introduction placement', () => {
  it('round trips a customer-authored band above the hero without duplicating media or changing content', () => {
    const original = site('before-hero');
    const snapshot = JSON.stringify(original);
    const saved = { ...original, config: ensureComposableSiteConfig(JSON.parse(JSON.stringify(original.config))) };
    const { container } = render(<PublicTenantComposableSite site={saved} />);
    const band = screen.getByRole('region', { name: 'A note from our studio' });
    const hero = container.querySelector('.tenant-hero')!;
    expect(band.nextElementSibling).toBe(hero);
    expect(band.compareDocumentPosition(hero) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(band).getByRole('group', { name: 'Introduction audio controls' })).toBeTruthy();
    expect(within(band).getByText('Customer approved introduction')).toBeTruthy();
    expect(band.querySelectorAll('audio')).toHaveLength(2);
    expect(band.querySelector('audio')).toHaveAttribute('src', '/audio/studio/intro.mp3');
    expect(hero.querySelector('.tenant-introduction')).toBeNull();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(JSON.stringify(original)).toBe(snapshot);
  });

  it.each([undefined, 'in-hero', 'unsupported'])('keeps existing inline placement for %s', placement => {
    const { container } = render(<PublicTenantComposableSite site={site(placement)} />);
    expect(container.querySelector('.tenant-introduction-band')).toBeNull();
    expect(container.querySelectorAll('.tenant-hero .tenant-introduction')).toHaveLength(1);
    expect(screen.getAllByRole('group', { name: 'Introduction audio controls' })).toHaveLength(1);
  });

  it.each(['', '   '])('does not invent an introduction when only a recording URL or heading exists (%j)', narration => {
    const { container } = render(<PublicTenantComposableSite site={site('before-hero', narration)} />);
    expect(container.querySelector('.tenant-introduction-band')).toBeNull();
    expect(container.querySelector('audio')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Customer headline' })).toBeTruthy();
  });

  it('retains the natural-voice path for customers without supplied recordings', () => {
    render(<PublicTenantComposableSite site={site('before-hero', 'Spoken customer introduction', false)} />);
    const band = screen.getByRole('region', { name: 'A note from our studio' });
    expect(within(band).getByRole('button', { name: 'Listen to the introduction' })).toBeEnabled();
    expect(within(band).getByText('Spoken customer introduction')).toBeTruthy();
    expect(band.querySelector('audio')).toBeNull();
  });

  it('keeps saved-version review media inert in the separate band', () => {
    render(<TenantPreviewProvider websiteId="subscriber" readOnly><PublicTenantComposableSite site={site('before-hero')} /></TenantPreviewProvider>);
    const band = screen.getByRole('region', { name: 'A note from our studio' });
    for (const button of within(band).getAllByRole('button')) expect(button).toBeDisabled();
    for (const audio of band.querySelectorAll('audio')) expect(audio).not.toHaveAttribute('src');
    expect(within(band).getByText('Customer approved introduction')).toBeTruthy();
  });
});
