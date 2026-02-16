import { APPRENTICESHIP } from '@/lib/compliance/apprenticeship';
import { Award } from 'lucide-react';

export function ApprenticeshipBadge() {
  const cfg = APPRENTICESHIP.IN;
  if (!cfg.enabled) return null;

  return (
    <div className="mt-4 rounded-2xl border border-brand-blue-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-brand-blue-600 rounded-lg flex items-center justify-center">
          <Award className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="text-lg font-bold text-black">
            Registered Apprenticeship (RAPIDS)
          </div>
          <div className="text-sm text-black">
            U.S. Department of Labor Certified
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <span className="text-slate-400 flex-shrink-0">•</span>
          <div className="text-sm text-black">
            <strong>State:</strong> {cfg.state}
          </div>
        </div>

        <div className="flex items-start gap-2">
          <span className="text-slate-400 flex-shrink-0">•</span>
          <div className="text-sm text-black">
            <strong>Sponsor:</strong> {cfg.sponsorName}
          </div>
        </div>

        <div className="flex items-start gap-2">
          <span className="text-slate-400 flex-shrink-0">•</span>
          <div className="text-sm text-black">
            <strong>Program:</strong> {cfg.programName}
          </div>
        </div>

        <div className="flex items-start gap-2">
          <span className="text-slate-400 flex-shrink-0">•</span>
          <div className="text-sm text-black">
            <strong>Pathway:</strong> Earn & Learn (Paid On-the-Job Training)
          </div>
        </div>

        {cfg.registrationNumber ? (
          <div className="flex items-start gap-2">
            <span className="text-slate-400 flex-shrink-0">•</span>
            <div className="text-sm text-black">
              <strong>USDOL Program #:</strong> {cfg.registrationNumber}
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <span className="text-slate-400 flex-shrink-0">•</span>
            <div className="text-sm text-black">
              Registered with the U.S. Department of Labor (RAPIDS)
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-brand-blue-200">
        <p className="text-xs text-black leading-relaxed">{cfg.notes}</p>
      </div>
    </div>
  );
}
