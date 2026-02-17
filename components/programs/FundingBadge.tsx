import { DollarSign, Award } from 'lucide-react';

interface FundingBadgeProps {
  type: 'funded' | 'self-pay';
  className?: string;
}

export function FundingBadge({ type, className = '' }: FundingBadgeProps) {
  if (type === 'funded') {
    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 bg-brand-green-100 text-brand-green-800 rounded-full text-sm font-medium ${className}`}>
        <Award className="w-4 h-4" />
        <span>Funded: Tuition-free if eligible (WIOA/WRG/JRI)</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-medium ${className}`}>
      <DollarSign className="w-4 h-4" />
      <span>Self-Pay: Tuition required (not state funded)</span>
    </div>
  );
}

export function FundingBadgeCompact({ type, className = '' }: FundingBadgeProps) {
  if (type === 'funded') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 bg-brand-green-100 text-brand-green-700 rounded text-xs font-medium ${className}`}>
        <Award className="w-3 h-3" />
        Funded
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium ${className}`}>
      <DollarSign className="w-3 h-3" />
      Self-Pay
    </span>
  );
}
