'use client';

import React, { useState } from 'react';
import { AlertTriangle, CheckSquare, Square } from 'lucide-react';

/**
 * Beauty Enrollment Acknowledgment Component
 *
 * REQUIRED checkbox acknowledgment for all beauty apprenticeship enrollments.
 * Must be checked before enrollment can proceed.
 */

type ProgramType = 'barber' | 'nail-technician' | 'esthetician' | 'cosmetology';

interface BeautyEnrollmentAcknowledgmentProps {
  programType: ProgramType;
  onAcknowledge: (acknowledged: boolean) => void;
  acknowledged?: boolean;
  className?: string;
}

const PROGRAM_NAMES: Record<ProgramType, string> = {
  barber: 'Barber Apprenticeship',
  'nail-technician': 'Manicurist / Nail Technician Apprenticeship',
  esthetician: 'Esthetician Apprenticeship',
  cosmetology: 'Hair Stylist / Cosmetology Apprenticeship',
};

const REGISTERED_REQUIREMENTS: Record<ProgramType, string> = {
  barber: 'RAPIDS 0030CB V1 — competency-based: 14 verified Appendix A competencies plus 260 RTI hours; 500-hour probation.',
  'nail-technician': 'RAPIDS 2090CB V1 — competency-based: 19 verified Appendix A competencies plus 210 RTI hours; 500-hour probation.',
  esthetician: 'RAPIDS 2089CB V1 — competency-based: 20 verified Appendix A competencies plus 300 RTI hours; 500-hour probation.',
  cosmetology: 'RAPIDS 0096HY V1 — Hair Stylist (existing title: Cosmetologist), hybrid 2,000–2,500-hour term plus 154 RTI hours; 500-hour probation.',
};

const PROGRAM_FEES: Record<ProgramType, number> = {
  barber: 4980,
  'nail-technician': 2980,
  esthetician: 6000,
  cosmetology: 6000,
};

export function BeautyEnrollmentAcknowledgment({
  programType,
  onAcknowledge,
  acknowledged = false,
  className = '',
}: BeautyEnrollmentAcknowledgmentProps) {
  const [isChecked, setIsChecked] = useState(acknowledged);

  const programName = PROGRAM_NAMES[programType];
  const fee = PROGRAM_FEES[programType];
  const registeredRequirement = REGISTERED_REQUIREMENTS[programType];

  const handleToggle = () => {
    const newValue = !isChecked;
    setIsChecked(newValue);
    onAcknowledge(newValue);
  };

  return (
    <div className={`bg-amber-50 border-2 border-amber-300 rounded-lg p-6 ${className}`}>
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-amber-900 mb-2">Required Acknowledgment</h3>
          <p className="text-sm text-amber-800">
            Please read and acknowledge the following before proceeding with enrollment:
          </p>
        </div>
      </div>

      <div className="bg-white border border-amber-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-slate-700 leading-relaxed">
          <strong>Program Scope:</strong> {programName} is a Registered Apprenticeship pathway.
          Related Technical Instruction (RTI), supervised workplace training, sponsor oversight,
          RAPIDS/compliance records, and required occupational progress documentation work together
          as parts of the registered program.
        </p>
        <p className="text-sm text-slate-700 leading-relaxed mt-3">
          <strong>Licensing:</strong> Completion of the apprenticeship is not itself an Indiana
          professional license. After registered-program completion, the apprentice must follow the
          applicable Indiana examination and licensing process. Do not substitute traditional
          beauty-school hour requirements for this registered apprenticeship standard.
        </p>
        <p className="text-sm text-slate-700 leading-relaxed mt-3">
          <strong>Registered-program requirements:</strong> {registeredRequirement}
        </p>
        <p className="text-sm text-slate-700 leading-relaxed mt-3">
          <strong>Program Fee:</strong> The program fee of ${fee.toLocaleString('en-US')} is a flat
          rate. Credit for prior learning (transferred hours) may reduce the duration of
          participation but does not alter the program fee.
        </p>
      </div>

      <button
        type="button"
        onClick={handleToggle}
        className={`w-full flex items-start gap-3 p-4 rounded-lg border-2 transition-all ${
          isChecked
            ? 'bg-brand-green-50 border-brand-green-500'
            : 'bg-white border-slate-300 hover:border-amber-400'
        }`}
      >
        {isChecked ? (
          <CheckSquare className="w-6 h-6 text-brand-green-600 flex-shrink-0" />
        ) : (
          <Square className="w-6 h-6 text-slate-400 flex-shrink-0" />
        )}
        <span
          className={`text-left text-sm ${isChecked ? 'text-brand-green-800' : 'text-slate-700'}`}
        >
          <strong>I understand</strong> the registered apprenticeship requirements shown above,
          including that 500 hours is a probationary period rather than graduation, and that
          Indiana examination/licensing is a separate step after registered-program completion. I
          acknowledge that the program fee of ${fee.toLocaleString('en-US')} applies regardless
          of any transferred hours.
        </span>
      </button>

      {!isChecked && (
        <p className="text-xs text-amber-700 mt-3 text-center">
          You must acknowledge the above to proceed with enrollment.
        </p>
      )}
    </div>
  );
}

export default BeautyEnrollmentAcknowledgment;
