import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { HomeFeaturedHostShop } from '@/components/home/HomeFeaturedHostShop';
import { ResponsiveDetails } from '@/components/ui/ResponsiveDetails';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('homepage curation', () => {
  it('renders precisely four existing shops with one photo and destination each', () => {
    const root = document.createElement('div');
    root.innerHTML = renderToStaticMarkup(<HomeFeaturedHostShop />);
    const cards = [...root.querySelectorAll('[data-featured-shop]')];
    expect(cards.map((card) => card.getAttribute('data-featured-shop'))).toEqual([
      "Cal's Kutz Studio", "Razor's Image Barbershop", 'Salon Saloon', 'Kountry Kutz Barbershop',
    ]);
    expect(root.querySelectorAll('img').length).toBe(4);
    for (const card of cards) {
      expect(card.querySelectorAll('img').length).toBe(1);
      expect(card.querySelector('img')?.getAttribute('alt')).toBeTruthy();
      expect(card.querySelector('a')?.getAttribute('href')).toMatch(/^\/host-shops\//);
    }
    expect(root.querySelector('[data-featured-shops]')?.getAttribute('data-mobile-grid')).toBe('2');
  });

  it('does not reintroduce stock-photo sections or the platform-operations wall', () => {
    for (const file of ['components/home/HomeCareerPathways.tsx', 'components/home/HomeFinalCTA.tsx']) {
      expect(source(file)).not.toMatch(/<Image\b|<img\b|\/images\//);
    }
    const page = source('apps/marketing/app/page.tsx');
    expect(page).not.toContain('<HomePlatformOverview');
    expect(page).toContain('WORKONE_INDY_BOOKING_URL');
    expect(page).toContain('eligibility and program requirements apply');
  });

  it('keeps mobile overrides scoped away from operational dashboards', () => {
    const css = source('styles/marketing-mobile-density.css');
    expect(css).toContain('#main-content.site-main main');
    expect(css).toContain("[data-mobile-grid='2']");
    expect(css).toContain('.responsive-details-panel[hidden]');
    expect(source('components/site/MarketingChromeBoundary.tsx')).toContain("import '@/styles/marketing-mobile-density.css'");
  });
});

describe('responsive details', () => {
  it('keeps the full content in server output for no-JavaScript browsing', () => {
    const html = renderToStaticMarkup(<ResponsiveDetails title="Enrollment steps"><p>Complete enrollment information</p></ResponsiveDetails>);
    expect(html).toContain('Complete enrollment information');
    expect(html).not.toMatch(/\shidden[=\s>]/);
  });

  it('supports mobile disclosure, desktop expansion, resize, and cleanup', () => {
    let desktop = false;
    const listeners = new Set<() => void>();
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      get matches() { return desktop; },
      media: '(min-width: 768px)', onchange: null,
      addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
      addListener: () => {}, removeListener: () => {}, dispatchEvent: () => true,
    })));
    const view = render(<ResponsiveDetails title="Enrollment steps"><p>Complete enrollment information</p></ResponsiveDetails>);
    const button = screen.getByRole('button', { name: 'Enrollment steps' });
    const panel = screen.getByText('Complete enrollment information').parentElement!;
    expect(button.getAttribute('aria-controls')).toBe(panel.id);
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(panel.hidden).toBe(true);
    fireEvent.click(button);
    expect(panel.hidden).toBe(false);
    fireEvent.click(button);
    expect(panel.hidden).toBe(true);
    act(() => { desktop = true; listeners.forEach((listener) => listener()); });
    expect(panel.hidden).toBe(false);
    act(() => { desktop = false; listeners.forEach((listener) => listener()); });
    expect(panel.hidden).toBe(true);
    view.unmount();
    expect(listeners.size).toBe(0);
  });
});
