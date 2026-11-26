import type { ManufacturingSimulationSpec } from '@/lib/lms/manufacturing-simulation';

export const simulationFixture: ManufacturingSimulationSpec = {
  version: 1,
  id: 'fixture-inspection-v1',
  title: 'Inspect a fictional work order',
  kind: 'inspection',
  brief: 'Use the fictional reference card and report a hold when required.',
  masteryThreshold: 80,
  exhibits: [
    {
      title: 'Fictional reference',
      columns: [{ key: 'limit', label: 'Limit' }],
      rows: [{ limit: 25 }],
    },
  ],
  tasks: [
    {
      id: 'safety',
      type: 'choice',
      prompt: 'The brake fails inspection. What now?',
      options: [
        { value: 'hold', label: 'Remove from service and report' },
        { value: 'go', label: 'Continue' },
      ],
      expected: 'hold',
      critical: true,
      rationale: 'A defective truck must be held for authorized review.',
    },
    {
      id: 'measure',
      type: 'number',
      prompt: 'Enter the measured length.',
      expected: 25,
      tolerance: 0.01,
      unit: 'mm',
      rationale: 'Read the given measurement in millimetres.',
    },
    {
      id: 'order',
      type: 'sequence',
      prompt: 'Put the response in order.',
      options: [
        { value: 'report', label: 'Report the condition' },
        { value: 'stop', label: 'Stop the task' },
      ],
      expected: ['stop', 'report'],
      rationale: 'Stop exposure first, then report.',
    },
    {
      id: 'zero',
      type: 'number',
      prompt: 'How many known defects may be released?',
      expected: 0,
      rationale: 'Hold known defects for disposition.',
    },
    {
      id: 'record',
      type: 'choice',
      prompt: 'Which record follows the lot?',
      options: [
        { value: 'lot', label: 'Lot identifier' },
        { value: 'guess', label: 'A guess' },
      ],
      expected: 'lot',
      rationale: 'Preserve the lot identity.',
    },
  ],
};
export const correctFixtureResponses = {
  safety: 'hold',
  measure: 25,
  order: ['stop', 'report'],
  zero: 0,
  record: 'lot',
};
