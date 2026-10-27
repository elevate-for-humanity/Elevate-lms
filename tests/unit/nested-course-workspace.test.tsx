import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ResizableWorkspace } from '@/components/studio/ResizableWorkspace';

let width = 390;
let observers: Array<() => void> = [];
beforeEach(() => {
  width = 390; observers = [];
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
    x: 0, y: 0, top: 0, left: 0, right: width, bottom: 700, width, height: 700, toJSON() { return {}; },
  }));
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: ResizeObserverCallback) { observers.push(() => callback([], this as unknown as ResizeObserver)); }
    observe() {} disconnect() {} unobserve() {}
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function Fixture() {
  const [open, setOpen] = useState(true);
  return <ResizableWorkspace title="Studio side panel" open onOpenChange={() => {}} mobileExclusive panel={
    <ResizableWorkspace title="Course side panel" open={open} onOpenChange={setOpen} stackedTabs primaryLabel="Build course" panelLabel="Lesson preview" panel={
      <video aria-label="Preview film" controls />
    }><label>Lesson draft<input defaultValue="Saved draft" /></label></ResizableWorkspace>
  }><p>Studio conversation</p></ResizableWorkspace>;
}

it('shows the builder instead of allocating two clipped mobile scroll boxes', () => {
  render(<Fixture />);
  expect(screen.getByRole('textbox', { name: 'Lesson draft' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Build course', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByLabelText('Preview film')).not.toBeVisible();
  expect(screen.queryByRole('separator', { name: 'Resize Course side panel' })).not.toBeInTheDocument();
});

it('switches the full mobile canvas without discarding the draft or replacing the player', () => {
  render(<Fixture />);
  const draft = screen.getByRole('textbox', { name: 'Lesson draft' });
  const player = screen.getByLabelText('Preview film');
  fireEvent.change(draft, { target: { value: 'Unsaved lesson' } });
  fireEvent.click(screen.getByRole('button', { name: 'Lesson preview', exact: true }));
  expect(player).toBeVisible(); expect(draft).not.toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Build course', exact: true }));
  expect(draft).toBeVisible(); expect(draft).toHaveValue('Unsaved lesson');
  expect(screen.getByLabelText('Preview film')).toBe(player);
});

it('restores the desktop split after resizing without resetting either workspace', () => {
  width = 1280; render(<Fixture />);
  const draft = screen.getByRole('textbox', { name: 'Lesson draft' });
  const player = screen.getByLabelText('Preview film');
  fireEvent.change(draft, { target: { value: 'Preserved while resizing' } });
  expect(screen.getByRole('separator', { name: 'Resize Course side panel' })).toBeVisible();
  act(() => { width = 390; observers.forEach(refresh => refresh()); });
  expect(screen.queryByRole('separator', { name: 'Resize Course side panel' })).not.toBeInTheDocument();
  act(() => { width = 1280; observers.forEach(refresh => refresh()); });
  expect(draft).toBeVisible(); expect(player).toBeVisible();
  expect(draft).toHaveValue('Preserved while resizing');
  expect(screen.getByLabelText('Preview film')).toBe(player);
});
