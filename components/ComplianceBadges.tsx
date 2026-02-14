import { Shield, Award, CheckCircle, DollarSign } from 'lucide-react';

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
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
          <DollarSign className="w-4 h-4 text-green-700" />
          <span className="text-sm font-semibold text-green-900">WIOA Funded</span>
        </div>
      )}

      {showWRG && (
        <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full">
          <DollarSign className="w-4 h-4 text-purple-700" />
          <span className="text-sm font-semibold text-purple-900">WRG Eligible</span>
        </div>
      )}

      {showJRI && (
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-full">
          <DollarSign className="w-4 h-4 text-indigo-700" />
          <span className="text-sm font-semibold text-indigo-900">JRI Funded</span>
        </div>
      )}

      {showStateLicense && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full">
          <Award className="w-4 h-4 text-amber-700" />
          <span className="text-sm font-semibold text-amber-900">State Licensed</span>
        </div>
      )}

      {showJobPlacement && (
        <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-full">
          <CheckCircle className="w-4 h-4 text-orange-700" />
          <span className="text-sm font-semibold text-orange-900">Job Placement</span>
        </div>
      )}
    </div>
  );
}
