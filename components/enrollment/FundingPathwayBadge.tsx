'use client';

import { Building2, Users, DollarSign } from 'lucide-react';
import { FundingPathway } from '@/types/enrollment';

interface FundingPathwayBadgeProps {
  pathway: FundingPathway;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const PATHWAY_CONFIG = {
  workforce_funded: {
    label: 'Workforce-Funded',
    shortLabel: 'Workforce',
    icon: Users,
    bgColor: 'bg-brand-green-100',
    textColor: 'text-brand-green-700',
    borderColor: 'border-brand-green-200',
  },
  employer_sponsored: {
    label: 'Employer-Sponsored',
    shortLabel: 'Employer',
    icon: Building2,
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
  },
  structured_tuition: {
    label: 'Structured Tuition',
    shortLabel: 'Bridge Plan',
    icon: DollarSign,
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-200',
  },
};

export function FundingPathwayBadge({ 
  pathway, 
  size = 'md',
  showLabel = true 
}: FundingPathwayBadgeProps) {
  const config = PATHWAY_CONFIG[pathway];
  
  if (!config) return null;
  
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span className={`
      inline-flex items-center gap-1.5 rounded-full font-medium
      ${config.bgColor} ${config.textColor} ${sizeClasses[size]}
    `}>
      <Icon className={iconSizes[size]} />
      {showLabel && (size === 'sm' ? config.shortLabel : config.label)}
    </span>
  );
}

// Full card version for dashboards
interface FundingPathwayCardProps {
  pathway: FundingPathway;
  enrollmentStatus?: string;
  paymentStatus?: {
    downPaymentPaid?: boolean;
    monthsPaid?: number;
    maxMonths?: number;
    balanceRemaining?: number;
    nextPaymentDue?: string;
  };
}

export function FundingPathwayCard({ 
  pathway, 
  enrollmentStatus,
  paymentStatus 
}: FundingPathwayCardProps) {
  const config = PATHWAY_CONFIG[pathway];
  
  if (!config) return null;
  
  const Icon = config.icon;

  return (
    <div className={`rounded-xl border-2 ${config.borderColor} ${config.bgColor} p-4`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${config.textColor}`} />
        </div>
        <div>
          <p className="text-xs text-gray-500">Funding Pathway</p>
          <p className={`font-semibold ${config.textColor}`}>{config.label}</p>
        </div>
      </div>
      
      {pathway === 'workforce_funded' && (
        <p className="text-sm text-gray-600">
          Your training is funded through a workforce program. No payment required.
        </p>
      )}
      
      {pathway === 'employer_sponsored' && (
        <p className="text-sm text-gray-600">
          Your employer is sponsoring your training through post-hire reimbursement.
        </p>
      )}
      
      {pathway === 'structured_tuition' && paymentStatus && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Down Payment</span>
            <span className={paymentStatus.downPaymentPaid ? 'text-brand-green-600' : 'text-amber-600'}>
              {paymentStatus.downPaymentPaid ? 'Paid' : 'Due'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Monthly Payments</span>
            <span className="text-gray-900">
              {paymentStatus.monthsPaid || 0} / {paymentStatus.maxMonths || 3}
            </span>
          </div>
          {paymentStatus.balanceRemaining !== undefined && paymentStatus.balanceRemaining > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Balance</span>
              <span className="font-medium text-gray-900">
                ${paymentStatus.balanceRemaining.toFixed(2)}
              </span>
            </div>
          )}
          {paymentStatus.nextPaymentDue && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Next Payment</span>
              <span className="text-gray-900">
                {new Date(paymentStatus.nextPaymentDue).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Enrollment status with pathway for admin views
interface EnrollmentStatusBadgeProps {
  status: string;
  pathway?: FundingPathway;
}

export function EnrollmentStatusBadge({ status, pathway }: EnrollmentStatusBadgeProps) {
  const statusConfig: Record<string, { bg: string; text: string }> = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    active: { bg: 'bg-brand-green-100', text: 'text-brand-green-700' },
    paused: { bg: 'bg-brand-orange-100', text: 'text-brand-orange-700' },
    completed: { bg: 'bg-brand-blue-100', text: 'text-brand-blue-700' },
    cancelled: { bg: 'bg-gray-100', text: 'text-gray-600' },
    withdrawn: { bg: 'bg-brand-red-100', text: 'text-brand-red-700' },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <div className="flex items-center gap-2">
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {status}
      </span>
      {pathway && <FundingPathwayBadge pathway={pathway} size="sm" />}
    </div>
  );
}
