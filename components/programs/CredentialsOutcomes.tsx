import { Award, Building2 } from 'lucide-react';

interface CredentialsOutcomesProps {
  programName: string;
  partnerCertifications?: string[];
  employmentOutcomes?: string[];
}

export function CredentialsOutcomes({
  programName,
  partnerCertifications = [],
  employmentOutcomes = [],
}: CredentialsOutcomesProps) {
  return (
    <div className="bg-brand-blue-50 rounded-xl p-8 border-2 border-brand-blue-200">
      <h3 className="text-2xl font-bold text-black mb-6 flex items-center gap-3">
        <Award className="w-7 h-7 text-brand-blue-600" />
        Credentials & Outcomes
      </h3>
      
      <div className="space-y-4">
        {/* Institutional Certificate */}
        <div className="flex items-start gap-3">
          <span className="text-slate-400 flex-shrink-0">•</span>
          <div>
            <p className="text-black font-medium">
              Certificate of Completion issued by Elevate for Humanity Career & Technical Institute
            </p>
            <p className="text-sm text-slate-600 mt-1">
              Documents successful completion of the {programName} training program
            </p>
          </div>
        </div>

        {/* Partner Certifications */}
        {partnerCertifications.length > 0 && (
          <div className="flex items-start gap-3">
            <span className="text-slate-400 flex-shrink-0">•</span>
            <div>
              <p className="text-black font-medium">
                Preparation for third-party industry certifications
              </p>
              <p className="text-sm text-slate-600 mt-1">
                Issued by the credentialing organization upon passing their exam:
              </p>
              <ul className="text-sm text-slate-700 mt-2 space-y-1">
                {partnerCertifications.map((cert, i) => (
                  <li key={i}>• {cert}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Employment Outcomes */}
        {employmentOutcomes.length > 0 && (
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-brand-blue-600 mt-1 flex-shrink-0" />
            <div>
              <p className="text-black font-medium">
                Workforce-aligned training for employment pathways
              </p>
              <ul className="text-sm text-slate-700 mt-2 space-y-1">
                {employmentOutcomes.map((outcome, i) => (
                  <li key={i}>• {outcome}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="mt-6 pt-4 border-t border-brand-blue-200">
        <p className="text-xs text-slate-500">
          Note: Third-party certifications and state licenses are issued by external credentialing bodies, 
          not by Elevate for Humanity. Exam fees may apply separately.
        </p>
      </div>
    </div>
  );
}
