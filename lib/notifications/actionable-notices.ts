// Recurring clock reminders are time-sensitive, unlike documents, payment,
// announcements, and email. Keep the underlying notification history intact.
export const THEORY_REMINDER_LIFETIME_MS = 2 * 60 * 60 * 1000;

export function actionableNoticeFilter(now = Date.now()) {
  const cutoff = new Date(now - THEORY_REMINDER_LIFETIME_MS).toISOString();
  return `idempotency_key.is.null,idempotency_key.not.like.theory:%,created_at.gte.${cutoff}`;
}

type Notice = {
  id: string;
  title?: string;
  created_at?: string;
  idempotency_key?: string | null;
  metadata?: Record<string, unknown> | null;
};

export function actionableNotices<T extends Notice>(notices: T[], now = Date.now()): T[] {
  const schedules = new Set<string>();
  return [...notices]
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    .filter((notice) => {
      if (!notice.idempotency_key?.startsWith('theory:')) return true;
      const created = Date.parse(notice.created_at || '');
      if (!Number.isFinite(created) || now - created >= THEORY_REMINDER_LIFETIME_MS) return false;
      const schedule = String(notice.metadata?.schedule_id || notice.idempotency_key.split(':')[2]);
      if (schedules.has(schedule)) return false;
      schedules.add(schedule);
      return true;
    })
    .map((notice) =>
      notice.idempotency_key?.startsWith('theory:stop:')
        ? { ...notice, title: 'Scheduled theory block ended' }
        : notice,
    );
}
