export const RAPIDS_STATUSES = ['pending', 'registered', 'active', 'completed', 'exited'] as const;

export type RapidsStatus = (typeof RAPIDS_STATUSES)[number];

export function normalizeRapidsStatus(input: string): RapidsStatus {
  const normalized = input.toLowerCase().trim();
  if (RAPIDS_STATUSES.includes(normalized as any)) {
    return normalized as RapidsStatus;
  }
  return 'pending';
}

export function isValidRapidsStatus(status: string): boolean {
  return RAPIDS_STATUSES.includes(status as any);
}

export function getRapidsStatusColor(status: RapidsStatus): string {
  const colors: Record<RapidsStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    registered: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    completed: 'bg-purple-100 text-purple-800',
    exited: 'bg-slate-100 text-slate-800',
  };
  return colors[status] || 'bg-slate-100 text-slate-800';
}

export function getRapidsStatusLabel(status: RapidsStatus): string {
  const labels: Record<RapidsStatus, string> = {
    pending: 'Pending Registration',
    registered: 'Registered',
    active: 'Active',
    completed: 'Completed',
    exited: 'Exited',
  };
  return labels[status] || status;
}

export function canTransitionRapidsStatus(from: RapidsStatus, to: RapidsStatus): boolean {
  // Define valid status transitions
  const validTransitions: Record<RapidsStatus, RapidsStatus[]> = {
    pending: ['registered', 'exited'],
    registered: ['active', 'exited'],
    active: ['completed', 'exited'],
    completed: [], // Terminal state
    exited: [], // Terminal state
  };

  return validTransitions[from]?.includes(to) || false;
}
