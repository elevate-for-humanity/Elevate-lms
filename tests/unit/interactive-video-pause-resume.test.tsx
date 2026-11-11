import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import InteractiveVideoPlayer from '@/components/lms/InteractiveVideoPlayer';

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => {
    throw new Error('Read-only control test must not access learner records');
  },
}));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it('pauses actual media and resumes from the same position using media events for the button state', async () => {
  const view = render(
    <InteractiveVideoPlayer videoUrl="/lesson.mp4" title="HVAC lesson" readOnly />,
  );
  const video = view.container.querySelector('video')!;
  Object.defineProperty(video, 'paused', { configurable: true, writable: true, value: true });
  video.currentTime = 23;
  const play = vi.spyOn(video, 'play').mockImplementation(async () => {
    Object.defineProperty(video, 'paused', { configurable: true, writable: true, value: false });
    fireEvent.play(video);
  });
  const pause = vi.spyOn(video, 'pause').mockImplementation(() => {
    Object.defineProperty(video, 'paused', { configurable: true, writable: true, value: true });
    fireEvent.pause(video);
  });
  fireEvent.click(screen.getByRole('button', { name: 'Play lesson video' }));
  await screen.findByRole('button', { name: 'Pause lesson video' });
  fireEvent.click(screen.getByRole('button', { name: 'Pause lesson video' }));
  expect(pause).toHaveBeenCalledOnce();
  expect(video.paused).toBe(true);
  expect(video.currentTime).toBe(23);
  fireEvent.click(screen.getByRole('button', { name: 'Play lesson video' }));
  await screen.findByRole('button', { name: 'Pause lesson video' });
  expect(play).toHaveBeenCalledTimes(2);
  expect(video.currentTime).toBe(23);
});

it('keeps Play available when the browser rejects playback instead of claiming the video is playing', async () => {
  const view = render(
    <InteractiveVideoPlayer videoUrl="/lesson.mp4" title="HVAC lesson" readOnly />,
  );
  const video = view.container.querySelector('video')!;
  vi.spyOn(video, 'play').mockRejectedValue(
    new DOMException('User activation required', 'NotAllowedError'),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Play lesson video' }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Play lesson video' })).toBeVisible(),
  );
  expect(screen.queryByRole('button', { name: 'Pause lesson video' })).toBeNull();
});

it('expands the video together with its controls without replacing media or its position', async () => {
  const view = render(<InteractiveVideoPlayer videoUrl="/lesson.mp4" title="Full lesson" readOnly />);
  const video = view.container.querySelector('video')!;
  video.currentTime = 42;
  const surface = view.container.querySelector('[data-lesson-video-surface]')!;
  expect(surface).toContainElement(video);
  expect(surface.querySelector('[data-lesson-playback-controls]')).toBeInTheDocument();
  const requestFullscreen = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(surface, 'requestFullscreen', { configurable: true, value: requestFullscreen });
  fireEvent.click(screen.getByRole('button', { name: 'Open lesson video fullscreen' }));
  await waitFor(() => expect(requestFullscreen).toHaveBeenCalledOnce());
  expect(view.container.querySelector('video')).toBe(video);
  expect(video.currentTime).toBe(42);
});

it('provides the lesson expansion option when native full screen is unavailable or rejected', async () => {
  const view = render(<InteractiveVideoPlayer videoUrl="/lesson.mp4" title="Phone lesson" readOnly />);
  const button = screen.getByRole('button', { name: 'Open lesson video fullscreen' });
  fireEvent.click(button);
  expect(await screen.findByRole('alert')).toHaveTextContent('Full screen lesson');
  const surface = view.container.querySelector('[data-lesson-video-surface]')!;
  Object.defineProperty(surface, 'requestFullscreen', {
    configurable: true,
    value: vi.fn().mockRejectedValue(new DOMException('Denied', 'NotAllowedError')),
  });
  fireEvent.click(button);
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Full-screen video could not open'));
});

it('keeps audio lesson controls inside the same full-screen surface', async () => {
  const view = render(<InteractiveVideoPlayer videoUrl="/lesson.mp3" title="Audio lesson" readOnly />);
  const audio = view.container.querySelector('audio')!;
  const surface = view.container.querySelector('[data-lesson-video-surface]')!;
  expect(surface).toContainElement(audio);
  const requestFullscreen = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(surface, 'requestFullscreen', { configurable: true, value: requestFullscreen });
  fireEvent.click(screen.getByRole('button', { name: 'Open lesson video fullscreen' }));
  await waitFor(() => expect(requestFullscreen).toHaveBeenCalledOnce());
});
