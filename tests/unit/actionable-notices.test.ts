import { expect, it } from 'vitest';
import { actionableNoticeFilter, actionableNotices } from '@/lib/notifications/actionable-notices';

const now = Date.parse('2026-10-31T12:00:00Z');
const theory = (id: string, event: string, created_at: string, schedule = 'assigned') => ({
  id, title: 'Theory session complete', created_at,
  idempotency_key: `theory:${event}:${schedule}:2026-10-31`,
  metadata: { schedule_id: schedule, event },
});
it('keeps real unresolved notices regardless of age while expiring recurring theory reminders', () => {
  const result = actionableNotices([
    { id: 'documents', title: 'Missing document', created_at: '2026-01-01T00:00:00Z' },
    theory('yesterday', 'start', '2026-10-30T11:00:00Z'),
    theory('boundary', 'stop', '2026-10-31T10:00:00Z'),
  ], now);
  expect(result.map(row => row.id)).toEqual(['documents']);
});
it('shows only the latest event per schedule without falsely claiming study completion', () => {
  const result = actionableNotices([
    theory('start', 'start', '2026-10-31T11:00:00Z'),
    theory('stop', 'stop', '2026-10-31T11:45:00Z'),
    theory('other-course', 'start', '2026-10-31T11:30:00Z', 'other'),
  ], now);
  expect(result.map(row => row.id)).toEqual(['stop', 'other-course']);
  expect(result[0].title).toBe('Scheduled theory block ended');
});
it('filters stale theory before the database limit so real notices are not crowded out', () => {
  expect(actionableNoticeFilter(now)).toBe('idempotency_key.is.null,idempotency_key.not.like.theory:%,created_at.gte.2026-10-31T10:00:00.000Z');
});
