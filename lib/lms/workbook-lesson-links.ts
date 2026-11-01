export const BARBER_WORKBOOK_SLUG = 'prestige-elevation-barbering';

export function workbookInstructionAnchor(sectionId: string): string {
  return `workbook-instruction-${sectionId}`;
}

export function workbookLessonHref(section: {
  id: string;
  course_id?: string | null;
  lesson_id: string | null;
}, slug: string): string | null {
  if (!section.course_id || !section.lesson_id) return null;
  const path = `/lms/courses/${encodeURIComponent(section.course_id)}/lessons/${encodeURIComponent(section.lesson_id)}`;
  return slug === BARBER_WORKBOOK_SLUG ? `${path}#${workbookInstructionAnchor(section.id)}` : path;
}

export type WorkbookInstruction = {
  type: 'workbook_instruction';
  workbook_slug: string;
  section_id: string;
  section_number: number;
  title: string;
  teaching: string;
  example: string;
  prompts: string[];
  recap: string;
  sources?: { title: string; url: string }[];
};

export function workbookInstructions(value: unknown): WorkbookInstruction[] {
  if (!Array.isArray(value)) return [];
  return value.filter((row): row is WorkbookInstruction =>
    row?.type === 'workbook_instruction' && row.workbook_slug === BARBER_WORKBOOK_SLUG &&
    typeof row.section_id === 'string' && /^[a-f0-9-]{36}$/i.test(row.section_id) &&
    Number.isInteger(row.section_number) && typeof row.title === 'string' &&
    typeof row.teaching === 'string' && typeof row.example === 'string' &&
    typeof row.recap === 'string' && Array.isArray(row.prompts) &&
    row.prompts.length === 3 && row.prompts.every((prompt: unknown) => typeof prompt === 'string'),
  ).sort((a, b) => a.section_number - b.section_number);
}
