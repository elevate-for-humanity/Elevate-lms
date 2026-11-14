import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ProductionPanelLayout from '@/components/admin/course-builder/ProductionPanelLayout';

let width = 640;
let observers: Array<() => void> = [];
beforeEach(() => {
  width = 640;
  observers = [];
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
    x: 0, y: 0, top: 0, left: 0, right: width, bottom: 800, width, height: 800, toJSON() { return {}; },
  }));
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: ResizeObserverCallback) { observers.push(() => callback([], this as unknown as ResizeObserver)); }
    observe() {} disconnect() {} unobserve() {}
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function Fixture() {
  return <ProductionPanelLayout outline={<button>Choose lesson</button>} operations={<button>Resume course</button>}>
    <video aria-label="Saved lesson film" /><input aria-label="Lesson draft" defaultValue="Unsaved draft" />
  </ProductionPanelLayout>;
}

it('uses the available pane width and exposes one complete work view inside a desktop split', () => {
  render(<Fixture />);
  expect(screen.getByRole('textbox', { name: 'Lesson draft' })).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Resume course' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Choose lesson' })).toBeNull();
  expect(screen.queryAllByRole('separator')).toHaveLength(0);
  fireEvent.click(screen.getByRole('button', { name: 'Outline', exact: true }));
  expect(screen.getByRole('button', { name: 'Choose lesson' })).toBeVisible();
  expect(screen.queryByRole('textbox', { name: 'Lesson draft' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Operations', exact: true }));
  expect(screen.getByRole('button', { name: 'Resume course' })).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Choose lesson' })).toBeNull();
});

it('preserves the editor, player and desktop panel choices across compact navigation and resize', () => {
  width = 1200;
  render(<Fixture />);
  const draft = screen.getByRole('textbox', { name: 'Lesson draft' });
  const video = screen.getByLabelText('Saved lesson film');
  fireEvent.click(screen.getByRole('button', { name: 'Close Production operations' }));
  act(() => { width = 640; observers.forEach(update => update()); });
  fireEvent.click(screen.getByRole('button', { name: 'Operations', exact: true }));
  expect(screen.getByRole('button', { name: 'Resume course' })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Preview', exact: true }));
  expect(screen.getByRole('textbox', { name: 'Lesson draft' })).toBe(draft);
  expect(draft).toHaveValue('Unsaved draft');
  expect(screen.getByLabelText('Saved lesson film')).toBe(video);
  act(() => { width = 1200; observers.forEach(update => update()); });
  expect(screen.queryByRole('button', { name: 'Resume course' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Choose lesson' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Open Production operations' })).toBeVisible();
});
