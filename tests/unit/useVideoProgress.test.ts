/**
 * Unit tests for hooks/useVideoProgress
 *
 * Covers:
 * - localStorage key namespacing (user+lesson identity)
 * - Malformed saved value clamping (NaN, negative, beyond duration)
 * - Resume restore lifecycle (loadedmetadata, readyState)
 * - Periodic save throttling
 * - Clear on natural end
 * - Persist on unmount mid-lesson
 * - Completion reporting to /api/progress
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRef } from 'react';
import { useVideoProgress } from '@/hooks/useVideoProgress';

// ── localStorage mock ─────────────────────────────────────────────────────────

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: () => { store = {}; },
    _store: () => store,
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

// ── fetch mock ────────────────────────────────────────────────────────────────

const fetchMock = vi.fn().mockResolvedValue({ ok: true });
globalThis.fetch = fetchMock;

// ── Video element factory ─────────────────────────────────────────────────────

function makeVideo(overrides: Partial<HTMLVideoElement> = {}): HTMLVideoElement {
  const listeners: Record<string, EventListener[]> = {};
  const video = {
    currentTime: 0,
    duration: 120,
    readyState: 4, // HAVE_ENOUGH_DATA — metadata already loaded
    addEventListener: vi.fn((event: string, handler: EventListener) => {
      listeners[event] = listeners[event] ?? [];
      listeners[event].push(handler);
    }),
    removeEventListener: vi.fn((event: string, handler: EventListener) => {
      listeners[event] = (listeners[event] ?? []).filter((h) => h !== handler);
    }),
    _emit: (event: string) => {
      (listeners[event] ?? []).forEach((h) => h(new Event(event)));
    },
    _listeners: listeners,
    ...overrides,
  } as unknown as HTMLVideoElement;
  return video;
}

// ── Helper: render hook with a video ref ─────────────────────────────────────

function setup(
  video: HTMLVideoElement,
  options: Parameters<typeof useVideoProgress>[1] = {}
) {
  return renderHook(() => {
    const ref = useRef<HTMLVideoElement>(video);
    useVideoProgress(ref, options);
  });
}

// ─────────────────────────────────────────────────────────────────────────────

describe('useVideoProgress — storage key namespacing', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('uses lessonId in the storage key', () => {
    const video = makeVideo();
    setup(video, { lessonId: 'lesson-abc-123' });

    act(() => {
      video.currentTime = 30;
      (video as ReturnType<typeof makeVideo>)._emit('timeupdate');
      video.currentTime = 35;
      (video as ReturnType<typeof makeVideo>)._emit('timeupdate');
    });

    const keys = localStorageMock.setItem.mock.calls.map(([k]: [string]) => k);
    expect(keys.every((k: string) => k.includes('lesson-abc-123'))).toBe(true);
  });

  it('includes userId in the storage key when provided', () => {
    const video = makeVideo();
    setup(video, { lessonId: 'lesson-1', userId: 'user-xyz' });

    act(() => {
      video.currentTime = 10;
      (video as ReturnType<typeof makeVideo>)._emit('timeupdate');
      video.currentTime = 15;
      (video as ReturnType<typeof makeVideo>)._emit('timeupdate');
    });

    const keys = localStorageMock.setItem.mock.calls.map(([k]: [string]) => k);
    expect(keys.every((k: string) => k.includes('user-xyz') && k.includes('lesson-1'))).toBe(true);
  });

  it('two different users on the same lesson write to different keys', () => {
    const video1 = makeVideo();
    const video2 = makeVideo();

    setup(video1, { lessonId: 'lesson-shared', userId: 'user-A' });
    setup(video2, { lessonId: 'lesson-shared', userId: 'user-B' });

    act(() => {
      video1.currentTime = 10;
      (video1 as ReturnType<typeof makeVideo>)._emit('timeupdate');
      video1.currentTime = 15;
      (video1 as ReturnType<typeof makeVideo>)._emit('timeupdate');

      video2.currentTime = 20;
      (video2 as ReturnType<typeof makeVideo>)._emit('timeupdate');
      video2.currentTime = 25;
      (video2 as ReturnType<typeof makeVideo>)._emit('timeupdate');
    });

    const keys = localStorageMock.setItem.mock.calls.map(([k]: [string]) => k);
    const userAKeys = keys.filter((k: string) => k.includes('user-A'));
    const userBKeys = keys.filter((k: string) => k.includes('user-B'));

    expect(userAKeys.length).toBeGreaterThan(0);
    expect(userBKeys.length).toBeGreaterThan(0);
    // Keys must be disjoint
    expect(userAKeys.some((k: string) => userBKeys.includes(k))).toBe(false);
  });

  it('falls back to lessonId-only key when userId is not provided', () => {
    const video = makeVideo();
    setup(video, { lessonId: 'lesson-anon' }); // no userId

    act(() => {
      video.currentTime = 10;
      (video as ReturnType<typeof makeVideo>)._emit('timeupdate');
      video.currentTime = 15;
      (video as ReturnType<typeof makeVideo>)._emit('timeupdate');
    });

    const keys = localStorageMock.setItem.mock.calls.map(([k]: [string]) => k);
    // Key should be video_resume_lesson-anon, not contain any user segment
    expect(keys.every((k: string) => k === 'video_resume_lesson-anon')).toBe(true);
  });

  it('different lessonIds write to different keys', () => {
    const video1 = makeVideo();
    const video2 = makeVideo();

    setup(video1, { lessonId: 'lesson-1' });
    setup(video2, { lessonId: 'lesson-2' });

    act(() => {
      video1.currentTime = 10;
      (video1 as ReturnType<typeof makeVideo>)._emit('timeupdate');
      video1.currentTime = 15;
      (video1 as ReturnType<typeof makeVideo>)._emit('timeupdate');

      video2.currentTime = 20;
      (video2 as ReturnType<typeof makeVideo>)._emit('timeupdate');
      video2.currentTime = 25;
      (video2 as ReturnType<typeof makeVideo>)._emit('timeupdate');
    });

    const keys = localStorageMock.setItem.mock.calls.map(([k]: [string]) => k);
    expect(keys.some((k: string) => k.includes('lesson-1'))).toBe(true);
    expect(keys.some((k: string) => k.includes('lesson-2'))).toBe(true);
  });
});

describe('useVideoProgress — malformed saved value clamping', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  const BAD_VALUES = ['NaN', '-5', '0', '1', '119', '120', '999', 'not-a-number', ''];

  for (const bad of BAD_VALUES) {
    it(`ignores saved value "${bad}"`, () => {
      localStorageMock.getItem.mockReturnValueOnce(bad);
      const video = makeVideo({ currentTime: 0, duration: 120, readyState: 4 } as Partial<HTMLVideoElement>);
      setup(video, { lessonId: 'lesson-x' });

      // currentTime should remain 0 — hook must not set it to a bad value
      expect(video.currentTime).toBe(0);
    });
  }

  it('restores a valid mid-video position', () => {
    localStorageMock.getItem.mockReturnValueOnce('45');
    const video = makeVideo({ currentTime: 0, duration: 120, readyState: 4 } as Partial<HTMLVideoElement>);
    setup(video, { lessonId: 'lesson-y' });

    expect(video.currentTime).toBe(45);
  });

  it('does not restore if saved time >= duration - 2 (video effectively finished)', () => {
    localStorageMock.getItem.mockReturnValueOnce('119');
    const video = makeVideo({ currentTime: 0, duration: 120, readyState: 4 } as Partial<HTMLVideoElement>);
    setup(video, { lessonId: 'lesson-z' });

    expect(video.currentTime).toBe(0);
  });
});

describe('useVideoProgress — restore via loadedmetadata', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('waits for loadedmetadata when readyState < 1', () => {
    localStorageMock.getItem.mockReturnValueOnce('60');
    // readyState 0 = HAVE_NOTHING — metadata not yet loaded
    const video = makeVideo({ currentTime: 0, duration: 0, readyState: 0 } as Partial<HTMLVideoElement>);
    setup(video, { lessonId: 'lesson-meta' });

    // Before metadata fires, currentTime must not be set
    expect(video.currentTime).toBe(0);

    // Simulate metadata loading
    act(() => {
      (video as unknown as { duration: number }).duration = 120;
      (video as ReturnType<typeof makeVideo>)._emit('loadedmetadata');
    });

    expect(video.currentTime).toBe(60);
  });
});

describe('useVideoProgress — save throttling', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('does not save on every timeupdate — only after saveIntervalSeconds', () => {
    const video = makeVideo();
    setup(video, { lessonId: 'lesson-throttle', saveIntervalSeconds: 10 });

    act(() => {
      // Advance 3 seconds — below 10s threshold
      video.currentTime = 3;
      (video as ReturnType<typeof makeVideo>)._emit('timeupdate');
    });

    expect(localStorageMock.setItem).not.toHaveBeenCalled();

    act(() => {
      // Advance past 10s threshold
      video.currentTime = 11;
      (video as ReturnType<typeof makeVideo>)._emit('timeupdate');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      expect.stringContaining('lesson-throttle'),
      '11'
    );
  });
});

describe('useVideoProgress — clear on natural end', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('removes the storage key when the video ends naturally', () => {
    const video = makeVideo();
    setup(video, { lessonId: 'lesson-end' });

    act(() => {
      (video as ReturnType<typeof makeVideo>)._emit('ended');
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith(
      expect.stringContaining('lesson-end')
    );
  });
});

describe('useVideoProgress — completion reporting', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('calls /api/progress once when threshold is crossed', () => {
    const video = makeVideo({ duration: 100 } as Partial<HTMLVideoElement>);
    setup(video, { lessonId: 'lesson-complete', threshold: 0.8 });

    act(() => {
      video.currentTime = 81; // 81% — crosses 80% threshold
      (video as ReturnType<typeof makeVideo>)._emit('timeupdate');
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/progress',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('does not call /api/progress a second time after threshold already crossed', () => {
    const video = makeVideo({ duration: 100 } as Partial<HTMLVideoElement>);
    setup(video, { lessonId: 'lesson-once', threshold: 0.8 });

    act(() => {
      video.currentTime = 81;
      (video as ReturnType<typeof makeVideo>)._emit('timeupdate');
      video.currentTime = 90;
      (video as ReturnType<typeof makeVideo>)._emit('timeupdate');
      video.currentTime = 99;
      (video as ReturnType<typeof makeVideo>)._emit('timeupdate');
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not call /api/progress before threshold', () => {
    const video = makeVideo({ duration: 100 } as Partial<HTMLVideoElement>);
    setup(video, { lessonId: 'lesson-below', threshold: 0.8 });

    act(() => {
      video.currentTime = 50;
      (video as ReturnType<typeof makeVideo>)._emit('timeupdate');
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('useVideoProgress — persist on unmount', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('saves position to localStorage when unmounted mid-lesson', () => {
    const video = makeVideo({ currentTime: 42, duration: 120 } as Partial<HTMLVideoElement>);
    const { unmount } = setup(video, { lessonId: 'lesson-unmount' });

    unmount();

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      expect.stringContaining('lesson-unmount'),
      '42'
    );
  });

  it('does not save on unmount if completion was already reported', () => {
    const video = makeVideo({ currentTime: 100, duration: 100 } as Partial<HTMLVideoElement>);
    const { unmount } = setup(video, { lessonId: 'lesson-done', threshold: 0.8 });

    act(() => {
      // Cross threshold first
      (video as ReturnType<typeof makeVideo>)._emit('timeupdate');
    });

    localStorageMock.setItem.mockClear();
    unmount();

    // Should not write resume position — lesson is complete
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });
});
