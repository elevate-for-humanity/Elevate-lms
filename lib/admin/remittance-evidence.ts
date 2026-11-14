export type InitiatedRemittance = {
  processedDate: string; reference: string; allocatedAmount: number; currency: 'USD'; sourceMessageId: string;
};
/** A remittance instruction is never promoted to a settled payment. Batch totals are not invoice allocations. */
export function getInitiatedRemittances(value: unknown): InitiatedRemittance[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => {
    if (!item || typeof item !== 'object' || item.kind !== 'ach_initiated' || item.currency !== 'USD' ||
      typeof item.allocated_amount !== 'number' || !Number.isFinite(item.allocated_amount) || item.allocated_amount < 0 ||
      typeof item.processed_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(item.processed_date) ||
      typeof item.reference !== 'string' || !item.reference.trim() || typeof item.source_message_id !== 'string' || !item.source_message_id.trim()) return [];
    const parsed = new Date(item.processed_date + 'T00:00:00Z');
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== item.processed_date) return [];
    return [{ processedDate: item.processed_date, reference: item.reference, allocatedAmount: item.allocated_amount, currency: 'USD' as const, sourceMessageId: item.source_message_id }];
  });
}
