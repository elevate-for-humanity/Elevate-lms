'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface EnrollmentCTAProps {
  programSlug: string;
  variant?: 'apply' | 'complete' | 'pay';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const CTA_LABELS = {
  apply: 'Apply to Program',
  complete: 'Complete Enrollment',
  pay: 'Pay & Enroll',
};

export function EnrollmentCTA({ 
  programSlug, 
  variant = 'apply',
  className = '',
  size = 'md'
}: EnrollmentCTAProps) {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <Link
      href={`/programs/${programSlug}/apply`}
      className={`inline-flex items-center justify-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-semibold rounded-lg transition-colors ${sizeClasses[size]} ${className}`}
    >
      {CTA_LABELS[variant]}
      <ArrowRight className="w-4 h-4" />
    </Link>
  );
}
