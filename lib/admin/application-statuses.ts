/**
 * Statuses that require admin attention on the operations dashboard and intake queue.
 * Keep aligned with apps/admin/app/admin/applications and public apply API outcomes.
 */
export const PENDING_APPLICATION_STATUSES = [
  'submitted',
  'pending',
  'in_review',
  'under_review',
  'pending_admin_review',
  'pending_funding',
] as const;

export type PendingApplicationStatus = (typeof PENDING_APPLICATION_STATUSES)[number];

/** Comma-separated value for ?status= query links */
export const PENDING_APPLICATION_STATUS_QUERY = PENDING_APPLICATION_STATUSES.join(',');

export function isPendingApplicationStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  return (PENDING_APPLICATION_STATUSES as readonly string[]).includes(status);
}
