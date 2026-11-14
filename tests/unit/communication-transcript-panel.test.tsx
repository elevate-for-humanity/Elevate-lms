import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { afterEach, it, expect, vi } from 'vitest';
import { TranscriptPanel } from '@/components/communications/TranscriptPanel';
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it('opens and closes the actual saved transcript', () => {
  render(<TranscriptPanel text="Caller asked for a callback." />);
  expect(screen.getByText('Caller asked for a callback.').hidden).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Read transcript' }));
  expect(screen.getByText('Caller asked for a callback.')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Hide transcript' }));
  expect(screen.getByText('Caller asked for a callback.').hidden).toBe(true);
});
it('generates a missing transcript through the authorized record endpoint', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ transcript: 'Hello admissions.' }) });
  vi.stubGlobal('fetch', fetch);
  render(<TranscriptPanel transcribeUrl="/api/communications/transcripts/voicemail/owned-id" />);
  fireEvent.click(screen.getByRole('button', { name: 'Read transcript' }));
  fireEvent.click(screen.getByRole('button', { name: 'Generate transcript' }));
  await waitFor(() => expect(screen.getByText('Hello admissions.')).toBeTruthy());
  expect(fetch).toHaveBeenCalledWith('/api/communications/transcripts/voicemail/owned-id', {
    method: 'POST',
  });
});
