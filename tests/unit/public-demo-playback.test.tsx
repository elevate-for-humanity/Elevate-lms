import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import InteractiveDemoPlayer from '@/components/demo/InteractiveDemoPlayer';
import { MediaPlaybackCoordinator } from '@/components/media/MediaPlaybackCoordinator';
const scenes = [{ id: 'intro', title: 'Platform overview', description: 'A guided demo', videoSrc: '/videos/demo.mp4', poster: '/poster.webp', choices: [] }];
afterEach(() => { cleanup(); document.querySelectorAll('video').forEach(v => v.remove()); vi.restoreAllMocks(); });
describe('public demo playback', () => {
  it('offers Play before metadata loads when mobile autoplay is blocked', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockRejectedValue(new DOMException('Gesture required', 'NotAllowedError'));
    await act(async () => { render(<InteractiveDemoPlayer scenes={scenes} startSceneId="intro" portalLabel="Demo" />); });
    expect(screen.getByRole('status')).toHaveTextContent('Tap Play');
    play.mockResolvedValue();
    fireEvent.click(screen.getByRole('button', { name: 'Play Platform overview demo' }));
    expect(play).toHaveBeenCalledTimes(2);
  });
  it('reports media failure with a retry instead of a silent poster', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    const { container } = render(<InteractiveDemoPlayer scenes={scenes} startSceneId="intro" portalLabel="Demo" />);
    fireEvent.error(container.querySelector('video')!);
    expect(screen.getByRole('alert')).toHaveTextContent('could not load');
    expect(screen.getByRole('button', { name: 'Retry video' })).toBeVisible();
  });
  it('does not let silent autoplay pause an active demo', () => {
    render(<MediaPlaybackCoordinator />);
    const demo = document.createElement('video');
    const hero = document.createElement('video');
    hero.muted = true;
    Object.defineProperty(demo, 'paused', { value: false });
    demo.pause = vi.fn();
    document.body.append(demo, hero);
    fireEvent.play(hero);
    expect(demo.pause).not.toHaveBeenCalled();
    const selected = document.createElement('video');
    document.body.append(selected);
    fireEvent.play(selected);
    expect(demo.pause).toHaveBeenCalledTimes(1);
  });
});
