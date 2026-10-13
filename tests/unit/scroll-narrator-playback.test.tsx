import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScrollNarrator } from '@/components/home/ScrollNarrator';

const voice = vi.hoisted(() => ({ play: vi.fn(), prepare: vi.fn(), stop: vi.fn() }));
vi.mock('next/navigation', () => ({ usePathname: () => '/' }));
vi.mock('@/components/voice/useNaturalVoice', () => ({
  useNaturalVoice: () => ({ ...voice, isLoading: false, isPlaying: false }),
  stopAllNaturalVoicePlayback: vi.fn(),
}));

let visible = 'a';
function setup() {
  const main = document.createElement('main');
  for (const id of ['a', 'b']) {
    const section = document.createElement('section');
    section.dataset.scrollNarration = '';
    section.dataset.narration = `Tour ${id}`;
    section.getBoundingClientRect = () => ({ top: visible === id ? 0 : 2000, bottom: visible === id ? 400 : 2400, height: 400 } as DOMRect);
    main.append(section);
  }
  document.body.append(main);
  render(<ScrollNarrator />);
}
async function advance(ms: number) { await act(async () => { vi.advanceTimersByTime(ms); }); }

describe('automatic page narration', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.clearAllMocks(); localStorage.clear(); visible = 'a'; voice.play.mockResolvedValue(true); voice.prepare.mockResolvedValue(true); });
  afterEach(() => { cleanup(); document.querySelectorAll('main').forEach((node) => node.remove()); vi.useRealTimers(); });
  it('can stop the guided mode after narration fails, without starting another request', async () => {
    voice.play.mockResolvedValue(false);
    setup(); await advance(1400);
    expect(screen.getByRole('status')).toHaveTextContent('Narration could not start');
    const requests = voice.play.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Stop page narration' }));
    expect(localStorage.getItem('elevate:scroll-narration')).toBe('off');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    visible = 'b'; fireEvent.scroll(window); await advance(3000);
    expect(voice.play).toHaveBeenCalledTimes(requests);
    expect(screen.getByRole('button', { name: 'Play narration for this section' })).toHaveAttribute('aria-pressed', 'false');
  });
  it('does not interrupt a user-started audible video on scroll', async () => {
    setup();
    const video = document.createElement('video');
    Object.defineProperty(video, 'paused', { value: false });
    video.muted = false; video.volume = 1;
    document.querySelector('main')!.append(video);
    await advance(1400);
    visible = 'b'; fireEvent.scroll(window); await advance(850);
    expect(voice.play).not.toHaveBeenCalled();
  });
  it('does not restart an autoplayed script on the first touch', async () => {
    setup(); await advance(1400);
    await act(async () => { fireEvent.pointerDown(document.body); });
    expect(voice.play).toHaveBeenCalledTimes(1);
  });
  it('does not replay a completed script when scrolling back to it', async () => {
    setup(); await advance(1400);
    visible = 'b'; fireEvent.scroll(window); await advance(850);
    visible = 'a'; fireEvent.scroll(window); await advance(850);
    expect(voice.play.mock.calls.map(([text]) => text)).toEqual(['Tour a', 'Tour b']);
  });
  it('allows the next touch to retry blocked autoplay', async () => {
    voice.play.mockResolvedValueOnce(false).mockResolvedValue(true);
    setup(); await advance(1400);
    await act(async () => { fireEvent.pointerDown(document.body); });
    expect(voice.play).toHaveBeenCalledTimes(2);
  });
  it('does not race a pending request against the first touch', async () => {
    let complete!: (started: boolean) => void;
    voice.play.mockReturnValue(new Promise<boolean>((resolve) => { complete = resolve; }));
    setup(); await advance(1400);
    await act(async () => { fireEvent.pointerDown(document.body); });
    expect(voice.play).toHaveBeenCalledTimes(1);
    await act(async () => { complete(true); });
  });
});
