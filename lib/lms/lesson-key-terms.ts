export type LessonKeyTerm = { term: string; definition: string };

/** Support plain terms and structured terms without exposing serialized records to learners. */
export function lessonKeyTerms(value: unknown): LessonKeyTerm[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry): LessonKeyTerm[] => {
    if (typeof entry === 'string') {
      const term = entry.trim();
      return term ? [{ term, definition: '' }] : [];
    }
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
    const record = entry as Record<string, unknown>;
    const term = typeof record.term === 'string' ? record.term.trim() : '';
    const definition = typeof record.definition === 'string' ? record.definition.trim() : '';
    return term ? [{ term, definition }] : [];
  });
}
