import { afterEach, describe, expect, it, vi } from 'vitest';
import { speakNaturalVoice, stopAllNaturalVoicePlayback } from '@/components/voice/useNaturalVoice';

describe('exclusive natural voice playback', () => {
  afterEach(() => { stopAllNaturalVoicePlayback(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
  it('cancels a pending standalone narration before its audio arrives', async () => {
    let resolve!: (response: Response) => void;
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((done) => { resolve = done; })));
    const play = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('Audio', class { preload = ''; playbackRate = 1; play = play; pause = vi.fn(); addEventListener = vi.fn(); });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:pending');
    const pending = speakNaturalVoice('Pending narration exclusivity test');
    stopAllNaturalVoicePlayback();
    resolve(new Response(new Blob(['audio'])));
    expect(await pending).toBe(false);
    expect(play).not.toHaveBeenCalled();
  });
  it('stops standalone audio when another section takes ownership', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(new Blob(['audio']))));
    const pause = vi.fn();
    vi.stubGlobal('Audio', class { preload = ''; playbackRate = 1; play = vi.fn().mockResolvedValue(undefined); pause = pause; addEventListener = vi.fn(); });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:playing');
    expect(await speakNaturalVoice('Playing narration exclusivity test')).toBe(true);
    stopAllNaturalVoicePlayback();
    expect(pause).toHaveBeenCalledOnce();
  });
});
