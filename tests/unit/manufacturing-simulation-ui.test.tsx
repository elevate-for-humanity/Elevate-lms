import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ManufacturingSimulation from '@/components/lms/ManufacturingSimulation';
import {
  evaluateManufacturingSimulation,
  publicManufacturingSimulation,
} from '@/lib/lms/manufacturing-simulation';
import { simulationFixture, correctFixtureResponses } from '../fixtures/manufacturing-simulation';

const props = {
  simulation: publicManufacturingSimulation(simulationFixture),
  courseId: 'course',
  lessonId: 'lesson',
  interactionId: 'fixture-inspection-manufacturing',
};
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function answerTasks() {
  fireEvent.click(screen.getByRole('radio', { name: 'Remove from service and report' }));
  const fields = screen.getAllByRole('spinbutton');
  fireEvent.change(fields[0], { target: { value: '25' } });
  fireEvent.change(fields[1], { target: { value: '0' } });
  fireEvent.click(screen.getByRole('button', { name: 'Move step 2 up' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirm this sequence' }));
  fireEvent.click(screen.getByRole('radio', { name: 'Lot identifier' }));
}

it('requires real task answers, posts responses only, and shows the saved server result', async () => {
  const scored = evaluateManufacturingSimulation(simulationFixture, correctFixtureResponses)!;
  const fetchMock = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ attempt: { ...scored, attempts: 1 } }), { status: 200 }),
    );
  vi.stubGlobal('fetch', fetchMock);
  render(<ManufacturingSimulation {...props} />);
  expect(screen.getByRole('button', { name: 'Check and save practice' })).toBeDisabled();
  answerTasks();
  expect(screen.getByText('5 of 5 tasks answered')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Check and save practice' }));
  await screen.findByText('Practice passed · 100%');
  expect(fetchMock).toHaveBeenCalledOnce();
  expect(fetchMock.mock.calls[0][0]).toBe('/api/learner/interactions');
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
    courseId: props.courseId,
    lessonId: props.lessonId,
    interactionId: props.interactionId,
    interactionType: 'manufacturing-simulation',
    responses: correctFixtureResponses,
  });
});

it('retains entries when saving fails and does not show a successful completion', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ error: 'Please sign in again' }), { status: 401 }),
      ),
  );
  render(<ManufacturingSimulation {...props} />);
  answerTasks();
  fireEvent.click(screen.getByRole('button', { name: 'Check and save practice' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Please sign in again');
  expect(screen.getAllByRole('spinbutton')[0]).toHaveValue(25);
  expect(screen.queryByText(/Practice passed/)).toBeNull();
});

it('restores a saved attempt and invalidates old feedback after edits without deleting the record', async () => {
  const scored = evaluateManufacturingSimulation(simulationFixture, correctFixtureResponses)!;
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  render(
    <ManufacturingSimulation
      {...props}
      initialAttempt={{ ...scored, attempts: 2, answers: correctFixtureResponses }}
    />,
  );
  expect(screen.getByText('Saved attempt 2')).toBeInTheDocument();
  fireEvent.change(screen.getAllByRole('spinbutton')[0], { target: { value: '26' } });
  expect(screen.queryByText('Saved attempt 2')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Clear entries for a new attempt' }));
  await waitFor(() => expect(screen.getByText('0 of 5 tasks answered')).toBeInTheDocument());
  expect(fetchMock).not.toHaveBeenCalled();
});

it('lets an authorized administrator try preview tasks without any network write', () => {
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  render(<ManufacturingSimulation {...props} readOnlyPreviewSpec={simulationFixture} />);
  answerTasks();
  fireEvent.click(screen.getByRole('button', { name: 'Check preview answers' }));
  expect(screen.getByText('Preview result only · no learner record saved')).toBeInTheDocument();
  expect(screen.queryByText(/Saved attempt/)).toBeNull();
  expect(fetchMock).not.toHaveBeenCalled();
});

it('announces a reordered step and preserves keyboard focus when its arrow becomes disabled', async () => {
  render(<ManufacturingSimulation {...props} readOnlyPreviewSpec={simulationFixture} />);
  const arrow = screen.getByRole('button', { name: 'Move step 2 up' });
  const step = arrow.closest('li')!;
  arrow.focus();
  fireEvent.click(arrow);
  await waitFor(() => expect(step).toHaveFocus());
  expect(arrow).toBeDisabled();
  expect(screen.getByRole('status')).toHaveTextContent('moved to step 1 of 2.');
});
