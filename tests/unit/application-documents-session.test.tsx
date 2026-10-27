import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ParisApplicationWorkspace from '@/apps/marketing/app/apply/student/interview/ParisApplicationWorkspace';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/components/voice/useNaturalVoice', () => ({
  useNaturalVoice: () => ({ play: vi.fn(), stop: vi.fn() }),
}));
vi.mock('@/apps/marketing/app/apply/student/interview/ApplicationDocumentsPanel', () => ({
  default: ({ locale }: { locale: string }) => (
    <section aria-label="Session document panel">{locale}</section>
  ),
}));
beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: vi.fn() });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
describe('application document session lifecycle', () => {
  it('waits for interview initialization before mounting document requests', async () => {
    let finishStart!: (value: unknown) => void;
    const pending = new Promise((resolve) => {
      finishStart = resolve;
    });
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockReturnValueOnce(pending);
    vi.stubGlobal('fetch', fetch);
    render(<ParisApplicationWorkspace programs={[]} />);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(
      screen.queryByRole('region', { name: 'Session document panel' }),
    ).not.toBeInTheDocument();
    finishStart({
      ok: true,
      json: async () => ({
        ok: true,
        projectId: 'session-1',
        state: { locale: 'en', answers: {}, confirmed: [] },
        progress: {
          percent: 0,
          required: ['applicationCertification'],
          complete: [],
          missing: ['applicationCertification'],
        },
        nextQuestion: {
          field: 'firstName',
          prompt: 'Your first name?',
          required: true,
          critical: true,
        },
        readyForSubmission: false,
        applicationPayload: null,
        messages: [],
        events: [],
      }),
    });
    expect(await screen.findByRole('region', { name: 'Session document panel' })).toHaveTextContent(
      'en',
    );
    expect(screen.getByText('Application certification')).toBeInTheDocument();
    expect(screen.queryByText('applicationCertification')).not.toBeInTheDocument();
  });
  it('does not mount document requests when session initialization fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue({
          ok: false,
          json: async () => ({ ok: false, error: 'Unable to initialize interview' }),
        }),
    );
    render(<ParisApplicationWorkspace programs={[]} />);
    expect(await screen.findByText('Unable to initialize interview')).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Session document panel' }),
    ).not.toBeInTheDocument();
  });
});
