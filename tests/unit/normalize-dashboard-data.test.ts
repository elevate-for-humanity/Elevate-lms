import { describe, expect, it } from 'vitest';
import { normalizeAdminDashboardData } from '@/lib/admin/normalize-dashboard-data';

describe('normalizeAdminDashboardData', () => {
  it('fills missing arrays and coerces array counts to numbers', () => {
    const normalized = normalizeAdminDashboardData({
      counts: {
        pendingApplications: [{ id: '1' }, { id: '2' }] as unknown as number,
        activeEnrollments: 3,
        revenueThisMonthCents: 0,
        certificatesIssued: 0,
        pendingProgramHolders: 0,
        pendingDocuments: 0,
      },
    });

    expect(normalized.counts.pendingApplications).toBe(2);
    expect(Array.isArray(normalized.kpis)).toBe(true);
    expect(Array.isArray(normalized.recentApplications)).toBe(true);
    expect(normalized.isSuperAdmin).toBe(false);
  });

  it('returns degraded fallback for null input', () => {
    const normalized = normalizeAdminDashboardData(null);
    expect(normalized.degradedSections).toContain('dashboard_data');
    expect(normalized.counts.pendingApplications).toBe(0);
  });
});
