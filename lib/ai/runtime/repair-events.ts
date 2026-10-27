import 'server-only';

const LOOKBACK_MS = 24 * 60 * 60 * 1000;
const PAGE_SIZE = 500;
const MAX_PAGES = 10;

/** GitHub cron can be delayed for hours. Read a bounded, overlapping day of
 * evidence, including recovery events, before deciding a failure is unresolved.
 * Fingerprints in the durable repair queue deduplicate repeated observations.
 */
export async function readRecentRepairEvents(db: any, now = Date.now()) {
  const events: any[] = [];
  const from = new Date(now - LOOKBACK_MS).toISOString();
  const through = new Date(now).toISOString();
  for (let page = 0; page < MAX_PAGES; page++) {
    const result = await db.from('paris_runtime_events')
      .select('id,operation,status,failure_category,correlation_id,created_at')
      .gte('created_at', from)
      .lte('created_at', through)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (result.error) throw result.error;
    if (!Array.isArray(result.data)) throw Error('PARIS_REPAIR_EVENT_EVIDENCE_REQUIRED');
    events.push(...result.data);
    if (result.data.length < PAGE_SIZE) return events;
  }
  // A partial scan cannot establish which operations recovered most recently.
  // Surface the limit instead of silently declaring that there is no work.
  throw Error('PARIS_REPAIR_EVENT_SCAN_LIMIT_EXCEEDED');
}
