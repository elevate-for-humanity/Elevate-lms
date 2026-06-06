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

  it('normalizes malformed KPI cards so render cannot throw on deltaLabel', () => {
    const normalized = normalizeAdminDashboardData({
      kpis: [
        {
          label: 'Active Enrollments',
          value: 12,
          delta: 5,
          deltaLabel: undefined as unknown as string,
          href: '/admin/students',
        },
      ],
    });

    expect(normalized.kpis[0].deltaLabel).toBe('');
    expect(normalized.kpis[0].value).toBe(12);
  });

  it('coerces invalid priority severity to low', () => {
    const normalized = normalizeAdminDashboardData({
      priorities: [
        {
          id: 'p1',
          type: 'application',
          label: 'Review queue',
          href: '/admin/applications',
          score: 90,
          severity: 'urgent' as 'critical',
          context: '3 pending',
        },
      ],
    });

    expect(normalized.priorities[0].severity).toBe('low');
  });

  it('normalizes operational counters when partial payload omits fields', () => {
    const normalized = normalizeAdminDashboardData({
      operational: {
        newAppsToday: undefined as unknown as number,
        newLeadsToday: 2,
      },
    });

    expect(normalized.operational.newAppsToday).toBe(0);
    expect(normalized.operational.newLeadsToday).toBe(2);
    expect(typeof normalized.operational.needsReviewDetail).toBe('string');
  });
});
