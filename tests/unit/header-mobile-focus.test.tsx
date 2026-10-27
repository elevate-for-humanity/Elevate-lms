// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HeaderMobileMenu from '@/components/site/HeaderMobileMenu.client';
import { renderToString } from 'react-dom/server';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));
vi.mock('@/components/site/SearchModal.client', () => ({ default: () => null }));
vi.mock('@/components/site/LanguageSwitcher.client', () => ({ default: () => null }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('does not accept a navigation tap before the server-rendered trigger is hydrated', () => {
  const server = document.createElement('div');
  server.innerHTML = renderToString(<HeaderMobileMenu items={[]} />);
  expect(server.querySelector('button[aria-label="Open menu"]')).toBeDisabled();
  render(<HeaderMobileMenu items={[]} />);
  const trigger = screen.getByRole('button', { name: 'Open menu' });
  expect(trigger).toBeEnabled();
  fireEvent.click(trigger);
  expect(screen.getByRole('dialog', { name: 'Menu' })).toBeVisible();
});

it('preserves initial focus and restores the trigger only after closing an opened menu', () => {
  const frames: FrameRequestCallback[] = [];
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => frames.push(callback)));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  render(<><a href="#content">Skip to content</a><HeaderMobileMenu items={[]} /></>);
  const skip = screen.getByRole('link', { name: 'Skip to content' });
  skip.focus();
  expect(frames).toHaveLength(0);
  expect(document.activeElement).toBe(skip);
  fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
  act(() => frames.splice(0).forEach(frame => frame(0)));
  expect(document.activeElement?.getAttribute('aria-label')).toBe('Close navigation');
  fireEvent.keyDown(document, { key: 'Escape' });
  act(() => frames.splice(0).forEach(frame => frame(0)));
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Open menu' }));
  expect(document.body.style.overflow).toBe('');
});
