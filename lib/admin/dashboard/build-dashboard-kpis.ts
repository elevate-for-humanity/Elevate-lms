import type { KPICard } from '@/components/admin/dashboard/types';
import { formatCentsCompact, monthOverMonthDelta } from './format-metrics';

export interface BuildDashboardKpisInput {
  totalPending: number;
  oldestAppSub?: string;
  activeEnrollCount: number;
  lastMonthEnrollCount: number;
  revenueThisMonthCents: number;
  revenueLastMonthCents: number;
  revenueAllTimeCents: number;
  certsCount: number;
  certsThisMonth: number;
  newAppsThisMonth: number;
  newAppsLastMonth: number;
  inactiveLearnersCount: number;
  inactiveLearnersDegraded: boolean;
}

/** Four primary KPIs — no duplicate holder/doc cards on the main grid. */
export function buildDashboardKpis(input: BuildDashboardKpisInput): KPICard[] {
  const appsVolumeMoM = monthOverMonthDelta(input.newAppsThisMonth, input.newAppsLastMonth);
  const enrollMoM = monthOverMonthDelta(input.activeEnrollCount, input.lastMonthEnrollCount);
  const revMoM = monthOverMonthDelta(input.revenueThisMonthCents, input.revenueLastMonthCents);

  return [
    {
      label: 'Pending Applications',
      value: input.totalPending,
      delta: appsVolumeMoM.delta,
      deltaLabel: appsVolumeMoM.deltaLabel,
      href: '/applications?status=submitted,pending,in_review,pending_admin_review',
      urgent: input.totalPending > 0,
      sub: input.oldestAppSub ?? (input.totalPending > 0 ? 'Review intake queue' : 'No pending applications'),
    },
    {
      label: 'Active Enrollments',
      value: input.activeEnrollCount,
      delta: enrollMoM.delta,
      deltaLabel: enrollMoM.deltaLabel,
      href: '/students?status=active',
      urgent: !input.inactiveLearnersDegraded && input.inactiveLearnersCount > 0,
      sub: input.inactiveLearnersDegraded
        ? 'Could not load inactive learner data'
        : `${input.inactiveLearnersCount} with no activity in 3+ days`,
    },
    {
      label: 'Revenue This Month',
      value: input.revenueThisMonthCents,
      delta: revMoM.delta,
      deltaLabel: revMoM.deltaLabel,
      href: '/students?payment_status=paid',
      urgent: false,
      sub: `${formatCentsCompact(input.revenueAllTimeCents)} tracked cash all time · WIOA/grants separate`,
    },
    {
      label: 'Certificates Issued',
      value: input.certsCount,
      delta: 0,
      deltaLabel: `${input.certsThisMonth} issued this month`,
      href: '/certificates',
      urgent: false,
      sub: `${input.certsThisMonth} this month · ${input.certsCount} all time`,
    },
  ];
}
