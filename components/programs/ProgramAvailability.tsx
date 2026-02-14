/**
 * ProgramAvailability Component
 * 
 * Addresses soft holds #4, #9:
 * - Shows program availability status (Open/Closed/Waitlist)
 * - Displays next start date, cohort size, enrollment deadline
 * - Labels programs based on funding cycles
 * 
 * Use on program cards and program detail pages.
 */

import { Calendar, Users, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export type AvailabilityStatus = 
  | 'open'           // Accepting applications
  | 'waitlist'       // Full, accepting waitlist
  | 'closed'         // Not accepting applications
  | 'funding_pending' // Waiting on funding cycle
  | 'coming_soon';   // New program, not yet available

interface ProgramAvailabilityProps {
  status: AvailabilityStatus;
  nextStartDate?: string;
  enrollmentDeadline?: string;
  seatsAvailable?: number;
  totalSeats?: number;
  fundingCycle?: string;
  variant?: 'badge' | 'card' | 'inline';
  className?: string;
}

const STATUS_CONFIG: Record<AvailabilityStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: typeof CheckCircle;
  description: string;
}> = {
  open: {
    label: 'Open',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: CheckCircle,
    description: 'Accepting applications',
  },
  waitlist: {
    label: 'Waitlist',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    icon: Clock,
    description: 'Cohort full, join waitlist',
  },
  closed: {
    label: 'Closed',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: XCircle,
    description: 'Not accepting applications',
  },
  funding_pending: {
    label: 'Funding Cycle',
    color: 'text-brand-blue-700',
    bgColor: 'bg-brand-blue-100',
    icon: AlertCircle,
    description: 'Opens when funding confirmed',
  },
  coming_soon: {
    label: 'Launching',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    icon: Calendar,
    description: 'New program launching',
  },
};

export function ProgramAvailability({
  status,
  nextStartDate,
  enrollmentDeadline,
  seatsAvailable,
  totalSeats,
  fundingCycle,
  variant = 'badge',
  className = '',
}: ProgramAvailabilityProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  if (variant === 'badge') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color} ${className}`}>
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-4 text-sm ${className}`}>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium ${config.bgColor} ${config.color}`}>
          <Icon className="w-3.5 h-3.5" />
          {config.label}
        </span>
        {nextStartDate && (
          <span className="text-slate-600">
            <Calendar className="w-4 h-4 inline mr-1" />
            Starts {nextStartDate}
          </span>
        )}
        {seatsAvailable !== undefined && totalSeats && (
          <span className="text-slate-600">
            <Users className="w-4 h-4 inline mr-1" />
            {seatsAvailable}/{totalSeats} seats
          </span>
        )}
      </div>
    );
  }

  // Card variant
  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-4 ${className}`}>
      {/* Status Badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.color}`}>
          <Icon className="w-4 h-4" />
          {config.label}
        </span>
        {fundingCycle && (
          <span className="text-xs text-slate-500">{fundingCycle}</span>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-slate-600 mb-3">{config.description}</p>

      {/* Details */}
      <div className="space-y-2">
        {nextStartDate && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600">Next start:</span>
            <span className="font-medium text-slate-900">{nextStartDate}</span>
          </div>
        )}

        {enrollmentDeadline && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600">Apply by:</span>
            <span className="font-medium text-slate-900">{enrollmentDeadline}</span>
          </div>
        )}

        {seatsAvailable !== undefined && totalSeats && (
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600">Seats:</span>
            <span className={`font-medium ${seatsAvailable <= 3 ? 'text-amber-600' : 'text-slate-900'}`}>
              {seatsAvailable} of {totalSeats} available
              {seatsAvailable <= 3 && seatsAvailable > 0 && ' (filling fast)'}
            </span>
          </div>
        )}

        {status === 'funding_pending' && (
          <p className="text-xs text-brand-blue-600 mt-2">
            This program opens based on grant funding cycles. Submit an inquiry to be notified.
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Helper to determine availability status from program data
 */
export function getAvailabilityStatus(program: {
  status?: string;
  seats_available?: number;
  total_seats?: number;
  enrollment_open?: boolean;
  funding_confirmed?: boolean;
}): AvailabilityStatus {
  if (program.status === 'coming_soon') return 'coming_soon';
  if (program.funding_confirmed === false) return 'funding_pending';
  if (program.enrollment_open === false) return 'closed';
  if (program.seats_available === 0) return 'waitlist';
  return 'open';
}

export default ProgramAvailability;
