/**
 * EnrollmentExpectations Component
 * 
 * Addresses soft hold #1, #2, #5, #8:
 * - Sets clear expectations about the enrollment process
 * - Explains that enrollment is availability- and eligibility-based
 * - Shows what happens after applying
 * 
 * Use this component on:
 * - Apply pages
 * - Program pages
 * - Enrollment CTAs
 * - Dashboard (when status is pending)
 */

import { Clock, Users, FileText, Calendar } from 'lucide-react';

interface EnrollmentExpectationsProps {
  variant?: 'banner' | 'card' | 'inline' | 'compact';
  showTimeline?: boolean;
  className?: string;
}

export function EnrollmentExpectations({ 
  variant = 'banner', 
  showTimeline = false,
  className = '' 
}: EnrollmentExpectationsProps) {
  
  if (variant === 'compact') {
    return (
      <p className={`text-sm text-slate-600 ${className}`}>
        Enrollment is availability- and eligibility-based. After applying, a workforce advisor will confirm your placement and start date.
      </p>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`flex items-start gap-2 text-sm text-slate-600 ${className}`}>
        <Clock className="w-4 h-4 text-brand-blue-500 flex-shrink-0 mt-0.5" />
        <span>
          After applying, a workforce advisor will confirm your eligibility and start date within 2-3 business days.
        </span>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6 ${className}`}>
        <h3 className="font-semibold text-brand-blue-900 mb-3">What Happens After You Apply</h3>
        <p className="text-brand-blue-800 mb-4">
          Enrollment is availability- and eligibility-based. After applying, a workforce advisor will confirm your placement and start date.
        </p>
        {showTimeline && (
          <div className="space-y-3 mt-4">
            <TimelineStep 
              icon={<FileText className="w-4 h-4" />}
              title="Application Review"
              description="1-2 business days"
              status="pending"
            />
            <TimelineStep 
              icon={<Users className="w-4 h-4" />}
              title="Eligibility Verification"
              description="WorkOne appointment scheduled"
              status="pending"
            />
            <TimelineStep 
              icon={<span className="text-slate-400 flex-shrink-0">•</span>}
              title="Funding Confirmation"
              description="WIOA/WRG approval"
              status="pending"
            />
            <TimelineStep 
              icon={<Calendar className="w-4 h-4" />}
              title="Start Date Assigned"
              description="Based on cohort availability"
              status="pending"
            />
          </div>
        )}
      </div>
    );
  }

  // Default: banner
  return (
    <div className={`bg-slate-100 border-l-4 border-brand-blue-500 px-4 py-3 ${className}`}>
      <p className="text-slate-700 text-sm">
        <strong>Note:</strong> Enrollment is availability- and eligibility-based. After applying, a workforce advisor will confirm your placement and start date.
      </p>
    </div>
  );
}

interface TimelineStepProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: 'complete' | 'current' | 'pending';
}

function TimelineStep({ icon, title, description, status }: TimelineStepProps) {
  const statusColors = {
    complete: 'bg-brand-green-100 text-brand-green-600 border-brand-green-200',
    current: 'bg-brand-blue-100 text-brand-blue-600 border-brand-blue-200',
    pending: 'bg-slate-100 text-slate-400 border-slate-200',
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${statusColors[status]}`}>
        {icon}
      </div>
      <div>
        <p className={`font-medium text-sm ${status === 'pending' ? 'text-slate-500' : 'text-slate-900'}`}>
          {title}
        </p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </div>
  );
}

/**
 * Microcopy for CTAs
 * Use these exact strings to set proper expectations
 */
export const ENROLLMENT_MICROCOPY = {
  // For "Apply Now" buttons
  applyButton: 'Apply Now',
  applySubtext: 'A workforce advisor will confirm your eligibility and start date.',
  
  // For "Get Started" buttons
  getStartedButton: 'Get Started',
  getStartedSubtext: 'Takes 5 minutes. We\'ll match you to funded options if you qualify.',
  
  // For program pages without dates
  noDateAvailable: 'Start dates are assigned after eligibility confirmation.',
  
  // For enrollment pending states
  pendingStatus: 'Your application is being reviewed. A workforce advisor will contact you within 2-3 business days.',
  
  // For apprenticeship programs
  apprenticeshipNote: 'Apprenticeship placement depends on employer matching. We\'ll work with you to find the right shop.',
  
  // For funding-dependent programs
  fundingNote: 'This program is funded through workforce grants. Enrollment opens based on funding availability.',
};

export default EnrollmentExpectations;
