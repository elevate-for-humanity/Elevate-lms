import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

interface EligibilityNoticeProps {
  variant?: 'inline' | 'banner' | 'compact';
  className?: string;
}

/**
 * Eligibility notice component for program pages.
 * Displays the required disclaimer about WorkOne eligibility determination.
 */
export function EligibilityNotice({ variant = 'inline', className = '' }: EligibilityNoticeProps) {
  if (variant === 'compact') {
    return (
      <p className={`text-sm text-gray-600 ${className}`}>
        <span className="font-medium">Eligibility Required:</span>{' '}
        Approval through WorkOne / Indiana Career Connect is required before enrollment.{' '}
        <Link href="/check-eligibility" className="text-brand-blue-600 hover:underline">
          Check eligibility →
        </Link>
      </p>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`bg-amber-50 border border-amber-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-900 font-medium">
              Eligibility approval through WorkOne / Indiana Career Connect is required before enrollment.
            </p>
            <Link 
              href="/check-eligibility" 
              className="text-amber-700 text-sm hover:underline mt-1 inline-block"
            >
              Check eligibility before applying →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Default: inline variant
  return (
    <div className={`flex items-center gap-2 text-gray-600 ${className}`}>
      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
      <p className="text-sm">
        <span className="font-medium">Eligibility Notice:</span>{' '}
        Approval through WorkOne / Indiana Career Connect is required before enrollment.{' '}
        <Link href="/check-eligibility" className="text-brand-blue-600 hover:underline">
          Learn more
        </Link>
      </p>
    </div>
  );
}

/**
 * Pre-form disclaimer for enrollment flows.
 * Required before any application form.
 */
export function EnrollmentDisclaimer({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600 ${className}`}>
      <p>
        <strong>Important:</strong> Submitting this application does not guarantee eligibility or funding.
        Eligibility is determined by WorkOne / Indiana Career Connect.
      </p>
    </div>
  );
}
