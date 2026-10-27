import { logger } from '@/lib/logger';

const OPEN_PLAN_STATES = ['active', 'pending', 'past_due', 'paused', 'approved'];

/** Apprentices retain billing. Other learners need an actual personal plan;
 * funding labels and old payment receipts alone never enable collection UI. */
export async function learnerCanSeeBilling(db: any, userId: string, role?: string | null): Promise<boolean> {
  if (String(role || '').toLowerCase().includes('apprentice')) return true;
  const plans = await db.from('payment_plans').select('id').eq('user_id', userId)
    .in('status', OPEN_PLAN_STATES).limit(1);
  if (plans.error) { logger.warn('Learner billing visibility: payment plan lookup unavailable'); return false; }
  if (plans.data?.length) return true;
  const authorizations = await db.from('billing_migration_authorizations').select('billing_schedule_id')
    .eq('user_id', userId).neq('status', 'superseded').not('billing_schedule_id', 'is', null);
  if (authorizations.error) { logger.warn('Learner billing visibility: schedule ownership lookup unavailable'); return false; }
  const ids = (authorizations.data || []).map((row: any) => row.billing_schedule_id).filter(Boolean);
  if (!ids.length) return false;
  const schedules = await db.from('billing_schedules').select('id').in('id', ids)
    .in('status', OPEN_PLAN_STATES).limit(1);
  if (schedules.error) { logger.warn('Learner billing visibility: owned schedule lookup unavailable'); return false; }
  return Boolean(schedules.data?.length);
}
