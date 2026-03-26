/**
 * Field extraction utilities.
 * For internal forms: reads field schema directly.
 * For external forms: reads DOM field labels/names/placeholders.
 */

export type ExtractedField = {
  fieldName: string;
  fieldLabel: string;
  fieldType: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'email' | 'tel' | 'url';
  placeholder?: string;
  helpText?: string;
  section?: string;
  required: boolean;
};

/**
 * Normalize raw label text for matching.
 * Strips punctuation, lowercases, collapses whitespace.
 */
export function normalizeFieldText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[*:?]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract fields from a static form schema definition.
 * Used for internal application pages where we define the schema.
 */
export function extractFieldsFromSchema(
  schema: Array<Omit<ExtractedField, 'fieldName'> & { fieldName: string }>
): ExtractedField[] {
  return schema.map((f) => ({
    ...f,
    fieldLabel: normalizeFieldText(f.fieldLabel),
  }));
}
