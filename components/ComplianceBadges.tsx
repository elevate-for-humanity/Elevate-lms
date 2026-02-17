import { Shield, Award, DollarSign } from 'lucide-react';

interface ComplianceBadgesProps {
  showDOL?: boolean;
  showWIOA?: boolean;
  showWRG?: boolean;
  showJRI?: boolean;
  showStateLicense?: boolean;
  showJobPlacement?: boolean;
}

export function ComplianceBadges({
  showDOL = true,
  showWIOA = true,
  showWRG = true,
  showJRI = false,
  showStateLicense = false,
  showJobPlacement = true,
}: ComplianceBadgesProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {showDOL && (
        <div className="flex items-center gap-2 px-4 py-2 bg-brand-blue-50 border border-brand-blue-200 rounded-full">
          <Shield className="w-4 h-4 text-brand-blue-700" />
          <span className="text-sm font-semibold text-brand-blue-900">DOL Registered</span>
        </div>
      )}

      {showWIOA && (
        <div className="flex items-center gap-2 px-4 py-2 bg-brand-green-50 border border-brand-green-200 rounded-full">
          <DollarSign className="w-4 h-4 text-brand-green-700" />
          <span className="text-sm font-semibold text-brand-green-900">WIOA Funded</span>
        </div>
      )}

      {showWRG && (
        <div className="flex items-center gap-2 px-4 py-2 bg-brand-blue-50 border border-brand-blue-200 rounded-full">
          <DollarSign className="w-4 h-4 text-brand-blue-700" />
          <span className="text-sm font-semibold text-brand-blue-900">WRG Eligible</span>
        </div>
      )}

      {showJRI && (
        <div className="flex items-center gap-2 px-4 py-2 bg-brand-red-50 border border-brand-red-200 rounded-full">
          <DollarSign className="w-4 h-4 text-brand-red-700" />
          <span className="text-sm font-semibold text-brand-red-900">JRI Funded</span>
        </div>
      )}

      {showStateLicense && (
        <div className="flex items-center gap-2 px-4 py-2 bg-brand-orange-50 border border-brand-orange-200 rounded-full">
          <Award className="w-4 h-4 text-brand-orange-700" />
          <span className="text-sm font-semibold text-brand-orange-900">State Licensed</span>
        </div>
      )}

      {showJobPlacement && (
        <div className="flex items-center gap-2 px-4 py-2 bg-brand-orange-50 border border-brand-orange-200 rounded-full">
          <span className="text-slate-400 flex-shrink-0">•</span>
          <span className="text-sm font-semibold text-brand-orange-900">Job Placement</span>
        </div>
      )}
    </div>
  );
}
