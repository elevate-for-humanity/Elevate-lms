export type SyncEvidence = {
  action: string;
  status: string;
  records: unknown;
  created_at: string;
};

const validCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
function resourceCounts(value: unknown): value is Record<string, number> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).length > 0 && Object.entries(value).every(([key, count]) =>
      /^[a-z][a-z_]{0,49}$/.test(key) && validCount(count)));
}

/** Configuration edits and provider reads are not evidence of data synchronization. */
export function summarizeSyncEvidence(rows: readonly SyncEvidence[]) {
  const sync = rows.find((row) => {
    if (row.action !== 'sync' || row.status !== 'success' || !row.records || typeof row.records !== 'object') return false;
    const receipt = row.records as Record<string, unknown>;
    const validResources = resourceCounts(receipt.resources);
    const validContactsAndLeads = validCount(receipt.contacts) && validCount(receipt.leads);
    return receipt.operation === 'synchronize' && receipt.committed === true &&
      (validResources || validContactsAndLeads) &&
      Number.isFinite(Date.parse(row.created_at));
  });
  const receipt = sync?.records as { contacts?: number; leads?: number; resources?: Record<string, number> } | undefined;
  return {
    last_sync: sync?.created_at ?? null,
    contacts: validCount(receipt?.contacts) ? receipt.contacts : null,
    leads: validCount(receipt?.leads) ? receipt.leads : null,
    ...(resourceCounts(receipt?.resources) ? { resources: receipt.resources } : {}),
  };
}
