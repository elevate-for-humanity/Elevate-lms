import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import DigitalWorkbook from '@/components/lms/DigitalWorkbook';
import WorkbookNarration from '@/components/lms/WorkbookNarration';
import { narrationChunks } from '@/lib/lms/workbook-slides';
const voice = vi.hoisted(() => ({
  play: vi.fn().mockResolvedValue(true),
  stop: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn().mockResolvedValue(true),
  isLoading: false,
  isPlaying: false,
  isPaused: false,
  error: null,
}));
vi.mock('@/components/voice/useNaturalVoice', () => ({ useNaturalVoice: () => voice }));
const book = {
  id: 'book',
  slug: 'barber',
  title: 'Barbering workbook',
  program_id: 'program',
  cover_image: '/cover.jpg',
};
const section = {
  id: 'one',
  workbook_id: 'book',
  section_number: 1,
  title: 'Tool care',
  unit: 'Safety',
  pdf_page: 5,
  prompts: ['Describe cleaning.', 'Explain disinfection.', 'Plan safe storage.'],
  lesson_id: null,
};
beforeEach(() => {
  sessionStorage.clear();
  vi.clearAllMocks();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function openBook() {
  return render(
    <DigitalWorkbook
      accountId="learner"
      workbook={book}
      sections={[section]}
      responses={[]}
      readOnly={false}
    />,
  );
}
it('narrates each screen after opt-in and never reads the learner answer', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ section_id: 'one', version: 1 }), { status: 200 }),
      ),
  );
  openBook();
  expect(voice.play).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Listen with PARIS' }));
  await waitFor(() =>
    expect(voice.play).toHaveBeenCalledWith(
      expect.stringContaining('Tool care'),
      expect.any(Object),
    ),
  );
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Private learner response' } });
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  await waitFor(() => expect(screen.getByRole('heading', { name: 'Practice 1' })).toBeVisible());
  expect(screen.getAllByRole('textbox')).toHaveLength(1);
  await waitFor(() =>
    expect(voice.play).toHaveBeenLastCalledWith(
      expect.stringContaining('Describe cleaning.'),
      expect.any(Object),
    ),
  );
  expect(JSON.stringify(voice.play.mock.calls)).not.toContain('Private learner response');
  fireEvent.click(screen.getByRole('button', { name: 'Back' }));
  await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue('Private learner response'));
});
it('keeps the answer and current screen when saving fails', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ error: 'Connection lost. Retry saving.' }), { status: 503 }),
      ),
  );
  openBook();
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Do not lose this' } });
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Connection lost'));
  expect(screen.getByRole('heading', { name: 'Study and notice' })).toBeVisible();
  expect(screen.getByRole('textbox')).toHaveValue('Do not lose this');
});
it('stops narration on navigation and on closing the workbook', () => {
  const view = render(<WorkbookNarration text="First screen" />);
  fireEvent.click(screen.getByRole('button', { name: 'Listen with PARIS' }));
  view.rerender(<WorkbookNarration text="Second screen" />);
  expect(voice.stop).toHaveBeenCalled();
  expect(voice.play).toHaveBeenLastCalledWith('Second screen', expect.any(Object));
  const calls = voice.stop.mock.calls.length;
  view.unmount();
  expect(voice.stop.mock.calls.length).toBeGreaterThan(calls);
});
it('reads every chunk of a long screen and waits at the activity', () => {
  const text = 'Read this complete instruction. '.repeat(200);
  const chunks = narrationChunks(text);
  expect(chunks.join(' ')).toBe(text.trim());
  expect(chunks.every((chunk) => chunk.length <= 1800)).toBe(true);
  render(<WorkbookNarration text={text} />);
  fireEvent.click(screen.getByRole('button', { name: 'Listen with PARIS' }));
  for (let index = 0; index < chunks.length; index++) {
    expect(voice.play.mock.calls[index][0]).toBe(chunks[index]);
    voice.play.mock.calls[index][1].onEnded();
  }
  expect(voice.play).toHaveBeenCalledTimes(chunks.length);
});
