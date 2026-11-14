/**
 * StatusBadge — Unified status pill for all portal tables and cards.
 *
 * Replaces hand-rolled colored spans across admin, employer, staff, and LMS portals.
 * Semantic color mapping is defined here — do not re-implement per-portal.
 *
 * Usage:
 *   <StatusBadge status="active" />
 *   <StatusBadge status="pending" label="Awaiting Review" />
 *   <StatusBadge color="amber" label="On Hold" />
 */

import React from 'react';
import { cn } from '@/lib/utils';

type SemanticStatus =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'cancelled'
  | 'draft'
  | 'published'
  | 'archived'
  | 'enrolled'
  | 'waitlisted'
  | 'graduated'
  | 'withdrawn'
  | 'funded'
  | 'unfunded'
  | 'paid'
  | 'unpaid'
  | 'overdue'
  | 'passed'
  | 'failed'
  | 'in_progress'
  | 'not_started';

type BadgeColor = 'green' | 'red' | 'amber' | 'blue' | 'purple' | 'slate' | 'orange' | 'teal';

const STATUS_COLOR_MAP: Record<SemanticStatus, BadgeColor> = {
  active:      'green',
  enrolled:    'green',
  approved:    'green',
  completed:   'green',
  graduated:   'green',
  published:   'green',
  funded:      'green',
  paid:        'green',
  passed:      'green',

  pending:     'amber',
  waitlisted:  'amber',
  in_progress: 'amber',
  draft:       'amber',
  unfunded:    'amber',

  inactive:    'slate',
  archived:    'slate',
  not_started: 'slate',

  rejected:    'red',
  cancelled:   'red',
  withdrawn:   'red',
  failed:      'red',
  overdue:     'red',
  unpaid:      'red',
};

const STATUS_LABEL_MAP: Record<SemanticStatus, string> = {
  active:      'Active',
  inactive:    'Inactive',
  pending:     'Pending',
  approved:    'Approved',
  rejected:    'Rejected',
  completed:   'Completed',
  cancelled:   'Cancelled',
  draft:       'Draft',
  published:   'Published',
  archived:    'Archived',
  enrolled:    'Enrolled',
  waitlisted:  'Waitlisted',
  graduated:   'Graduated',
  withdrawn:   'Withdrawn',
  funded:      'Funded',
  unfunded:    'Unfunded',
  paid:        'Paid',
  unpaid:      'Unpaid',
  overdue:     'Overdue',
  passed:      'Passed',
  failed:      'Failed',
  in_progress: 'In Progress',
  not_started: 'Not Started',
};

const COLOR_CLASSES: Record<BadgeColor, string> = {
  green:  'bg-brand-green-100 text-brand-green-800',
  red:    'bg-red-100 text-red-800',
  amber:  'bg-amber-100 text-amber-800',
  blue:   'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  slate:  'bg-slate-100 text-slate-700',
  orange: 'bg-orange-100 text-orange-800',
  teal:   'bg-teal-100 text-teal-800',
};

interface StatusBadgeProps {
  /** Semantic status — auto-maps to color and label */
  status?: SemanticStatus;
  /** Override the display label */
  label?: string;
  /** Override the color (use when status is not in the semantic map) */
  color?: BadgeColor;
  className?: string;
  dot?: boolean;
}

export function StatusBadge({ status, label, color, className, dot = false }: StatusBadgeProps) {
  const resolvedColor: BadgeColor =
    color ?? (status ? STATUS_COLOR_MAP[status] : 'slate');
  const resolvedLabel =
    label ?? (status ? STATUS_LABEL_MAP[status] : '—');

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold',
        COLOR_CLASSES[resolvedColor],
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full flex-shrink-0',
            resolvedColor === 'green'  && 'bg-brand-green-500',
            resolvedColor === 'red'    && 'bg-red-500',
            resolvedColor === 'amber'  && 'bg-amber-500',
            resolvedColor === 'blue'   && 'bg-blue-500',
            resolvedColor === 'purple' && 'bg-purple-500',
            resolvedColor === 'slate'  && 'bg-slate-400',
            resolvedColor === 'orange' && 'bg-orange-500',
            resolvedColor === 'teal'   && 'bg-teal-500',
          )}
        />
      )}
      {resolvedLabel}
    </span>
  );
}
