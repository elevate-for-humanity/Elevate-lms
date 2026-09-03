import { describe, expect, it } from 'vitest';
import {
  PENDING_APPLICATION_STATUSES,
  PENDING_APPLICATION_STATUS_QUERY,
  isPendingApplicationStatus,
} from '@/lib/admin/application-statuses';

describe('application-statuses', () => {
  it('includes pending_funding and pending_admin_review', () => {
    expect(PENDING_APPLICATION_STATUSES).toContain('pending_funding');
    expect(PENDING_APPLICATION_STATUSES).toContain('pending_admin_review');
    expect(PENDING_APPLICATION_STATUS_QUERY).toContain('pending_funding');
  });

  it('detects pending statuses', () => {
    expect(isPendingApplicationStatus('pending_funding')).toBe(true);
    expect(isPendingApplicationStatus('approved')).toBe(false);
  });
});
