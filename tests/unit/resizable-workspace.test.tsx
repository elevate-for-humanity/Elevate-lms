import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ResizableWorkspace } from '@/components/studio/ResizableWorkspace';

let width = 1200;
let onResize: () => void;
function Workspace() {
  const [open, setOpen] = useState(true);
  return (
    <ResizableWorkspace
      title="Browser"
      open={open}
      onOpenChange={setOpen}
      panel={<iframe title="Browser session" src="about:blank" />}
    >
      <label>
        Draft
        <input defaultValue="Unsaved lesson" />
      </label>
    </ResizableWorkspace>
  );
}
beforeEach(() => {
  width = 1200;
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
    width,
    height: 800,
    left: 0,
    right: width,
    top: 0,
    bottom: 800,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  }));
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: () => void) {
        onResize = callback;
      }
      observe() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Resizable workspace', () => {
  it('preserves the editor draft and the same browser frame through close, reopen, expand and Escape', () => {
    render(<Workspace />);
    const input = screen.getByRole('textbox', { name: 'Draft' });
    const frame = screen.getByTitle('Browser session');
    fireEvent.change(input, { target: { value: 'Keep my changes' } });
    fireEvent.click(screen.getByRole('button', { name: 'Close Browser' }));
    expect(frame).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Browser' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Open Browser' }));
    expect(screen.getByTitle('Browser session')).toBe(frame);
    fireEvent.click(screen.getByRole('button', { name: 'Expand panel' }));
    expect(screen.queryByRole('textbox', { name: 'Draft' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Make Browser bigger' })).toBeDisabled();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByRole('textbox', { name: 'Draft' })).toBe(input);
    expect(input).toHaveValue('Keep my changes');
    expect(screen.getByTitle('Browser session')).toBe(frame);
  });

  it('resizes with buttons and keyboard without allowing either pane to disappear', () => {
    render(<Workspace />);
    const divider = screen.getByRole('separator', { name: 'Resize Browser' });
    expect(divider).toHaveAttribute('aria-orientation', 'vertical');
    fireEvent.click(screen.getByRole('button', { name: 'Make Browser bigger' }));
    expect(divider).toHaveAttribute('aria-valuenow', '50');
    fireEvent.keyDown(divider, { key: 'ArrowRight' });
    expect(divider).toHaveAttribute('aria-valuenow', '45');
    fireEvent.keyDown(divider, { key: 'Home' });
    fireEvent.click(screen.getByRole('button', { name: 'Make Browser smaller' }));
    expect(divider).toHaveAttribute('aria-valuenow', '25');
    fireEvent.keyDown(divider, { key: 'End' });
    fireEvent.click(screen.getByRole('button', { name: 'Make Browser bigger' }));
    expect(divider).toHaveAttribute('aria-valuenow', '75');
  });

  it('switches resize direction with the available panel width, preserving desktop sizing', () => {
    render(<Workspace />);
    const divider = screen.getByRole('separator');
    fireEvent.click(screen.getByRole('button', { name: 'Make Browser bigger' }));
    width = 600;
    act(() => onResize());
    expect(divider).toHaveAttribute('aria-orientation', 'horizontal');
    fireEvent.keyDown(divider, { key: 'ArrowUp' });
    expect(divider).toHaveAttribute('aria-valuetext', '50 percent tall');
    width = 1200;
    act(() => onResize());
    expect(divider).toHaveAttribute('aria-valuetext', '50 percent wide');
  });

  it('drags the divider within bounds and stops tracking after pointer release', () => {
    vi.stubGlobal('PointerEvent', MouseEvent);
    render(<Workspace />);
    const divider = screen.getByRole('separator');
    Object.assign(divider, {
      setPointerCapture: vi.fn(),
      hasPointerCapture: () => true,
      releasePointerCapture: vi.fn(),
    });
    fireEvent.pointerDown(divider, { button: 0, clientX: 660 });
    fireEvent.pointerMove(divider, { clientX: 480 });
    expect(divider).toHaveAttribute('aria-valuenow', '60');
    fireEvent.pointerMove(divider, { clientX: 0 });
    expect(divider).toHaveAttribute('aria-valuenow', '75');
    fireEvent.pointerUp(divider);
    fireEvent.pointerMove(divider, { clientX: 960 });
    expect(divider).toHaveAttribute('aria-valuenow', '75');
    width = 600;
    act(() => onResize());
    fireEvent.pointerDown(divider, { button: 0, clientY: 440 });
    fireEvent.pointerMove(divider, { clientY: 320 });
    expect(divider).toHaveAttribute('aria-valuetext', '60 percent tall');
  });
});
