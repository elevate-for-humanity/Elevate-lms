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

  it('returns empty degradedSections for null input', () => {
    const normalized = normalizeAdminDashboardData(null);
    // Null input returns fallback object with empty degradedSections
    // degradedSections is only populated by get-admin-dashboard-data.ts for partial failures
    expect(Array.isArray(normalized.degradedSections)).toBe(true);
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

  it('skips null KPI entries without throwing', () => {
    const normalized = normalizeAdminDashboardData({
      kpis: [
        null,
        { label: 'Applications', value: 3, delta: 0, deltaLabel: '', href: '/admin/applications' },
        undefined,
      ] as unknown as import('@/components/admin/dashboard/types').KPICard[],
    });

    expect(normalized.kpis).toHaveLength(1);
    expect(normalized.kpis[0].label).toBe('Applications');
  });

  it('skips null priority entries without throwing', () => {
    const normalized = normalizeAdminDashboardData({
      priorities: [
        null,
        {
          id: 'p2',
          type: 'application',
          label: 'Queue',
          href: '/admin/applications',
          score: 10,
          severity: 'high',
          context: '',
        },
        undefined,
      ] as unknown as import('@/lib/admin/priority-score').PriorityItem[],
    });

    expect(normalized.priorities).toHaveLength(1);
    expect(normalized.priorities[0].severity).toBe('high');
  });

  it('normalizes malformed system health alerts', () => {
    const normalized = normalizeAdminDashboardData({
      systemHealth: {
        alerts: [
          null,
          { code: 'stale_jobs', severity: 'warning', message: '2 stuck' },
          { code: 'bad', severity: 'urgent' as 'critical', message: undefined as unknown as string },
        ],
      } as unknown as import('@/components/admin/dashboard/types').AdminDashboardData['systemHealth'],
    });

    expect(normalized.systemHealth.alerts).toHaveLength(2);
    expect(normalized.systemHealth.alerts[0].code).toBe('stale_jobs');
    expect(normalized.systemHealth.alerts[1].severity).toBe('warning');
  });

  it('filters null site preview targets so Lizzy map cannot throw', () => {
    const normalized = normalizeAdminDashboardData({
      sitePreviewTargets: [
        null,
        { label: 'Public', url: 'https://www.elevateforhumanity.org' },
        { label: 'Bad', url: '' },
      ] as unknown as import('@/components/admin/dashboard/types').SitePreviewTarget[],
    });

    expect(normalized.sitePreviewTargets).toHaveLength(1);
    expect(normalized.sitePreviewTargets[0].url).toContain('elevateforhumanity.org');
  });

  it('coerces non-string profile full_name for greeting render', () => {
    const normalized = normalizeAdminDashboardData({
      profile: { full_name: 123 as unknown as string, role: 'admin' },
    });

    expect(normalized.profile?.full_name).toBeNull();
    expect(normalized.isSuperAdmin).toBe(true);
  });

  it('drops recent students without ids', () => {
    const normalized = normalizeAdminDashboardData({
      recentStudents: [
        { id: '', full_name: 'Bad', email: null, enrollment_status: null, created_at: null, program_name: null, href: '/x' },
        { id: 'abc', full_name: 'Good', email: null, enrollment_status: null, created_at: null, program_name: null, href: '/admin/students/abc' },
      ],
    });

    expect(normalized.recentStudents).toHaveLength(1);
    expect(normalized.recentStudents[0].id).toBe('abc');
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
