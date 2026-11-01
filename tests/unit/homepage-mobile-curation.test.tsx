import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { HomeFeaturedHostShop } from '@/components/home/HomeFeaturedHostShop';
import { HomeCareerPathways } from '@/components/home/HomeCareerPathways';
import { HomeEmployerStrip } from '@/components/home/HomeEmployerStrip';
import { ResponsiveDetails } from '@/components/ui/ResponsiveDetails';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('homepage curation', () => {
  it('groups beauty programs and Host Shop recruitment while keeping the complete career photo visible', () => {
    const root = document.createElement('div');
    root.innerHTML = renderToStaticMarkup(
      <>
        <HomeCareerPathways />
        <HomeFeaturedHostShop />
        <HomeEmployerStrip />
      </>,
    );
    const beauty = root.querySelector('#barber-beauty-network')!;
    for (const program of ['barber', 'cosmetology', 'esthetician', 'nail-technician']) {
      expect(beauty.querySelector(`a[href="/programs/${program}-apprenticeship"]`)).not.toBeNull();
    }
    const recruit = [...root.querySelectorAll('a[href="/partners/host-shops"]')];
    expect(recruit).toHaveLength(1);
    expect(beauty.contains(recruit[0])).toBe(true);
    expect(beauty.querySelector('a[href="/programs"]')).toBeNull();
    expect(
      beauty.querySelector('[data-beauty-programs]')!.compareDocumentPosition(recruit[0]) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    const photo = root.querySelector(
      'img[alt="Illustrative HVAC technician prepared for hands-on work"]',
    )!;
    expect(beauty.contains(photo)).toBe(false);
    expect(photo.className).toContain('object-contain');
    for (const photo of beauty.querySelectorAll('[data-beauty-programs] img')) {
      expect(photo.className).toContain('object-contain');
    }
  });

  it('renders the current featured shops once with one photo and the correct destination each', () => {
    const root = document.createElement('div');
    root.innerHTML = renderToStaticMarkup(<HomeFeaturedHostShop />);
    const cards = [...root.querySelectorAll('[data-featured-shop]')];
    expect(cards.map((card) => card.getAttribute('data-featured-shop'))).toEqual([
      'Cal’s Kutz Studio',
      'Kountry Kutz Barbershop',
      'Salon Saloon',
      'Top Shelf Barber Lounge',
    ]);
    expect(cards.map((card) => card.querySelector('a')?.getAttribute('href'))).toEqual([
      '/host-shops/cals-kutz-studio',
      '/host-shops/kountry-kutz-barbershop',
      '/host-shops/salon-saloon',
      '/host-shops/top-shelf-barber-lounge',
    ]);
    expect(new Set(cards.map((card) => card.getAttribute('data-featured-shop'))).size).toBe(4);
    expect(new Set(cards.map((card) => card.querySelector('img')?.getAttribute('src'))).size).toBe(
      4,
    );
    for (const card of cards) {
      expect(card.querySelectorAll('img').length).toBe(1);
      expect(card.querySelector('img')?.getAttribute('alt')).toBeTruthy();
    }
    const grid = root.querySelector('[data-featured-shops]');
    expect(grid?.getAttribute('data-mobile-grid')).toBeNull();
    expect(grid?.className).toContain('grid-cols-1');
    expect(grid?.className).toContain('sm:grid-cols-2');
    expect(grid?.className).toContain('lg:grid-cols-3');
  });

  it('keeps visual career sections and the program-specific funding notice', () => {
    for (const file of [
      'components/home/HomeCareerPathways.tsx',
      'components/home/HomeFinalCTA.tsx',
    ]) {
      expect(source(file)).toMatch(/<Image\b/);
    }
    expect(source('components/home/HomeFinalCTA.tsx')).toContain(
      '/images/programs/refresh-20261101/home.webp',
    );
    const pathways = source('components/home/HomeCareerPathways.tsx');
    for (const image of ['cdl-training-vibrant-2026.webp', 'refresh-20261101/business.webp']) {
      expect(pathways).toContain(image);
    }
    expect(pathways).not.toContain('/programs/bookkeeping');
    const page = source('apps/marketing/app/page.tsx');
    expect(page).not.toContain('<HomePlatformOverview />');
    expect(source('components/programs/HvacTrainingShowcase.tsx')).toContain(
      'WORKONE_INDY_BOOKING_URL',
    );
    expect(pathways).not.toContain("slug: 'hvac-technician'");
    expect(source('components/programs/HvacTrainingShowcase.tsx')).toContain(
      'WorkOne reviews funding eligibility; funding is not guaranteed.',
    );
  });

  it('keeps mobile overrides scoped away from operational dashboards', () => {
    const css = source('styles/marketing-mobile-density.css');
    expect(css).toContain('#main-content.site-main main');
    expect(css).toContain("[data-mobile-grid='2']");
    expect(css).toContain('.responsive-details-panel[hidden]');
    expect(source('components/site/MarketingChromeBoundary.tsx')).toContain(
      "import '@/styles/marketing-mobile-density.css'",
    );
  });
});

describe('responsive details', () => {
  it('keeps the full content in server output for no-JavaScript browsing', () => {
    const html = renderToStaticMarkup(
      <ResponsiveDetails title="Enrollment steps">
        <p>Complete enrollment information</p>
      </ResponsiveDetails>,
    );
    expect(html).toContain('Complete enrollment information');
    expect(html).not.toMatch(/\shidden[=\s>]/);
  });

  it('supports mobile disclosure, desktop expansion, resize, and cleanup', () => {
    let desktop = false;
    const listeners = new Set<() => void>();
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        get matches() {
          return desktop;
        },
        media: '(min-width: 768px)',
        onchange: null,
        addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
        removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => true,
      })),
    );
    const view = render(
      <ResponsiveDetails title="Enrollment steps">
        <p>Complete enrollment information</p>
      </ResponsiveDetails>,
    );
    const summary = screen.getByText('Enrollment steps').closest('summary')!;
    const details = summary.parentElement as HTMLDetailsElement;
    const panel = screen.getByText('Complete enrollment information').parentElement!;
    expect(summary.getAttribute('aria-controls')).toBe(panel.id);
    expect(details.open).toBe(false);
    act(() => {
      details.open = true;
      fireEvent(details, new Event('toggle'));
    });
    expect(details.open).toBe(true);
    act(() => {
      details.open = false;
      fireEvent(details, new Event('toggle'));
    });
    expect(details.open).toBe(false);
    act(() => {
      desktop = true;
      listeners.forEach((listener) => listener());
    });
    expect(details.open).toBe(true);
    act(() => {
      desktop = false;
      listeners.forEach((listener) => listener());
    });
    expect(details.open).toBe(false);
    view.unmount();
    expect(listeners.size).toBe(0);
  });
});
