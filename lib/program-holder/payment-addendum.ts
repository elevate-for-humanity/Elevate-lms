import { createHash } from 'node:crypto';

export function paymentAddendum(features: any, holderId: string) {
  const value = features?.payment_addendum;
  if (!value || typeof value.title !== 'string' || !Array.isArray(value.paragraphs) ||
      !value.paragraphs.length || !value.paragraphs.every((p: unknown) => typeof p === 'string') ||
      !Array.isArray(value.checklist) || !value.checklist.every((p: unknown) => typeof p === 'string') ||
      ![value.total_cents, value.start_cents, value.completion_cents].every(Number.isSafeInteger) ||
      value.start_cents <= 0 || value.completion_cents <= 0 ||
      value.start_cents + value.completion_cents !== value.total_cents) return null;
  const terms = { title: value.title as string, paragraphs: value.paragraphs as string[],
    checklist: value.checklist as string[], total_cents: value.total_cents as number,
    start_cents: value.start_cents as number, completion_cents: value.completion_cents as number };
  const hash = createHash('sha256').update(JSON.stringify(terms)).digest('hex');
  return { ...terms, version: `payment-addendum-${holderId}-${hash}` };
}
