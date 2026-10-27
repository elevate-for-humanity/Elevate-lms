import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }),
}));
import Player from '@/components/lms/InteractiveVideoPlayer';
afterEach(cleanup);
it('toggles the synchronized VTT track without adding a whole-transcript overlay', () => {
  const { container } = render(
    <Player
      videoUrl="/lesson.mp4"
      captionsUrl="/lesson.vtt"
      title="Lesson"
      transcript={[{ start: 0, end: 30, text: 'A complete teaching paragraph.' }]}
    />,
  );
  const video = container.querySelector('video')!;
  const track = { kind: 'captions', mode: 'disabled' };
  Object.defineProperty(video, 'textTracks', { configurable: true, value: [track] });
  expect(container.querySelector('track')?.hasAttribute('default')).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: 'Show lesson captions' }));
  expect(track.mode).toBe('showing');
  expect(screen.getAllByText('A complete teaching paragraph.')).toHaveLength(1); // transcript only
  fireEvent.click(screen.getByRole('button', { name: 'Hide lesson captions' }));
  expect(track.mode).toBe('disabled');
});
