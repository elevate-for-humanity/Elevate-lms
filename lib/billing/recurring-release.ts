export type RecurringRelease = { status?: string; document_path?: string | null; reviewed_by?: string | null };
export function hasRecurringReleaseEvidence(release: RecurringRelease | null | undefined): boolean {
  return release?.status === 'approved' && Boolean(release.document_path?.trim()) && Boolean(release.reviewed_by);
}
export async function hasVerifiedRecurringRelease(db: any, schedule: { id: string; amount_cents?: number; cadence?: string; customer_email?: string }) {
  const { data, error } = await db.from('billing_migration_authorizations').select('id,status,document_path,reviewed_by,amount_cents,cadence,customer_email').eq('billing_schedule_id', schedule.id).eq('authorization_scope', 'recurring_tuition').eq('status', 'approved').maybeSingle();
  if (error) throw new Error('Recurring-payment authorization could not be verified.');
  return hasRecurringReleaseEvidence(data) &&
    (schedule.amount_cents === undefined || Number(data.amount_cents) === Number(schedule.amount_cents)) &&
    (schedule.cadence === undefined || data.cadence === schedule.cadence) &&
    (schedule.customer_email === undefined || String(data.customer_email).toLowerCase() === schedule.customer_email.toLowerCase());
}
