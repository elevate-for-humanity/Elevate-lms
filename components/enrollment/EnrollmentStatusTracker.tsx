'use client';

import { Clock, Circle, AlertCircle } from 'lucide-react';

export type EnrollmentStep = 
  | 'applied'
  | 'eligibility_review'
  | 'eligibility_confirmed'
  | 'funding_approved'
  | 'enrolled'
  | 'start_date_assigned'
  | 'active';

interface EnrollmentStatusTrackerProps {
  currentStep: EnrollmentStep;
  programName?: string;
  startDate?: string;
  advisorName?: string;
  nextAction?: string;
  className?: string;
}

const STEPS = [
  { key: 'applied', label: 'Applied', description: 'Application submitted' },
  { key: 'eligibility_review', label: 'Eligibility Review', description: 'WorkOne verification in progress' },
  { key: 'eligibility_confirmed', label: 'Eligible', description: 'Eligibility confirmed' },
  { key: 'funding_approved', label: 'Funded', description: 'Funding approved' },
  { key: 'enrolled', label: 'Enrolled', description: 'Enrollment confirmed' },
  { key: 'start_date_assigned', label: 'Start Date', description: 'Ready to begin' },
];

export function EnrollmentStatusTracker({
  currentStep,
  programName,
  startDate,
  advisorName,
  nextAction,
  className = '',
}: EnrollmentStatusTrackerProps) {
  const currentIndex = STEPS.findIndex(s => s.key === currentStep);

  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Enrollment Status</h3>
        {programName && (
          <p className="text-slate-600 text-sm">{programName}</p>
        )}
      </div>

      {/* Progress Steps */}
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-200" />
        <div 
          className="absolute left-4 top-4 w-0.5 bg-white transition-all duration-500"
          style={{ height: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
        />

        {/* Steps */}
        <div className="space-y-6">
          {STEPS.map((step, index) => {
            const isComplete = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isPending = index > currentIndex;

            return (
              <div key={step.key} className="flex items-start gap-4 relative">
                {/* Icon */}
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center z-10
                  ${isComplete ? 'bg-brand-green-500 text-white' : ''}
                  ${isCurrent ? 'bg-brand-blue-500 text-white ring-4 ring-brand-blue-100' : ''}
                  ${isPending ? 'bg-slate-100 text-slate-400 border border-slate-200' : ''}
                `}>
                  {isComplete && <span className="text-slate-500 flex-shrink-0">•</span>}
                  {isCurrent && <Clock className="w-5 h-5" />}
                  {isPending && <Circle className="w-4 h-4" />}
                </div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <p className={`font-medium ${isPending ? 'text-slate-400' : 'text-slate-900'}`}>
                    {step.label}
                  </p>
                  <p className={`text-sm ${isPending ? 'text-slate-300' : 'text-slate-500'}`}>
                    {step.description}
                  </p>
                  
                  {/* Show start date on final step */}
                  {step.key === 'start_date_assigned' && startDate && isComplete && (
                    <p className="text-sm font-medium text-brand-green-600 mt-1">
                      Starts: {startDate}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Next Action */}
      {nextAction && (
        <div className="mt-6 pt-4 border-t border-slate-100">
          <div className="flex items-start gap-3 bg-amber-50 rounded-lg p-4">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900 text-sm">Next Step</p>
              <p className="text-amber-800 text-sm">{nextAction}</p>
            </div>
          </div>
        </div>
      )}

      {/* Advisor Info */}
      {advisorName && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-sm text-slate-600">
            Your advisor: <span className="font-medium text-slate-900">{advisorName}</span>
          </p>
        </div>
      )}

      {/* Help Text */}
      <p className="mt-4 text-xs text-slate-500">
        Questions? Call <a href="/support" className="text-brand-blue-600 hover:underline">Get Help</a>
      </p>
    </div>
  );
}

/**
 * Compact inline version for dashboard headers
 */
export function EnrollmentStatusBadge({ 
  currentStep 
}: { 
  currentStep: EnrollmentStep 
}) {
  const statusConfig: Record<EnrollmentStep, { label: string; color: string }> = {
    applied: { label: 'Application Submitted', color: 'bg-brand-blue-100 text-brand-blue-700' },
    eligibility_review: { label: 'Eligibility Review', color: 'bg-amber-100 text-amber-700' },
    eligibility_confirmed: { label: 'Eligible', color: 'bg-brand-green-100 text-brand-green-700' },
    funding_approved: { label: 'Funding Approved', color: 'bg-brand-green-100 text-brand-green-700' },
    enrolled: { label: 'Enrolled', color: 'bg-purple-100 text-purple-700' },
    start_date_assigned: { label: 'Ready to Start', color: 'bg-brand-green-100 text-brand-green-700' },
    active: { label: 'Active', color: 'bg-brand-green-100 text-brand-green-700' },
  };

  const config = statusConfig[currentStep];

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
      <span className="w-2 h-2 rounded-full bg-current opacity-60" />
      {config.label}
    </span>
  );
}

export default EnrollmentStatusTracker;
