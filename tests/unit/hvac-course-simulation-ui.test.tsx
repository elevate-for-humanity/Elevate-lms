import {
  act,
  cleanup,
  configure,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HvacCourseSimulation from '@/components/lms/HvacCourseSimulation';
import type {
  HvacSimulationPanel,
  HvacSimulationProgress,
  HvacSimulationRequest,
  HvacSimulationResponse,
  HvacSimulationView,
} from '@/lib/lms/hvac-simulation-types';

// Testing Library's default async budget (1s) is far below this repo's
// vitest testTimeout (60s) and expires on loaded CI runners before the
// mocked save round-trip is rendered, flaking a different test in this
// file per run (main CI 46150065508: the recovery fill test timed out
// with the correct pre-save state still shown). Align the async budget
// with the suite's own timeout philosophy; assertions are unchanged.
configure({ asyncUtilTimeout: 10000 });

// Synchronization is condition-based, never budget-based. Two conditions
// gate every control edit: (1) the control's mount effect syncs its local
// value from props in a passive effect — an edit fired before that flush
// lands is overwritten by it and the submit never posts — so tests drain
// pending effects with act before editing; (2) a submit posts only once
// the edit has committed (its Apply button enables), so tests wait for
// that enablement before submitting, and every save assertion polls the
// specific posted payload or the rendered save result. The budget above
// is only a ceiling for those condition waits.

const courseId = 'd48c61c4-8880-4d9d-9ab5-fab4dd51b201';
const lessonId = '5d54f2f0-08f3-4fd8-bdce-a222c76fa44a';
const fetchMock = vi.fn<typeof fetch>();

function result(
  simulation: Partial<HvacSimulationView> = {},
  progress: Partial<HvacSimulationProgress> = {},
): HvacSimulationResponse {
  return {
    success: true,
    simulation: {
      id: 'hvac-electrical-v1',
      version: '1',
      lessonId,
      chapter: 3,
      title: 'Read the virtual circuit',
      scenario: 'An isolated training circuit has an open switch.',
      objective: 'Use the model to distinguish a circuit observation from a diagnosis.',
      panel: 'electrical',
      controls: [
        {
          id: 'voltage',
          label: 'Supply voltage',
          type: 'number',
          value: 24,
          min: 12,
          max: 48,
          step: 1,
          unit: 'V',
        },
        {
          id: 'switch',
          label: 'Switch position',
          type: 'select',
          value: 'open',
          options: [
            { value: 'open', label: 'Open' },
            { value: 'closed', label: 'Closed' },
          ],
        },
        {
          id: 'resistance',
          label: 'Load resistance',
          type: 'range',
          value: 12,
          min: 1,
          max: 24,
          step: 1,
          unit: 'ohms',
        },
      ],
      readings: [
        { id: 'current', label: 'Modeled current', value: 0, unit: 'A', status: 'neutral' },
      ],
      stage: {
        id: 'inspect',
        title: 'Inspect the circuit',
        prompt: 'What should you record?',
        options: [
          { id: 'open-circuit', label: 'Record the open switch condition' },
          { id: 'replace', label: 'Replace the load without further evidence' },
        ],
        observationRequired: true,
      },
      stageNumber: 1,
      stageCount: 3,
      observed: false,
      finished: false,
      passed: false,
      score: null,
      feedback: null,
      sources: [{ label: 'Training reference', url: 'https://www.epa.gov/section608' }],
      ...simulation,
    },
    progress: {
      revision: 0,
      attemptCount: 0,
      mastered: false,
      bestScore: null,
      lastSavedAt: null,
      ...progress,
    },
  };
}

function response(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function posted(): HvacSimulationRequest {
  const init = fetchMock.mock.calls.at(-1)?.[1];
  return JSON.parse(String(init?.body)) as HvacSimulationRequest;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('full-course HVAC virtual practice', () => {
  it.each<[HvacSimulationPanel, string]>([
    ['workflow', 'Virtual work order'],
    ['system', 'Virtual HVAC system'],
    ['electrical', 'Virtual electrical bench'],
    ['furnace', 'Virtual heating system'],
    ['manifold', 'Virtual manifold bench'],
    ['recovery', 'Virtual recovery station'],
    ['vacuum', 'Virtual evacuation station'],
    ['airflow', 'Virtual airflow bench'],
    ['safety', 'Virtual safety inspection'],
  ])(
    'renders the %s station with an equipment diagram, readable readings, and labeled controls',
    async (panel, name) => {
      fetchMock.mockResolvedValueOnce(response(result({ panel })));
      const view = render(<HvacCourseSimulation courseId={courseId} lessonId={lessonId} />);
      expect(screen.getByRole('status')).toHaveTextContent('Loading');
      const figure = await screen.findByRole('figure', { name });
      expect(figure.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
      expect(within(figure).getByText('Modeled current')).toBeVisible();
      expect(screen.getByRole('spinbutton', { name: 'Supply voltage (V)' })).toHaveValue(24);
      expect(screen.getByRole('combobox', { name: 'Switch position' })).toBeVisible();
      expect(screen.getByRole('slider', { name: 'Load resistance (ohms)' })).toHaveAttribute(
        'min',
        '1',
      );
      expect(
        screen.getByRole('button', { name: 'Record the open switch condition' }),
      ).toBeDisabled();
      expect(screen.getByText(/does not award physical training hours/)).toBeVisible();
      expect(view.container.querySelector('#hvac-simulation')).toBeVisible();
      expect(fetchMock.mock.calls[0][0]).toBe(
        `/api/learner/hvac-simulations?courseId=${courseId}&lessonId=${lessonId}`,
      );
      expect(fetchMock.mock.calls[0][1]).toMatchObject({
        credentials: 'same-origin',
        cache: 'no-store',
      });
    },
  );

  it('applies a keyboard-accessible control form and changes readings only after the server confirms the save', async () => {
    const pending = deferred<Response>();
    fetchMock.mockResolvedValueOnce(response(result())).mockReturnValueOnce(pending.promise);
    render(<HvacCourseSimulation courseId={courseId} lessonId={lessonId} />);
    const voltage = await screen.findByRole('spinbutton', { name: 'Supply voltage (V)' });
    voltage.focus();
    expect(voltage).toHaveFocus();
    await act(async () => {});
    fireEvent.change(voltage, { target: { value: '36' } });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Apply Supply voltage' })).toBeEnabled(),
    );
    expect(screen.getByText('Apply this setting to update the model readings.')).toBeVisible();
    fireEvent.submit(voltage.closest('form')!);
    await waitFor(() =>
      expect(posted()).toMatchObject({
        courseId,
        lessonId,
        simulationId: 'hvac-electrical-v1',
        expectedRevision: 0,
        action: { type: 'set-control', controlId: 'voltage', value: 36 },
      }),
    );
    expect(posted().requestId).toMatch(/^[a-f\d-]{36}$/i);
    expect(screen.getByText('Saving this action…')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Run virtual check' })).toBeDisabled();
    expect(screen.queryByText('Progress saved to your course.')).toBeNull();
    expect(screen.queryByText('3')).toBeNull();
    const updated = result(
      {
        controls: [
          { id: 'voltage', label: 'Supply voltage', type: 'number', value: 36, unit: 'V' },
        ],
        readings: [
          { id: 'current', label: 'Modeled current', value: 3, unit: 'A', status: 'normal' },
        ],
      },
      { revision: 1, attemptCount: 1, lastSavedAt: '2026-11-24T22:00:00Z' },
    );
    await act(async () => {
      pending.resolve(response(updated));
    });
    expect(await screen.findByText('Progress saved to your course.')).toBeVisible();
    expect(screen.getByText('3')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Run virtual check' })).toBeEnabled();
  });

  it('posts observe and choose actions with the current server revision and focuses the next stage', async () => {
    fetchMock
      .mockResolvedValueOnce(response(result()))
      .mockResolvedValueOnce(
        response(
          result(
            {
              observed: true,
              feedback: { kind: 'info', message: 'The switch is open in the model.' },
            },
            { revision: 1, attemptCount: 1 },
          ),
        ),
      )
      .mockResolvedValueOnce(
        response(
          result(
            {
              stage: {
                id: 'reason',
                title: 'Explain the evidence',
                prompt: 'Which conclusion is supported?',
                options: [{ id: 'evidence', label: 'Use the recorded observation' }],
                observationRequired: false,
              },
              stageNumber: 2,
              observed: false,
              feedback: { kind: 'success', message: 'The observation supports your decision.' },
            },
            { revision: 2, attemptCount: 1 },
          ),
        ),
      );
    render(<HvacCourseSimulation courseId={courseId} lessonId={lessonId} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Run virtual check' }));
    await waitFor(() => expect(posted().action).toEqual({ type: 'observe' }));
    const option = await screen.findByRole('button', { name: 'Record the open switch condition' });
    await waitFor(() => expect(option).toBeEnabled());
    fireEvent.click(option);
    await waitFor(() =>
      expect(posted()).toMatchObject({
        expectedRevision: 1,
        action: { type: 'choose', stageId: 'inspect', optionId: 'open-circuit' },
      }),
    );
    const next = await screen.findByRole('heading', { name: 'Explain the evidence' });
    await waitFor(() => expect(next).toHaveFocus());
    expect(screen.getByRole('progressbar')).toHaveAttribute('value', '1');
    expect(screen.getByText('The observation supports your decision.')).toBeVisible();
  });

  it('updates the drawn switch and meter from authoritative circuit state after a control change', async () => {
    const initial = result({
      readings: [
        { id: 'supply', label: 'Bench source', value: 24, unit: 'V', status: 'neutral' },
        {
          id: 'actual-current',
          label: 'Modeled load current',
          value: 0,
          unit: 'A',
          status: 'neutral',
        },
        { id: 'meter', label: 'Virtual instrument display', value: 0, unit: 'A', status: 'normal' },
      ],
    });
    const closed = result(
      {
        controls: initial.simulation.controls.map((item) =>
          item.id === 'switch' ? { ...item, value: 'closed' } : item,
        ),
        readings: initial.simulation.readings.map((item) =>
          item.id === 'supply' ? item : { ...item, value: 2 },
        ),
      },
      { revision: 1, attemptCount: 1 },
    );
    fetchMock.mockResolvedValueOnce(response(initial)).mockResolvedValueOnce(response(closed));
    const view = render(<HvacCourseSimulation courseId={courseId} lessonId={lessonId} />);
    const select = await screen.findByRole('combobox', { name: 'Switch position' });
    expect(view.container.querySelector('[data-switch-position]')).toHaveAttribute(
      'data-switch-position',
      'open',
    );
    expect(view.container.querySelector('[data-meter-id="meter"]')).toHaveAttribute(
      'data-reading-value',
      '0',
    );
    await act(async () => {});
    fireEvent.change(select, { target: { value: 'closed' } });
    expect(view.container.querySelector('[data-switch-position]')).toHaveAttribute(
      'data-switch-position',
      'open',
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Apply Switch position' })).toBeEnabled(),
    );
    fireEvent.submit(select.closest('form')!);
    await waitFor(() =>
      expect(posted().action).toEqual({ type: 'set-control', controlId: 'switch', value: 'closed' }),
    );
    await waitFor(() =>
      expect(view.container.querySelector('[data-switch-position]')).toHaveAttribute(
        'data-switch-position',
        'closed',
      ),
    );
    expect(view.container.querySelector('[data-meter-id="meter"]')).toHaveAttribute(
      'data-reading-value',
      '2',
    );
    expect(view.container.querySelector('[data-switch-position] path')).toHaveAttribute(
      'd',
      'M185 65h65',
    );
  });

  it('displays the returned superheat and subcooling inside the manifold and updates with range input', async () => {
    const initial = result({
      chapter: 5,
      panel: 'manifold',
      controls: [
        {
          id: 'suctionLine',
          label: 'Suction-line temperature',
          type: 'range',
          value: 55,
          min: 30,
          max: 90,
          unit: '°F',
        },
      ],
      readings: [
        {
          id: 'suction-saturation',
          label: 'Suction saturation reference',
          value: 40,
          unit: '°F',
          status: 'neutral',
        },
        { id: 'superheat', label: 'Superheat', value: 15, unit: '°F', status: 'neutral' },
        { id: 'subcooling', label: 'Subcooling', value: 10, unit: '°F', status: 'neutral' },
      ],
    });
    fetchMock.mockResolvedValueOnce(response(initial)).mockResolvedValueOnce(
      response(
        result(
          {
            ...initial.simulation,
            controls: [{ ...initial.simulation.controls[0]!, value: 60 }],
            readings: initial.simulation.readings.map((item) =>
              item.id === 'superheat' ? { ...item, value: 20 } : item,
            ),
          },
          { revision: 1, attemptCount: 1 },
        ),
      ),
    );
    const view = render(<HvacCourseSimulation courseId={courseId} lessonId={lessonId} />);
    const input = await screen.findByRole('slider', { name: 'Suction-line temperature (°F)' });
    expect(view.container.querySelector('[data-meter-id="superheat"]')).toHaveTextContent('15 °F');
    expect(view.container.querySelector('[data-meter-id="subcooling"]')).toHaveTextContent('10 °F');
    await act(async () => {});
    fireEvent.change(input, { target: { value: '60' } });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Apply Suction-line temperature' })).toBeEnabled(),
    );
    fireEvent.submit(input.closest('form')!);
    await waitFor(() =>
      expect(posted().action).toEqual({ type: 'set-control', controlId: 'suctionLine', value: 60 }),
    );
    await waitFor(() =>
      expect(view.container.querySelector('[data-meter-id="superheat"]')).toHaveAttribute(
        'data-reading-value',
        '20',
      ),
    );
    expect(view.container.querySelector('[data-meter-id="subcooling"]')).toHaveAttribute(
      'data-reading-value',
      '10',
    );
  });

  it('shows temperature and airflow observations in a thermometer and work card, then changes instruments only after a saved selection', async () => {
    const initial = result({
      chapter: 12,
      panel: 'manifold',
      controls: [
        {
          id: 'tool',
          label: 'Diagnostic tool',
          type: 'select',
          value: 'temperature',
          options: [
            { value: 'temperature', label: 'Temperature and airflow' },
            { value: 'manifold', label: 'Manifold' },
          ],
        },
      ],
      readings: [
        {
          id: 'air-path',
          label: 'Indoor airflow observation',
          value: 'Restricted',
          status: 'warning',
        },
        {
          id: 'line-temperature',
          label: 'Teaching suction-line temperature',
          value: 38,
          unit: '°F',
          status: 'neutral',
        },
        { id: 'next', label: 'Charge conclusion', value: 'Not established', status: 'neutral' },
      ],
    });
    const updated = result(
      {
        ...initial.simulation,
        controls: [{ ...initial.simulation.controls[0]!, value: 'manifold' }],
        readings: [
          { id: 'superheat', label: 'Superheat', value: 10, unit: '°F', status: 'neutral' },
          { id: 'subcooling', label: 'Subcooling', value: 10, unit: '°F', status: 'neutral' },
        ],
      },
      { revision: 1, attemptCount: 1 },
    );
    fetchMock.mockResolvedValueOnce(response(initial)).mockResolvedValueOnce(response(updated));
    const view = render(<HvacCourseSimulation courseId={courseId} lessonId={lessonId} />);
    const figure = await screen.findByRole('figure', {
      name: 'Virtual temperature and airflow inspection',
    });
    expect(figure.querySelector('[data-instrument-mode="temperature"]')).toBeInTheDocument();
    expect(figure.querySelector('[data-instrument-mode="manifold"]')).toBeNull();
    expect(figure.querySelector('[data-meter-id="line-temperature"]')).toHaveTextContent('38 °F');
    expect(figure.querySelector('[data-inspection-reading="air-path"]')).toHaveAttribute(
      'data-condition',
      'warning',
    );
    expect(within(figure).getByText('Indoor airflow observation')).toBeVisible();
    const select = screen.getByRole('combobox', { name: 'Diagnostic tool' });
    await act(async () => {});
    fireEvent.change(select, { target: { value: 'manifold' } });
    expect(figure.querySelector('[data-instrument-mode="temperature"]')).toBeInTheDocument();
    const apply = screen.getByRole('button', { name: 'Apply Diagnostic tool' });
    await waitFor(() => expect(apply).toBeEnabled());
    fireEvent.click(apply);
    expect(await screen.findByRole('figure', { name: 'Virtual manifold bench' })).toBeVisible();
    expect(posted().action).toEqual({ type: 'set-control', controlId: 'tool', value: 'manifold' });
    expect(view.container.querySelector('[data-instrument-mode="temperature"]')).toBeNull();
    expect(view.container.querySelector('[data-meter-id="superheat"]')).toHaveTextContent('10 °F');
  });

  it('uses a pressure-test chamber without pump imagery until the saved measurement mode changes to vacuum', async () => {
    const initial = result({
      chapter: 9,
      panel: 'vacuum',
      controls: [
        {
          id: 'measurement',
          label: 'Measurement mode',
          type: 'select',
          value: 'pressure',
          options: [
            { value: 'pressure', label: 'Pressure' },
            { value: 'vacuum', label: 'Vacuum' },
          ],
        },
        {
          id: 'pump',
          label: 'Vacuum pump condition',
          type: 'select',
          value: 'isolated',
          options: [
            { value: 'isolated', label: 'Isolated' },
            { value: 'running', label: 'Running' },
          ],
        },
      ],
      readings: [
        {
          id: 'current',
          label: 'Current pressure sample',
          value: 128,
          unit: 'psig',
          status: 'warning',
        },
        { id: 'change', label: 'Pressure change', value: -22, unit: 'psi', status: 'warning' },
        { id: 'elapsed', label: 'Elapsed time', value: 10, unit: 'min', status: 'neutral' },
      ],
    });
    const updated = result(
      {
        ...initial.simulation,
        controls: initial.simulation.controls.map((item) =>
          item.id === 'measurement' ? { ...item, value: 'vacuum' } : item,
        ),
        readings: [
          {
            id: 'current',
            label: 'Current vacuum sample',
            value: 2400,
            unit: 'microns',
            status: 'warning',
          },
          { id: 'pump', label: 'Pump condition', value: 'Isolated', status: 'neutral' },
          { id: 'elapsed', label: 'Elapsed time', value: 10, unit: 'min', status: 'neutral' },
        ],
      },
      { revision: 1, attemptCount: 1 },
    );
    fetchMock.mockResolvedValueOnce(response(initial)).mockResolvedValueOnce(response(updated));
    const view = render(<HvacCourseSimulation courseId={courseId} lessonId={lessonId} />);
    const figure = await screen.findByRole('figure', { name: 'Virtual pressure-test bench' });
    expect(figure.querySelector('[data-instrument-mode="pressure"]')).toBeInTheDocument();
    expect(figure.querySelector('[data-pump-condition]')).toBeNull();
    expect(figure.querySelector('[data-meter-id="current"]')).toHaveTextContent('128 psig');
    const select = screen.getByRole('combobox', { name: 'Measurement mode' });
    await act(async () => {});
    fireEvent.change(select, { target: { value: 'vacuum' } });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Apply Measurement mode' })).toBeEnabled(),
    );
    fireEvent.submit(select.closest('form')!);
    await waitFor(() =>
      expect(posted()).toMatchObject({
        courseId,
        lessonId,
        simulationId: 'hvac-electrical-v1',
        expectedRevision: 0,
        action: { type: 'set-control', controlId: 'measurement', value: 'vacuum' },
      }),
    );
    expect(await screen.findByRole('figure', { name: 'Virtual evacuation station' })).toBeVisible();
    expect(view.container.querySelector('[data-instrument-mode="pressure"]')).toBeNull();
    expect(view.container.querySelector('[data-pump-condition]')).toHaveAttribute(
      'data-pump-condition',
      'isolated',
    );
    expect(view.container.querySelector('[data-meter-id="current"]')).toHaveTextContent(
      '2400 microns',
    );
  });

  it.each([
    {
      chapter: 9,
      panel: 'vacuum' as const,
      name: 'Refrigerant-handling job card',
      ids: ['handling-method', 'pump-down-eligibility', 'containment'],
    },
    {
      chapter: 13,
      panel: 'airflow' as const,
      name: 'Brazing preparation and verification job card',
      ids: [
        'joint-preparation',
        'brazing-process',
        'joint-inspection',
        'leak-verification',
        'handoff',
      ],
    },
  ])('shows the $name conditions from saved evidence', async ({ chapter, panel, name, ids }) => {
    const initial = result({
      chapter,
      panel,
      readings: ids.map((id) => ({ id, label: `Case ${id}`, value: 'Pending', status: 'warning' })),
    });
    const updated = result(
      {
        ...initial.simulation,
        observed: true,
        readings: initial.simulation.readings.map((item, index) =>
          index === 0 ? { ...item, value: 'Verified in supplied case', status: 'normal' } : item,
        ),
      },
      { revision: 1, attemptCount: 1 },
    );
    fetchMock.mockResolvedValueOnce(response(initial)).mockResolvedValueOnce(response(updated));
    const view = render(<HvacCourseSimulation courseId={courseId} lessonId={lessonId} />);
    const card = await screen.findByRole('region', { name });
    expect(within(card).getAllByRole('listitem')).toHaveLength(ids.length);
    const condition = `[data-job-card-reading="${ids[0]}"]`;
    expect(view.container.querySelector(condition)).toHaveAttribute('data-condition', 'warning');
    fireEvent.click(screen.getByRole('button', { name: 'Run virtual check' }));
    await waitFor(() =>
      expect(view.container.querySelector(condition)).toHaveAttribute('data-condition', 'normal'),
    );
    expect(screen.getByText('Verified in supplied case', { selector: 'dd' })).toBeVisible();
  });

  it('binds the recovery fill indicator to the returned material mass and case headroom', async () => {
    const initial = result({
      chapter: 7,
      panel: 'recovery',
      controls: [
        {
          id: 'grossMass',
          label: 'Simulated gross mass',
          type: 'number',
          value: 32,
          min: 12,
          max: 36,
          unit: 'kg',
        },
      ],
      readings: [
        { id: 'gross-mass', label: 'Gross mass', value: 32, unit: 'kg', status: 'neutral' },
        {
          id: 'material-mass',
          label: 'Material mass in case',
          value: 20,
          unit: 'kg',
          status: 'neutral',
        },
        {
          id: 'headroom',
          label: 'Headroom to supplied limit',
          value: 0,
          unit: 'kg',
          status: 'danger',
        },
      ],
    });
    const updated = result(
      {
        ...initial.simulation,
        controls: [{ ...initial.simulation.controls[0]!, value: 24 }],
        readings: [
          { id: 'gross-mass', label: 'Gross mass', value: 24, unit: 'kg', status: 'neutral' },
          {
            id: 'material-mass',
            label: 'Material mass in case',
            value: 12,
            unit: 'kg',
            status: 'neutral',
          },
          {
            id: 'headroom',
            label: 'Headroom to supplied limit',
            value: 8,
            unit: 'kg',
            status: 'normal',
          },
        ],
      },
      { revision: 1, attemptCount: 1 },
    );
    fetchMock.mockResolvedValueOnce(response(initial)).mockResolvedValueOnce(response(updated));
    const view = render(<HvacCourseSimulation courseId={courseId} lessonId={lessonId} />);
    const input = await screen.findByRole('spinbutton', { name: 'Simulated gross mass (kg)' });
    expect(view.container.querySelector('[data-cylinder-fill]')).toHaveAttribute(
      'data-cylinder-fill',
      '1',
    );
    await act(async () => {});
    fireEvent.change(input, { target: { value: '24' } });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Apply Simulated gross mass' })).toBeEnabled(),
    );
    fireEvent.submit(input.closest('form')!);
    await waitFor(() =>
      expect(view.container.querySelector('[data-cylinder-fill]')).toHaveAttribute(
        'data-cylinder-fill',
        '0.6',
      ),
    );
    expect(view.container.querySelector('[data-meter-id="headroom"]')).toHaveTextContent('8 kg');
  });

  it('never draws indoor airflow from outdoor cooling capacity', async () => {
    const initial = result({
      panel: 'airflow',
      chapter: 14,
      readings: [
        { id: 'airflow', label: 'Indoor airflow', value: 'Clear', status: 'normal' },
        { id: 'capacity', label: 'Cooling index', value: 100, status: 'normal' },
      ],
    });
    const updated = result(
      {
        ...initial.simulation,
        readings: [
          initial.simulation.readings[0],
          { id: 'capacity', label: 'Cooling index', value: 60, status: 'warning' },
        ],
      },
      { revision: 1, attemptCount: 1 },
    );
    fetchMock.mockResolvedValueOnce(response(initial)).mockResolvedValueOnce(response(updated));
    const view = render(<HvacCourseSimulation courseId={courseId} lessonId={lessonId} />);
    const button = await screen.findByRole('button', { name: 'Run virtual check' });
    const path = view.container.querySelector('[data-normalized-flow]');
    const before = path?.outerHTML;
    fireEvent.click(button);
    await waitFor(() => expect(screen.getByText('60', { exact: true })).toBeVisible());
    expect(view.container.querySelector('[data-normalized-flow]')?.outerHTML).toBe(before);
    expect(view.container.querySelector('[data-normalized-flow="60"]')).toBeNull();
  });

  it.each([
    {
      panel: 'airflow' as const,
      reading: {
        id: 'airflow',
        label: 'Normalized modeled airflow',
        value: 32,
        unit: '% of reference',
        status: 'warning' as const,
      },
      selector: '[data-normalized-flow]',
      attribute: 'data-normalized-flow',
      initial: '32',
      next: '80',
      value: 80,
    },
    {
      panel: 'safety' as const,
      reading: {
        id: 'energy',
        label: 'Energy access',
        value: 'STOP: verification missing',
        status: 'danger' as const,
      },
      selector: '[data-safety-state]',
      attribute: 'data-safety-state',
      initial: 'danger',
      next: 'normal',
      value: 'Qualified verification recorded',
    },
  ])(
    'updates the $panel diagram from the returned model state',
    async ({ panel, reading: observedReading, selector, attribute, initial, next, value }) => {
      fetchMock
        .mockResolvedValueOnce(response(result({ panel, readings: [observedReading] })))
        .mockResolvedValueOnce(
          response(
            result(
              {
                panel,
                observed: true,
                readings: [{ ...observedReading, value, status: 'normal' }],
              },
              { revision: 1, attemptCount: 1 },
            ),
          ),
        );
      const view = render(<HvacCourseSimulation courseId={courseId} lessonId={lessonId} />);
      const button = await screen.findByRole('button', { name: 'Run virtual check' });
      expect(view.container.querySelector(selector)).toHaveAttribute(attribute, initial);
      fireEvent.click(button);
      await waitFor(() =>
        expect(view.container.querySelector(selector)).toHaveAttribute(attribute, next),
      );
    },
  );

  it('keeps an uncertain network action pending and retries the identical request without claiming a save', async () => {
    fetchMock
      .mockResolvedValueOnce(response(result()))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(
        response(
          result(
            { observed: true },
            { revision: 1, attemptCount: 1, lastSavedAt: '2026-11-24T22:00:00Z' },
          ),
        ),
      );
    render(<HvacCourseSimulation courseId={courseId} lessonId={lessonId} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Run virtual check' }));
    let first: HvacSimulationRequest | undefined;
    await waitFor(() => {
      first = posted();
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('connection was interrupted');
    expect(screen.getByText('This action has not been confirmed as saved.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Run virtual check' })).toBeDisabled();
    expect(screen.queryByText('Progress saved to your course.')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Retry save' }));
    await waitFor(() => expect(posted()).toEqual(first));
    expect(await screen.findByText('Progress saved to your course.')).toBeVisible();
    expect(screen.getByText('Attempts: 1')).toBeVisible();
  });

  it('requires a fresh saved-state load after a conflict instead of sending another stale action', async () => {
    fetchMock
      .mockResolvedValueOnce(response(result({}, { revision: 3, attemptCount: 1 })))
      .mockResolvedValueOnce(
        response({ error: 'Revision mismatch', code: 'REVISION_CONFLICT' }, 409),
      )
      .mockResolvedValueOnce(
        response(
          result(
            { observed: true },
            { revision: 4, attemptCount: 1, lastSavedAt: '2026-11-24T22:00:00Z' },
          ),
        ),
      );
    render(<HvacCourseSimulation courseId={courseId} lessonId={lessonId} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Run virtual check' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Reload saved progress before continuing',
    );
    expect(screen.queryByRole('button', { name: 'Retry save' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Restart this practice' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Reload saved progress' }));
    expect(await screen.findByText('Saved progress restored.')).toBeVisible();
    expect(fetchMock.mock.calls[2][1]?.method).toBeUndefined();
    expect(screen.getByRole('button', { name: 'Record the open switch condition' })).toBeEnabled();
  });

  it('disables restart for fresh and reset-empty attempts while leaving normal practice available', async () => {
    fetchMock
      .mockResolvedValueOnce(response(result()))
      .mockResolvedValueOnce(
        response(
          result(
            {
              observed: true,
              feedback: { kind: 'info', message: 'Readings recorded for this stage.' },
            },
            { revision: 1, attemptCount: 1 },
          ),
        ),
      )
      .mockResolvedValueOnce(response(result({}, { revision: 2, attemptCount: 2 })));
    render(<HvacCourseSimulation courseId={courseId} lessonId={lessonId} />);
    const restart = await screen.findByRole('button', { name: 'Restart this practice' });
    expect(restart).toBeDisabled();
    fireEvent.click(restart);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Run virtual check' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Run virtual check' }));
    await waitFor(() => expect(restart).toBeEnabled());
    fireEvent.click(restart);
    await waitFor(() =>
      expect(posted()).toMatchObject({ expectedRevision: 1, action: { type: 'reset' } }),
    );
    await waitFor(() => expect(screen.getByText('Attempts: 2')).toBeVisible());
    expect(restart).toBeDisabled();
    fireEvent.click(restart);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(screen.getByRole('button', { name: 'Run virtual check' })).toBeEnabled();
    expect(screen.getByRole('combobox', { name: 'Switch position' })).toBeEnabled();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('restores mastery and preserves the best score when a completed learner starts another attempt', async () => {
    fetchMock
      .mockResolvedValueOnce(
        response(
          result(
            {
              finished: true,
              passed: true,
              score: 92,
              stage: null,
              stageNumber: 3,
              feedback: { kind: 'success', message: 'The final stage is complete.' },
            },
            {
              revision: 9,
              attemptCount: 2,
              mastered: true,
              bestScore: 92,
              lastSavedAt: '2026-11-24T22:00:00Z',
            },
          ),
        ),
      )
      .mockResolvedValueOnce(
        response(
          result(
            {},
            {
              revision: 10,
              attemptCount: 3,
              mastered: true,
              bestScore: 92,
              lastSavedAt: '2026-11-24T22:01:00Z',
            },
          ),
        ),
      );
    render(<HvacCourseSimulation courseId={courseId} lessonId={lessonId} />);
    expect(await screen.findByRole('heading', { name: 'Simulation mastered' })).toBeVisible();
    expect(screen.getByText('Mastery saved')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Practice again' }));
    await waitFor(() =>
      expect(posted()).toMatchObject({ expectedRevision: 9, action: { type: 'reset' } }),
    );
    expect(await screen.findByRole('button', { name: 'Restart this practice' })).toBeDisabled();
    expect(screen.getByText('Mastery saved')).toBeVisible();
    expect(screen.getByText('Best saved score:').parentElement).toHaveTextContent('92%');
    expect(screen.queryByRole('heading', { name: 'Simulation mastered' })).toBeNull();
    expect(screen.getByText('Attempts: 3')).toBeVisible();
  });

  it('shows failed persistence and retry without changing the displayed saved state', async () => {
    fetchMock
      .mockResolvedValueOnce(response(result()))
      .mockResolvedValueOnce(
        response({ error: 'Progress could not be saved.', code: 'PERSISTENCE_ERROR' }, 500),
      );
    render(<HvacCourseSimulation courseId={courseId} lessonId={lessonId} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Run virtual check' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Progress could not be saved.');
    expect(screen.getByText('Attempts: 0')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Record the open switch condition' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Retry save' })).toBeEnabled();
  });

  it('rejects an incomplete successful response without replacing the last confirmed simulation', async () => {
    const incomplete = {
      ...result({ observed: true }, { revision: 1 }),
      simulation: {
        id: 'hvac-electrical-v1',
        lessonId,
        panel: 'electrical',
        controls: [],
        readings: [],
      },
    };
    fetchMock.mockResolvedValueOnce(response(result())).mockResolvedValueOnce(response(incomplete));
    render(<HvacCourseSimulation courseId={courseId} lessonId={lessonId} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Run virtual check' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('incomplete result');
    expect(screen.getByRole('figure', { name: 'Virtual electrical bench' })).toBeVisible();
    expect(screen.getByText('Attempts: 0')).toBeVisible();
    expect(screen.queryByText('Progress saved to your course.')).toBeNull();
  });

  it('recovers from an initial load failure without presenting an invented simulation', async () => {
    fetchMock
      .mockResolvedValueOnce(response({ error: 'Course access could not be verified.' }, 503))
      .mockResolvedValueOnce(response(result()));
    render(<HvacCourseSimulation courseId={courseId} lessonId={lessonId} />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Course access could not be verified.',
    );
    expect(screen.queryByRole('figure')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Retry loading simulation' }));
    expect(await screen.findByRole('figure', { name: 'Virtual electrical bench' })).toBeVisible();
  });

  it('ignores a late response from the previous lesson when navigation changes the course context', async () => {
    const old = deferred<Response>();
    const nextLessonId = '9fc1e9bc-707e-4b3f-95a1-d3f727d1fce1';
    fetchMock
      .mockReturnValueOnce(old.promise)
      .mockResolvedValueOnce(
        response(
          result({ lessonId: nextLessonId, title: 'Next lesson virtual bench', panel: 'manifold' }),
        ),
      );
    const view = render(<HvacCourseSimulation courseId={courseId} lessonId={lessonId} />);
    view.rerender(<HvacCourseSimulation courseId={courseId} lessonId={nextLessonId} />);
    expect(await screen.findByRole('heading', { name: 'Next lesson virtual bench' })).toBeVisible();
    await act(async () => {
      old.resolve(response(result()));
    });
    expect(screen.queryByRole('heading', { name: 'Read the virtual circuit' })).toBeNull();
    expect(screen.getByRole('figure', { name: 'Virtual manifold bench' })).toBeVisible();
  });
});
