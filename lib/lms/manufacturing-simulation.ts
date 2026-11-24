/** Authored virtual practice. Scores never grant hours or equipment authorization. */
export type SimulationKind =
  | 'inspection'
  | 'load-plate'
  | 'sequence'
  | 'measurement'
  | 'defect-sort'
  | 'traceability';

export type SimulationAnswer = string | number | string[];
export type SimulationResponses = Record<string, SimulationAnswer>;
export interface SimulationOption {
  value: string;
  label: string;
}
export interface SimulationTask {
  id: string;
  type: 'choice' | 'number' | 'sequence';
  prompt: string;
  options?: SimulationOption[];
  expected: SimulationAnswer;
  unit?: string;
  tolerance?: number;
  critical?: boolean;
  rationale: string;
}
export interface SimulationExhibit {
  title: string;
  columns: Array<{ key: string; label: string }>;
  rows: Array<Record<string, string | number>>;
}
export interface ManufacturingSimulationSpec {
  version: 1;
  id: string;
  title: string;
  kind: SimulationKind;
  brief: string;
  exhibits: SimulationExhibit[];
  tasks: SimulationTask[];
  masteryThreshold: number;
  sourceUrls?: string[];
}
export type PublicSimulationTask = Omit<SimulationTask, 'expected' | 'rationale'>;
export type PublicManufacturingSimulation = Omit<ManufacturingSimulationSpec, 'tasks'> & {
  tasks: PublicSimulationTask[];
};
export interface SimulationFeedback {
  taskId: string;
  correct: boolean;
  critical: boolean;
  rationale: string;
  expected: SimulationAnswer;
}
export interface SimulationResult {
  score: number;
  completed: boolean;
  weakObjectives: string[];
  feedback: {
    practiceOnly: true;
    correctCount: number;
    taskCount: number;
    masteryThreshold: number;
    criticalMisses: number;
    tasks: SimulationFeedback[];
    reviewMessage: string;
  };
}

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function text(value: unknown, max = 6000): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}
function unique(values: string[]) {
  return new Set(values).size === values.length;
}
const kinds: SimulationKind[] = [
  'inspection',
  'load-plate',
  'sequence',
  'measurement',
  'defect-sort',
  'traceability',
];

/** Reject incomplete or ambiguous authoring instead of inventing an answer key. */
export function parseManufacturingSimulation(value: unknown): ManufacturingSimulationSpec | null {
  if (
    !record(value) ||
    value.version !== 1 ||
    !text(value.id, 200) ||
    !text(value.title, 300) ||
    !text(value.brief) ||
    !kinds.includes(value.kind as SimulationKind) ||
    typeof value.masteryThreshold !== 'number' ||
    !Number.isFinite(value.masteryThreshold) ||
    value.masteryThreshold < 1 ||
    value.masteryThreshold > 100 ||
    !Array.isArray(value.tasks) ||
    !value.tasks.length ||
    value.tasks.length > 50 ||
    !Array.isArray(value.exhibits) ||
    value.exhibits.length > 12
  )
    return null;

  for (const exhibit of value.exhibits) {
    if (
      !record(exhibit) ||
      !text(exhibit.title, 300) ||
      !Array.isArray(exhibit.columns) ||
      !exhibit.columns.length ||
      exhibit.columns.length > 12 ||
      !Array.isArray(exhibit.rows) ||
      exhibit.rows.length > 100
    )
      return null;
    if (
      exhibit.columns.some((c: unknown) => !record(c) || !text(c.key, 100) || !text(c.label, 200))
    )
      return null;
    if (!unique(exhibit.columns.map((c: { key: string }) => c.key))) return null;
    if (
      exhibit.rows.some(
        (row: unknown) =>
          !record(row) ||
          Object.values(row).some(
            (cell) =>
              !(typeof cell === 'string' && cell.length <= 3000) &&
              !(typeof cell === 'number' && Number.isFinite(cell)),
          ),
      )
    )
      return null;
  }
  for (const task of value.tasks) {
    if (
      !record(task) ||
      !text(task.id, 150) ||
      !text(task.prompt) ||
      !text(task.rationale) ||
      !['choice', 'number', 'sequence'].includes(String(task.type)) ||
      (task.critical !== undefined && typeof task.critical !== 'boolean') ||
      (task.unit !== undefined && !text(task.unit, 60))
    )
      return null;
    if (task.type === 'number') {
      if (
        typeof task.expected !== 'number' ||
        !Number.isFinite(task.expected) ||
        (task.tolerance !== undefined &&
          (typeof task.tolerance !== 'number' ||
            !Number.isFinite(task.tolerance) ||
            task.tolerance < 0))
      )
        return null;
    } else {
      if (
        !Array.isArray(task.options) ||
        task.options.length < 2 ||
        task.options.length > 30 ||
        task.options.some(
          (option: unknown) =>
            !record(option) || !text(option.value, 150) || !text(option.label, 2000),
        )
      )
        return null;
      const values = task.options.map((option: SimulationOption) => option.value);
      if (!unique(values)) return null;
      if (
        task.type === 'choice' &&
        (typeof task.expected !== 'string' || !values.includes(task.expected))
      )
        return null;
      if (
        task.type === 'sequence' &&
        (!Array.isArray(task.expected) ||
          task.expected.length !== values.length ||
          task.expected.some(
            (item: unknown) => typeof item !== 'string' || !values.includes(item),
          ) ||
          !unique(task.expected))
      )
        return null;
    }
  }
  if (!unique(value.tasks.map((task: { id: string }) => task.id))) return null;
  if (
    value.sourceUrls !== undefined &&
    (!Array.isArray(value.sourceUrls) ||
      value.sourceUrls.length > 20 ||
      value.sourceUrls.some(
        (url: unknown) => typeof url !== 'string' || !/^https:\/\//.test(url) || url.length > 2000,
      ))
  )
    return null;
  return value as unknown as ManufacturingSimulationSpec;
}

/** Only the authored problem reaches the first-load simulator response. */
export function publicManufacturingSimulation(
  spec: ManufacturingSimulationSpec,
): PublicManufacturingSimulation {
  return {
    version: spec.version,
    id: spec.id,
    title: spec.title,
    kind: spec.kind,
    brief: spec.brief,
    exhibits: spec.exhibits,
    masteryThreshold: spec.masteryThreshold,
    sourceUrls: spec.sourceUrls,
    tasks: spec.tasks.map(({ expected: _expected, rationale: _rationale, ...task }) => task),
  };
}

/** Accept exact saved task IDs and values; never accept a caller-provided score. */
export function evaluateManufacturingSimulation(
  spec: ManufacturingSimulationSpec,
  responses: unknown,
): SimulationResult | null {
  if (
    !record(responses) ||
    Object.keys(responses).length !== spec.tasks.length ||
    Object.keys(responses).some((id) => !spec.tasks.some((task) => task.id === id))
  )
    return null;
  const feedback: SimulationFeedback[] = [];
  for (const task of spec.tasks) {
    if (!Object.prototype.hasOwnProperty.call(responses, task.id)) return null;
    const answer = responses[task.id];
    let correct = false;
    if (task.type === 'number') {
      if (typeof answer !== 'number' || !Number.isFinite(answer)) return null;
      // Tiny epsilon accommodates floating-point subtraction at the stated tolerance boundary.
      correct =
        Math.abs(answer - Number(task.expected)) <=
        (task.tolerance ?? 0) + Number.EPSILON * Math.max(1, Math.abs(Number(task.expected))) * 4;
    } else if (task.type === 'choice') {
      if (typeof answer !== 'string' || !task.options?.some((option) => option.value === answer))
        return null;
      correct = answer === task.expected;
    } else {
      const choices = task.options?.map((option) => option.value) ?? [];
      if (
        !Array.isArray(answer) ||
        answer.length !== choices.length ||
        answer.some((item) => typeof item !== 'string' || !choices.includes(item)) ||
        !unique(answer)
      )
        return null;
      correct = answer.every((item, index) => item === (task.expected as string[])[index]);
    }
    feedback.push({
      taskId: task.id,
      correct,
      critical: task.critical === true,
      rationale: task.rationale,
      expected: task.expected,
    });
  }
  const correctCount = feedback.filter((item) => item.correct).length;
  const score = Math.round((correctCount / feedback.length) * 100);
  const criticalMisses = feedback.filter((item) => item.critical && !item.correct).length;
  const completed = score >= spec.masteryThreshold && criticalMisses === 0;
  return {
    score,
    completed,
    weakObjectives: spec.tasks
      .filter((_, index) => !feedback[index].correct)
      .map((task) => task.prompt),
    feedback: {
      practiceOnly: true,
      correctCount,
      taskCount: feedback.length,
      masteryThreshold: spec.masteryThreshold,
      criticalMisses,
      tasks: feedback,
      reviewMessage: completed
        ? 'Virtual practice passed. Complete the required employer training and equipment evaluation separately.'
        : criticalMisses
          ? 'A critical safety or quality decision needs correction. Review the feedback and retry every task.'
          : 'Review the missed tasks and retry to reach the practice mastery target.',
    },
  };
}
