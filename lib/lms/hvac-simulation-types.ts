/** Shared transport types. Answer keys and scoring rules stay on the server. */
export type HvacSimulationPanel =
  | 'workflow'
  | 'system'
  | 'electrical'
  | 'furnace'
  | 'manifold'
  | 'recovery'
  | 'vacuum'
  | 'airflow'
  | 'safety';

export type HvacSimulationControl = {
  id: string;
  label: string;
  type: 'select' | 'range' | 'number';
  value: string | number;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
};

export type HvacSimulationReading = {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  status: 'neutral' | 'normal' | 'warning' | 'danger';
};

export type HvacSimulationAction =
  | { type: 'set-control'; controlId: string; value: string | number }
  | { type: 'observe' }
  | { type: 'choose'; stageId: string; optionId: string };

export type HvacSimulationFeedback = {
  kind: 'info' | 'success' | 'retry' | 'safety';
  message: string;
};

export type HvacSimulationView = {
  id: string;
  version: string;
  lessonId: string;
  chapter: number;
  title: string;
  scenario: string;
  objective: string;
  panel: HvacSimulationPanel;
  controls: HvacSimulationControl[];
  readings: HvacSimulationReading[];
  stage: {
    id: string;
    title: string;
    prompt: string;
    options: Array<{ id: string; label: string }>;
    observationRequired: boolean;
  } | null;
  stageNumber: number;
  stageCount: number;
  observed: boolean;
  finished: boolean;
  passed: boolean;
  score: number | null;
  feedback: HvacSimulationFeedback | null;
  sources: Array<{ label: string; url: string }>;
};

export type HvacSimulationProgress = {
  revision: number;
  attemptCount: number;
  mastered: boolean;
  bestScore: number | null;
  lastSavedAt: string | null;
};

export type HvacSimulationResponse = {
  success: true;
  simulation: HvacSimulationView;
  progress: HvacSimulationProgress;
};

export type HvacSimulationRequest = {
  courseId: string;
  lessonId: string;
  simulationId: string;
  expectedRevision: number;
  requestId: string;
  action: HvacSimulationAction | { type: 'reset' };
};
