// Read-aloud controls for the shared text-message workspace (Admin + LMS).
// Native fetch Response bodies avoid mixing Node fetch with jsdom Blob
// implementations, mirroring tests/unit/natural-voice-exclusivity.test.ts.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TextWorkspace } from '@/components/communications/TextWorkspace';
import { stopAllNaturalVoicePlayback } from '@/components/voice/useNaturalVoice';

type FakeAudioInstance = {
  src: string;
  preload: string;
  playbackRate: number;
  volume: number;
  currentTime: number;
  onplay: (() => void) | null;
  onended: (() => void) | null;
  onerror: (() => void) | null;
  play: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
};

const audioInstances: FakeAudioInstance[] = [];

class FakeAudio {
  preload = '';
  playbackRate = 1;
  volume = 1;
  currentTime = 0;
  onplay: (() => void) | null = null;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  play = vi.fn(async () => {
    this.onplay?.();
  });
  pause = vi.fn();
  addEventListener = vi.fn();
  constructor(public src: string) {
    audioInstances.push(this as unknown as FakeAudioInstance);
  }
}

function stubObjectUrl(value: string) {
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    writable: true,
    value: vi.fn().mockReturnValue(value),
  });
}

function message(partial: Record<string, unknown>) {
  return {
    id: 'm',
    direction: 'inbound',
    from_number: '+13175550123',
    to_number: '+14632401404',
    body: 'Hello',
    status: 'delivered',
    created_at: '2026-11-25T15:00:00.000Z',
    ...partial,
  };
}

function stubFetch(messages: unknown[], voiceImpl?: (init: any) => Promise<Response>) {
  const fetchMock = vi.fn(async (url: any, init: any) => {
    const target = String(url);
    if (target.includes('/api/voice/natural')) {
      if (voiceImpl) return voiceImpl(init);
      return new Response('audio', { headers: { 'Content-Type': 'audio/mpeg' } });
    }
    if (target.includes('/api/communications/texts')) {
      return new Response(
        JSON.stringify({ messages, readOnly: false, sendingEnabled: true }),
        { headers: { 'Content-Type': 'application/json' } },
      );
    }
    throw new Error(`Unexpected fetch: ${target}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function openThread() {
  render(<TextWorkspace />);
  const threadButton = await screen.findByRole('button', { name: /\(317\) 555-0123/ });
  fireEvent.click(threadButton);
}

function voiceRequests(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls
    .filter(([url]) => String(url).includes('/api/voice/natural'))
    .map(([, init]) => JSON.parse(String((init as any)?.body ?? '{}')));
}

describe('text message read-aloud', () => {
  afterEach(() => {
    cleanup();
    stopAllNaturalVoicePlayback();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    audioInstances.length = 0;
  });

  it('renders a Listen control on every text message and none on a picture-only message', async () => {
    stubFetch([
      message({ id: 'new', body: 'See you at nine', created_at: '2026-11-25T15:02:00.000Z' }),
      message({ id: 'mid', body: 'Running late, sorry', created_at: '2026-11-25T15:01:00.000Z' }),
      message({ id: 'pic', body: '', media: [{ url: 'x' }], created_at: '2026-11-25T15:00:00.000Z' }),
    ]);
    await openThread();
    expect(screen.getAllByRole('button', { name: 'Listen to this message' })).toHaveLength(2);
    expect(screen.queryByRole('button', { name: 'Stop reading this message aloud' })).toBeNull();
  });

  it('speaks the tapped message and swaps the control to a visible Stop state', async () => {
    const fetchMock = stubFetch([
      message({ id: 'a', body: 'Your appointment is confirmed for Tuesday' }),
    ]);
    vi.stubGlobal('Audio', FakeAudio);
    stubObjectUrl('blob:one');
    await openThread();
    fireEvent.click(screen.getByRole('button', { name: 'Listen to this message' }));
    await screen.findByText('Reading aloud…');
    expect(voiceRequests(fetchMock)).toHaveLength(1);
    expect(voiceRequests(fetchMock)[0].text).toBe('Your appointment is confirmed for Tuesday');
    expect(audioInstances).toHaveLength(1);
    expect(audioInstances[0].play).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Stop reading this message aloud' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Listen to this message' })).toBeNull();
  });

  it('stops playback immediately when Stop is tapped and restores Listen', async () => {
    stubFetch([message({ id: 'a', body: 'Please bring your insurance card' })]);
    vi.stubGlobal('Audio', FakeAudio);
    stubObjectUrl('blob:two');
    await openThread();
    fireEvent.click(screen.getByRole('button', { name: 'Listen to this message' }));
    await screen.findByText('Reading aloud…');
    fireEvent.click(screen.getByRole('button', { name: 'Stop reading this message aloud' }));
    expect(audioInstances[0].pause).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Listen to this message' })).toBeTruthy();
    });
    expect(screen.queryByText('Reading aloud…')).toBeNull();
  });

  it('stops the previous message when a different message is played', async () => {
    stubFetch([
      message({ id: 'b', direction: 'outbound', from_number: '+14632401404', to_number: '+13175550123', body: 'We close at five today', created_at: '2026-11-25T15:01:00.000Z' }),
      message({ id: 'a', body: 'What time do you close', created_at: '2026-11-25T15:00:00.000Z' }),
    ]);
    vi.stubGlobal('Audio', FakeAudio);
    stubObjectUrl('blob:three');
    await openThread();
    const listenButtons = screen.getAllByRole('button', { name: 'Listen to this message' });
    expect(listenButtons).toHaveLength(2);
    fireEvent.click(listenButtons[0]);
    await screen.findByText('Reading aloud…');
    fireEvent.click(screen.getByRole('button', { name: 'Listen to this message' }));
    await waitFor(() => {
      expect(audioInstances).toHaveLength(2);
    });
    expect(audioInstances[0].pause).toHaveBeenCalled();
    expect(audioInstances[1].play).toHaveBeenCalledOnce();
    expect(screen.getAllByRole('button', { name: 'Stop reading this message aloud' })).toHaveLength(1);
  });

  it('cancels a message whose voice is still loading so it never plays', async () => {
    let resolveVoice!: (response: Response) => void;
    stubFetch(
      [message({ id: 'a', body: 'A slow network message' })],
      () => new Promise<Response>((done) => { resolveVoice = done; }),
    );
    vi.stubGlobal('Audio', FakeAudio);
    stubObjectUrl('blob:four');
    await openThread();
    fireEvent.click(screen.getByRole('button', { name: 'Listen to this message' }));
    await screen.findByText('Loading voice…');
    fireEvent.click(screen.getByRole('button', { name: 'Stop reading this message aloud' }));
    expect(screen.queryByText('Loading voice…')).toBeNull();
    resolveVoice(new Response('audio', { headers: { 'Content-Type': 'audio/mpeg' } }));
    await waitFor(() => {
      expect(audioInstances).toHaveLength(1);
    });
    expect(audioInstances[0].play).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Listen to this message' })).toBeTruthy();
  });

  it('speaks an over-cap message truncated to the synthesis limit without erroring', async () => {
    const longBody = `Long update ${'x'.repeat(3000)}`;
    const fetchMock = stubFetch([message({ id: 'a', body: longBody })]);
    vi.stubGlobal('Audio', FakeAudio);
    stubObjectUrl('blob:five');
    await openThread();
    fireEvent.click(screen.getByRole('button', { name: 'Listen to this message' }));
    await screen.findByText('Reading aloud…');
    const requests = voiceRequests(fetchMock);
    expect(requests).toHaveLength(1);
    expect(requests[0].text).toHaveLength(2400);
    expect(requests[0].text.startsWith('Long update')).toBe(true);
    expect(audioInstances[0].play).toHaveBeenCalledOnce();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
