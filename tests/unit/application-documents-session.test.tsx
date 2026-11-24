import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
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

function interviewSession() {
  return {
    ok: true,
    projectId: 'session-1',
    state: { locale: 'en', answers: {}, confirmed: [] },
    progress: {
      percent: 0,
      required: ['applicationCertification'],
      complete: [],
      missing: ['applicationCertification'],
    },
    nextQuestion: { field: 'firstName', prompt: 'Your first name?', required: true, critical: true },
    readyForSubmission: false,
    applicationPayload: null,
    messages: [],
    events: [],
  };
}

function expectOneStart(fetch: ReturnType<typeof vi.fn>) {
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch).toHaveBeenCalledWith('/api/paris/application-interview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({ action: 'start', locale: 'en' }),
  });
}

describe('application document session lifecycle', () => {
  it('starts a fresh interview without a missing-session probe and waits before mounting documents', async () => {
    let finishStart!: (value: unknown) => void;
    const pending = new Promise((resolve) => {
      finishStart = resolve;
    });
    const fetch = vi.fn().mockReturnValueOnce(pending);
    vi.stubGlobal('fetch', fetch);
    render(<ParisApplicationWorkspace programs={[]} />);
    await waitFor(() => expectOneStart(fetch));
    expect(
      screen.queryByRole('region', { name: 'Session document panel' }),
    ).not.toBeInTheDocument();
    finishStart({
      ok: true,
      json: async () => interviewSession(),
    });
    expect(await screen.findByRole('region', { name: 'Session document panel' })).toHaveTextContent(
      'en',
    );
    expect(screen.getByText('Application certification')).toBeInTheDocument();
    expect(screen.queryByText('applicationCertification')).not.toBeInTheDocument();
    expectOneStart(fetch);
  });

  it('retains the language, saved answers and next question returned for a resumed interview', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ...interviewSession(),
        projectId: 'existing-session',
        state: { locale: 'es', answers: { firstName: 'Ana' }, confirmed: ['firstName'] },
        progress: {
          percent: 33,
          required: ['firstName', 'lastName', 'applicationCertification'],
          complete: ['firstName'],
          missing: ['lastName', 'applicationCertification'],
        },
        nextQuestion: { field: 'lastName', prompt: '¿Cuál es su apellido?', required: true, critical: true },
      }),
    });
    vi.stubGlobal('fetch', fetch);
    render(<ParisApplicationWorkspace programs={[]} />);
    expect(await screen.findByRole('region', { name: 'Session document panel' })).toHaveTextContent('es');
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('¿Cuál es su apellido?')).toBeInTheDocument();
    expectOneStart(fetch);
  });

  it('shares the pending start request across Strict Mode effect replay', async () => {
    let finishStart!: (value: unknown) => void;
    const pending = new Promise((resolve) => { finishStart = resolve; });
    const fetch = vi.fn().mockReturnValue(pending);
    vi.stubGlobal('fetch', fetch);
    render(<StrictMode><ParisApplicationWorkspace programs={[]} /></StrictMode>);
    await waitFor(() => expectOneStart(fetch));
    expect(screen.queryByRole('region', { name: 'Session document panel' })).not.toBeInTheDocument();
    finishStart({ ok: true, json: async () => interviewSession() });
    expect(await screen.findByRole('region', { name: 'Session document panel' })).toHaveTextContent('en');
    expectOneStart(fetch);
  });

  it('does not mount document requests when session initialization fails', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ ok: false, error: 'Unable to initialize interview' }),
    });
    vi.stubGlobal('fetch', fetch);
    render(<ParisApplicationWorkspace programs={[]} />);
    expect(await screen.findByText('Unable to initialize interview')).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Session document panel' }),
    ).not.toBeInTheDocument();
    expectOneStart(fetch);
  });
});
