import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BrowserSpeechRecognition } from '@/lib/browser/speech-recognition';
import { TenantParis } from '@/components/tenant/TenantParis';
const { createRecognition } = vi.hoisted(() => ({ createRecognition: vi.fn() }));
vi.mock('@/lib/browser/speech-recognition', () => ({ createBrowserSpeechRecognition: createRecognition }));
let voice: BrowserSpeechRecognition;
beforeEach(() => {
  voice = { lang: '', continuous: false, interimResults: false, onresult: null, onerror: null, onend: null, start: vi.fn(), stop: vi.fn() };
  createRecognition.mockReturnValue(voice);
  vi.stubGlobal('fetch', vi.fn());
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.clearAllMocks(); });
function open() {
  const view = render(<TenantParis business="Subscriber business" accent="#123729" />);
  fireEvent.click(screen.getByRole('button', { name: 'Need help? Ask PARIS' }));
  return view;
}
function dictate(transcript: string) { act(() => voice.onresult?.({ results: { length: 1, 0: { 0: { transcript } } } })); }
describe('subscriber microphone lifecycle', () => {
  it('places dictation in the editable question without submitting it', () => {
    open(); fireEvent.change(screen.getByRole('textbox', { name: 'Your question' }), { target: { value: 'Tell me' } });
    fireEvent.click(screen.getByRole('button', { name: 'Use microphone' }));
    dictate('about services');
    expect(screen.getByRole('textbox')).toHaveValue('Tell me about services');
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each(['Close PARIS', 'Need help? Ask PARIS'])('stops capture through %s and rejects late hidden-panel results', closeLabel => {
    open(); fireEvent.click(screen.getByRole('button', { name: 'Use microphone' }));
    fireEvent.click(screen.getByRole('button', { name: closeLabel }));
    expect(voice.stop).toHaveBeenCalledTimes(1);
    dictate('late result');
    fireEvent.click(screen.getByRole('button', { name: 'Need help? Ask PARIS' }));
    expect(screen.getByRole('textbox')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Use microphone' })).toHaveAttribute('aria-pressed', 'false');
  });
  it('stops capture before sending and prevents late results from refilling the question', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ message: 'Published services response' })));
    open(); fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Services?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Use microphone' }));
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(voice.stop).toHaveBeenCalledTimes(1);
    dictate('late dictation');
    expect(screen.getByRole('textbox')).toHaveValue('');
    await waitFor(() => expect(screen.getByText('Published services response')).toBeTruthy());
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('stops capture and removes result callbacks when the page unmounts', () => {
    const view = open(); fireEvent.click(screen.getByRole('button', { name: 'Use microphone' }));
    view.unmount();
    expect(voice.stop).toHaveBeenCalledTimes(1);
    expect(voice.onresult).toBeNull();
  });
  it('keeps keyboard input available when voice is unsupported', () => {
    createRecognition.mockReturnValue(null); open();
    expect(screen.getByRole('button', { name: 'Use microphone' })).toBeDisabled();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Typed question' } });
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
  });
});
