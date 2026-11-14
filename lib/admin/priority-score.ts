// Priority scoring for admin operational items.
// Weights match the DB function compute_priority_score() in migration 20260625000001.
// Keep these in sync if weights change.

export type PriorityItemType = 'compliance' | 'lead' | 'wioa' | 'enrollment' | 'system' | 'learner';

export interface PriorityInput {
  type: PriorityItemType;
  /** Days past the SLA threshold (not total days open — days *overdue*) */
  days?: number;
  /** 0–5: how much regulatory/legal exposure this creates */
  risk?: number;
  /** 0–5: revenue at risk if unresolved */
  money?: number;
  /** True if a user cannot progress until this is resolved */
  blocked?: boolean;
}

export interface PriorityItem {
  id: string;
  type: PriorityItemType;
  label: string;
  href: string;
  score: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  context: string;
}

export function calculatePriorityScore(i: PriorityInput): number {
  return (i.risk ?? 0) * 5 + (i.days ?? 0) * 2 + (i.money ?? 0) * 3 + (i.blocked ? 10 : 0);
}

export function scoreSeverity(score: number): PriorityItem['severity'] {
  if (score >= 30) return 'critical';
  if (score >= 15) return 'high';
  if (score >= 5) return 'medium';
  return 'low';
}

const SEVERITY_ORDER: Record<PriorityItem['severity'], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function sortPriorityItems(items: PriorityItem[]): PriorityItem[] {
  return [...items].sort((a, b) => {
    // Primary: score descending
    if (b.score !== a.score) return b.score - a.score;
    // Secondary: severity tier
    return SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
  });
}
