import { describe, expect, it } from 'vitest';
import { loadPracticalServiceSummary } from '@/lib/apprenticeship/practical-dashboard';

function database(tables: Record<string, any[]>, failTable?: string) {
  return {
    from(table: string) {
      const q: any = {};
      for (const method of ['select', 'eq', 'in', 'order', 'limit', 'is', 'not'])
        q[method] = () => q;
      q.then = (resolve: any) =>
        Promise.resolve({
          data: tables[table] || [],
          error: table === failTable ? new Error('unavailable') : null,
        }).then(resolve, (error: any) => {
          throw error;
        });
      return q;
    },
  };
}

const requirements = [
  {
    id: 'req-haircut',
    service_name: 'Haircut',
    exercise_title: 'Haircutting',
    instructions: 'Complete the haircut.',
    required_count: 10,
    counts_for_completion: true,
    authority: 'elevate-program-practice',
  },
  {
    id: 'req-color',
    service_name: 'Single-process color',
    exercise_title: 'Hair Coloring',
    instructions: 'Complete the color.',
    required_count: 5,
    counts_for_completion: true,
    authority: 'elevate-program-practice',
  },
];

const progressRows = [
  { enrollment_id: 'enr-1', student_id: 'student-1', service_name: 'Haircut', recorded_count: 4 },
  { enrollment_id: 'enr-1', student_id: 'student-1', service_name: 'Single-process color', recorded_count: 5 },
];

const entries = [
  { id: 'e1', enrollment_id: 'enr-1', student_id: 'student-1', service_name: 'Haircut', performed_on: '2026-11-20', subject_type: 'patron', verified_at: '2026-11-20T10:00:00Z', voided_at: null },
  { id: 'e2', enrollment_id: 'enr-1', student_id: 'student-1', service_name: 'Single-process color', performed_on: '2026-11-21', subject_type: 'patron', verified_at: '2026-11-21T10:00:00Z', voided_at: null },
  { id: 'e3', enrollment_id: 'enr-1', student_id: 'student-1', service_name: 'Haircut', performed_on: '2026-11-19', subject_type: 'mannequin', verified_at: null, voided_at: null },
  { id: 'e4', enrollment_id: 'enr-1', student_id: 'student-1', service_name: 'Shave', performed_on: '2026-11-18', subject_type: 'patron', verified_at: '2026-11-18T10:00:00Z', voided_at: '2026-11-19T10:00:00Z' },
];

describe('loadPracticalServiceSummary', () => {
  it('aggregates program targets, verified totals, and recent verified entries', async () => {
    const db = database({
      apprenticeship_practical_service_requirements: requirements,
      host_shop_practical_service_progress: progressRows,
      host_shop_practical_service_entries: entries,
    });
    const summary = await loadPracticalServiceSummary(db as any, {
      enrollmentIds: ['enr-1'],
      programSlug: 'cosmetology-apprenticeship',
    });
    expect(summary.unavailable).toBe(false);
    expect(summary.hasTargets).toBe(true);
    // 4 of 10 haircuts + 5 of 5 colors = 9 of 15 required practices.
    expect(summary.recordedCount).toBe(9);
    expect(summary.requiredCount).toBe(15);
    expect(summary.percent).toBe(60);
    expect(summary.totalVerified).toBe(9);
    expect(summary.verifiedByStudent).toEqual({ 'student-1': 9 });
    // Only verified, non-voided entries, newest first.
    expect(summary.recentEntries.map((entry) => entry.id)).toEqual(['e2', 'e1']);
  });

  it('reports no targets instead of a misleading 100% when the program has none configured', async () => {
    const db = database({
      apprenticeship_practical_service_requirements: [],
      host_shop_practical_service_progress: progressRows,
      host_shop_practical_service_entries: entries,
    });
    const summary = await loadPracticalServiceSummary(db as any, {
      enrollmentIds: ['enr-1'],
      programSlug: 'barber-apprenticeship',
    });
    expect(summary.hasTargets).toBe(false);
    expect(summary.totalVerified).toBe(9);
    expect(summary.recentEntries).toHaveLength(2);
  });

  it('returns an empty summary when there are no enrollments', async () => {
    const summary = await loadPracticalServiceSummary(database({}) as any, {
      enrollmentIds: [],
      programSlug: 'barber-apprenticeship',
    });
    expect(summary).toEqual({
      unavailable: false,
      hasTargets: false,
      recordedCount: 0,
      requiredCount: 0,
      percent: 0,
      totalVerified: 0,
      recentEntries: [],
      verifiedByStudent: {},
    });
  });

  it('marks the summary unavailable instead of showing zeros when a query fails', async () => {
    const db = database(
      {
        apprenticeship_practical_service_requirements: requirements,
        host_shop_practical_service_progress: progressRows,
        host_shop_practical_service_entries: entries,
      },
      'host_shop_practical_service_entries',
    );
    const summary = await loadPracticalServiceSummary(db as any, {
      enrollmentIds: ['enr-1'],
      programSlug: 'cosmetology-apprenticeship',
    });
    expect(summary.unavailable).toBe(true);
    expect(summary.totalVerified).toBe(0);
    expect(summary.recentEntries).toEqual([]);
  });
});
