'use client';

interface EnrollmentDisclaimerProps {
  variant?: 'footer' | 'modal' | 'inline';
  className?: string;
}

export function EnrollmentDisclaimer({
  variant = 'footer',
  className = '',
}: EnrollmentDisclaimerProps) {
  const content = (
    <>
      <p className="text-sm text-slate-700 mb-2">
        Enrollment is program-based. Courses, projects, and hands-on activities are part of your
        program and cannot be accessed independently.
      </p>
      <p className="text-sm text-slate-700">
        Some programs are publicly funded. Some are self-pay. All pathways are sponsor-managed and
        state-approved.
      </p>
    </>
  );

  if (variant === 'modal') {
    return (
      <div className={`bg-slate-50 rounded-lg p-4 border border-slate-200 ${className}`}>
        {content}
      </div>
    );
  }

  if (variant === 'inline') {
    return <div className={`text-center max-w-2xl mx-auto ${className}`}>{content}</div>;
  }

  // Footer variant
  return <div className={`border-t border-slate-200 pt-6 mt-8 ${className}`}>{content}</div>;
}
