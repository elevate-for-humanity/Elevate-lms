// Native fetch Response bodies avoid mixing Node 22 fetch with jsdom Blob implementations.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { playNaturalVoiceNotification, speakNaturalVoice, stopAllNaturalVoicePlayback, useNaturalVoice } from '@/components/voice/useNaturalVoice';

describe('exclusive natural voice playback', () => {
  afterEach(() => { cleanup(); stopAllNaturalVoicePlayback(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
  it('distinguishes browser autoplay permission from an unavailable narration service', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('audio', { headers: { 'Content-Type': 'audio/mpeg' } })));
    vi.stubGlobal('Audio', class {
      preload = ''; playbackRate = 1; pause = vi.fn(); addEventListener = vi.fn();
      play = vi.fn().mockRejectedValue(new DOMException('Gesture required', 'NotAllowedError'));
    });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:blocked-playback');
    const blocked = vi.fn(); const unavailable = vi.fn();
    const { result } = renderHook(() => useNaturalVoice());
    await act(async () => {
      expect(await result.current.play('Autoplay permission audit', { onPlaybackBlocked: blocked, onError: unavailable })).toBe(false);
    });
    expect(blocked).toHaveBeenCalledOnce();
    expect(unavailable).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('unavailable', { status: 503 })));
    await act(async () => {
      expect(await result.current.play('Actual unavailable narration audit', { onPlaybackBlocked: blocked, onError: unavailable })).toBe(false);
    });
    expect(blocked).toHaveBeenCalledOnce();
    expect(unavailable).toHaveBeenCalledOnce();
    expect(result.current.error).toMatch(/unavailable/);
  });
  it('does not interrupt existing audio when announcing a PWA event', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('audio', { headers: { 'Content-Type': 'audio/mpeg' } })));
    const play = vi.fn().mockResolvedValue(undefined);
    const pause = vi.fn();
    vi.stubGlobal('Audio', class {
      preload = '';
      playbackRate = 1;
      volume = 1;
      addEventListener = vi.fn();
      play = play;
      pause = pause;
    });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:alert-independent');
    const interrupted = vi.spyOn(window, 'dispatchEvent');
    expect(await playNaturalVoiceNotification('Notification: a new email was received.', 0.6)).toBe(true);
    expect(play).toHaveBeenCalledOnce();
    expect(pause).not.toHaveBeenCalled();
    expect(interrupted).not.toHaveBeenCalled();
  });
  it('cancels a pending standalone narration before its audio arrives', async () => {
    let resolve!: (response: Response) => void;
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((done) => { resolve = done; })));
    const play = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('Audio', class { preload = ''; playbackRate = 1; play = play; pause = vi.fn(); addEventListener = vi.fn(); });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:pending');
    const pending = speakNaturalVoice('Pending narration exclusivity test');
    stopAllNaturalVoicePlayback();
    resolve(new Response('audio', { headers: { 'Content-Type': 'audio/mpeg' } }));
    expect(await pending).toBe(false);
    expect(play).not.toHaveBeenCalled();
  });
  it('stops standalone audio when another section takes ownership', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('audio', { headers: { 'Content-Type': 'audio/mpeg' } })));
    const pause = vi.fn();
    vi.stubGlobal('Audio', class { preload = ''; playbackRate = 1; play = vi.fn().mockResolvedValue(undefined); pause = pause; addEventListener = vi.fn(); });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:playing');
    expect(await speakNaturalVoice('Playing narration exclusivity test')).toBe(true);
    stopAllNaturalVoicePlayback();
    expect(pause).toHaveBeenCalledOnce();
  });
});
