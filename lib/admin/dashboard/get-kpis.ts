import type { SupabaseClient } from '@supabase/supabase-js';

export interface DashboardKpis {
  activeEnrollments: number;
  submittedApplications: number;
  completedPrograms: number;
  placedStudents: number;
  pendingPayrollAmount: number;
  finance: {
    pendingPayrollCount: number;
    pendingPayrollAmount: number;
    approvedPayrollAmount: number;
    paidPayrollAmount: number;
  };
}

export async function getKpis(db: SupabaseClient): Promise<DashboardKpis> {
  const [
    activeEnrollments,
    submittedApplications,
    completedPrograms,
    placedStudents,
    payroll,
  ] = await Promise.all([
    db.from('program_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),

    db.from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('stage', 'submitted'),

    db.from('program_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed'),

    db.from('placements')
      .select('id', { count: 'exact', head: true })
      .not('placed_at', 'is', null),

    db.from('payroll_records')
      .select('status, amount')
      .in('status', ['pending', 'approved', 'paid']),
  ]);

  const payrollRows = payroll.data ?? [];
  const pending   = payrollRows.filter(r => r.status === 'pending');
  const approved  = payrollRows.filter(r => r.status === 'approved');
  const paid      = payrollRows.filter(r => r.status === 'paid');
  const sum = (rows: typeof payrollRows) => rows.reduce((acc, r) => acc + (r.amount ?? 0), 0);

  return {
    activeEnrollments:      activeEnrollments.count  ?? 0,
    submittedApplications:  submittedApplications.count ?? 0,
    completedPrograms:      completedPrograms.count  ?? 0,
    placedStudents:         placedStudents.count     ?? 0,
    pendingPayrollAmount:   sum(pending),
    finance: {
      pendingPayrollCount:    pending.length,
      pendingPayrollAmount:   sum(pending),
      approvedPayrollAmount:  sum(approved),
      paidPayrollAmount:      sum(paid),
    },
  };
}
