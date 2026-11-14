export const WORKBOOK_FIELDS = [
  'notes',
  'practice1',
  'practice2',
  'practice3',
  'nextGoal',
] as const;
export type WorkbookAnswers = Record<(typeof WORKBOOK_FIELDS)[number], string>;
export const emptyWorkbookAnswers = (): WorkbookAnswers => ({
  notes: '',
  practice1: '',
  practice2: '',
  practice3: '',
  nextGoal: '',
});

export function validWorkbookSave(value: unknown): value is {
  answers: WorkbookAnswers;
  reviewed: boolean;
  expectedVersion: number;
} {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  if (
    typeof row.reviewed !== 'boolean' ||
    !Number.isSafeInteger(row.expectedVersion) ||
    Number(row.expectedVersion) < 0
  )
    return false;
  if (!row.answers || typeof row.answers !== 'object' || Array.isArray(row.answers)) return false;
  const answers = row.answers as Record<string, unknown>;
  return (
    Object.keys(answers).length === WORKBOOK_FIELDS.length &&
    WORKBOOK_FIELDS.every(
      (key) => typeof answers[key] === 'string' && answers[key].length <= 6000,
    ) &&
    new TextEncoder().encode(JSON.stringify(answers)).byteLength <= 60000
  );
}
