import { act, cleanup, fireEvent, render } from '@testing-library/react';
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
