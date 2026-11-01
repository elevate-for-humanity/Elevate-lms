export type SyncEvidence = {
  action: string;
  status: string;
  records: unknown;
  created_at: string;
};

/** Configuration edits and provider reads are not evidence of data synchronization. */
export function summarizeSyncEvidence(rows: readonly SyncEvidence[]) {
  const sync = rows.find((row) => {
    if (row.status !== 'success' || !row.records || typeof row.records !== 'object') return false;
    const receipt = row.records as Record<string, unknown>;
    return receipt.operation === 'synchronize' && receipt.committed === true &&
      typeof receipt.contacts === 'number' && Number.isSafeInteger(receipt.contacts) && receipt.contacts >= 0 &&
      typeof receipt.leads === 'number' && Number.isSafeInteger(receipt.leads) && receipt.leads >= 0 &&
      Number.isFinite(Date.parse(row.created_at));
  });
  const receipt = sync?.records as { contacts: number; leads: number } | undefined;
  return {
    last_sync: sync?.created_at ?? null,
    contacts: receipt?.contacts ?? null,
    leads: receipt?.leads ?? null,
  };
}
