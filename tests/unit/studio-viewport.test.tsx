// @vitest-environment jsdom
import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useStudioViewport } from '../../components/studio/useStudioViewport';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function setup() {
  const viewport = Object.assign(new EventTarget(), { height: 780, offsetTop: 0, scale: 1 });
  vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(390);
  vi.stubGlobal('visualViewport', viewport);
  let pending: FrameRequestCallback | null = null;
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    pending = callback;
    return 1;
  });
  const flush = () => {
    const callback = pending;
    pending = null;
    callback?.(0);
  };
  function Workspace() {
    const style = useStudioViewport();
    const [draft, setDraft] = useState('');
    return (
      <div data-testid="workspace" style={style}>
        <textarea
          aria-label="Draft"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
      </div>
    );
  }
  render(<Workspace />);
  return { viewport, flush };
}

it('keeps the composer in the visible viewport and preserves a draft when the keyboard opens', () => {
  const { viewport, flush } = setup();
  fireEvent.change(screen.getByLabelText('Draft'), { target: { value: 'Keep my course request' } });
  viewport.height = 420;
  viewport.offsetTop = 12;
  act(() => {
    viewport.dispatchEvent(new Event('resize'));
    flush();
  });
  expect(screen.getByTestId('workspace').style.height).toBe('420px');
  expect(screen.getByTestId('workspace').style.top).toBe('12px');
  expect((screen.getByLabelText('Draft') as HTMLTextAreaElement).value).toBe(
    'Keep my course request',
  );
});

it('does not fight pinch zoom', () => {
  const { viewport, flush } = setup();
  viewport.scale = 2;
  viewport.height = 200;
  act(() => {
    viewport.dispatchEvent(new Event('resize'));
    flush();
  });
  expect(screen.getByTestId('workspace').style.height).toBe('780px');
});

it('uses normal document layout on desktop', () => {
  const { flush } = setup();
  vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1350);
  act(() => {
    window.dispatchEvent(new Event('resize'));
    flush();
  });
  expect(screen.getByTestId('workspace').style.position).toBe('');
});
