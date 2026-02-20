
import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PrintButton } from '../PrintButton';

export const metadata: Metadata = {
  title: 'Supervisor Verification Form — Barber Apprenticeship | Elevate for Humanity',
  description: 'Licensed barber supervisor verification form. Documents shop license, supervisor license, and training authority for apprenticeship compliance.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/compliance/competency-verification/barber/supervisor-verification' },
};

export default function SupervisorVerificationPage() {

  return (
    <div className="bg-white min-h-screen print:bg-white print:text-[11px]">
      {/* Screen nav */}
      <div className="bg-slate-50 border-b print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Compliance', href: '/compliance' },
            { label: 'Barber Rubric', href: '/compliance/competency-verification/barber' },
            { label: 'Supervisor Verification' },
          ]} />
        </div>
      </div>

      {/* Screen header */}
      <div className="print:hidden py-8 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Supervisor Verification Form</h1>
          <p className="text-gray-600 mb-4">
            Required for each barbershop training site. Verifies licensed supervisor authority before apprentice placement.
          </p>
          <PrintButton />
        </div>
      </div>

      {/* Print header */}
      <div className="hidden print:block px-8 pt-8 pb-4 border-b-2 border-gray-900">
        <p className="text-[9px] uppercase tracking-widest text-gray-500 mb-1">Elevate for Humanity Career and Technical Institute</p>
        <h1 className="text-lg font-bold">LICENSED BARBER SUPERVISOR VERIFICATION FORM</h1>
        <p className="text-[10px] text-gray-600">Barbering Apprenticeship Program | RAPIDS ID: 2025-IN-132301</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 print:px-8 print:py-6 print:max-w-none">
        {/* Shop Information */}
        <div className="border-2 rounded-lg p-5 mb-6 print:p-4 print:mb-5 print:border-gray-400">
          <h2 className="font-bold text-base mb-4 print:text-[12px] print:mb-3">Barbershop Information</h2>
          <div className="space-y-4 text-sm print:text-[10px] print:space-y-3">
            <div>Barbershop Name: <span className="border-b border-gray-400 inline-block min-w-[300px]">&nbsp;</span></div>
            <div>Shop Address: <span className="border-b border-gray-400 inline-block min-w-[300px]">&nbsp;</span></div>
            <div className="grid grid-cols-2 gap-4 print:gap-3">
              <div>City: <span className="border-b border-gray-400 inline-block min-w-[120px]">&nbsp;</span></div>
              <div>State: Indiana &nbsp;&nbsp; ZIP: <span className="border-b border-gray-400 inline-block min-w-[60px]">&nbsp;</span></div>
            </div>
            <div className="grid grid-cols-2 gap-4 print:gap-3">
              <div>Indiana Shop License #: <span className="border-b border-gray-400 inline-block min-w-[120px]">&nbsp;</span></div>
              <div>License Expiration: <span className="border-b border-gray-400 inline-block min-w-[100px]">&nbsp;</span></div>
            </div>
            <div className="grid grid-cols-2 gap-4 print:gap-3">
              <div>Shop Phone: <span className="border-b border-gray-400 inline-block min-w-[120px]">&nbsp;</span></div>
              <div>Shop Owner Name: <span className="border-b border-gray-400 inline-block min-w-[120px]">&nbsp;</span></div>
            </div>
          </div>
        </div>

        {/* Supervisor Information */}
        <div className="border-2 rounded-lg p-5 mb-6 print:p-4 print:mb-5 print:border-gray-400">
          <h2 className="font-bold text-base mb-4 print:text-[12px] print:mb-3">Supervising Barber Information</h2>
          <div className="space-y-4 text-sm print:text-[10px] print:space-y-3">
            <div>Supervisor Full Name: <span className="border-b border-gray-400 inline-block min-w-[300px]">&nbsp;</span></div>
            <div className="grid grid-cols-2 gap-4 print:gap-3">
              <div>Indiana Barber License #: <span className="border-b border-gray-400 inline-block min-w-[120px]">&nbsp;</span></div>
              <div>License Expiration: <span className="border-b border-gray-400 inline-block min-w-[100px]">&nbsp;</span></div>
            </div>
            <div className="grid grid-cols-2 gap-4 print:gap-3">
              <div>State of Licensure: <span className="border-b border-gray-400 inline-block min-w-[80px]">Indiana</span></div>
              <div>Years Licensed: <span className="border-b border-gray-400 inline-block min-w-[60px]">&nbsp;</span></div>
            </div>
            <div className="grid grid-cols-2 gap-4 print:gap-3">
              <div>Phone: <span className="border-b border-gray-400 inline-block min-w-[120px]">&nbsp;</span></div>
              <div>Email: <span className="border-b border-gray-400 inline-block min-w-[160px]">&nbsp;</span></div>
            </div>
          </div>
        </div>

        {/* Apprentice Assignment */}
        <div className="border-2 rounded-lg p-5 mb-6 print:p-4 print:mb-5 print:border-gray-400">
          <h2 className="font-bold text-base mb-4 print:text-[12px] print:mb-3">Apprentice Assignment</h2>
          <div className="space-y-4 text-sm print:text-[10px] print:space-y-3">
            <div>Apprentice Name: <span className="border-b border-gray-400 inline-block min-w-[300px]">&nbsp;</span></div>
            <div className="grid grid-cols-2 gap-4 print:gap-3">
              <div>Assignment Start Date: <span className="border-b border-gray-400 inline-block min-w-[100px]">&nbsp;</span></div>
              <div>Expected OJT Hours: <span className="border-b border-gray-400 inline-block min-w-[80px]">&nbsp;</span></div>
            </div>
          </div>
        </div>

        {/* Shop Compliance Checklist */}
        <div className="border-2 rounded-lg p-5 mb-6 print:p-4 print:mb-5 print:border-gray-400">
          <h2 className="font-bold text-base mb-4 print:text-[12px] print:mb-3">Training Site Compliance Checklist</h2>
          <p className="text-sm text-gray-600 mb-3 print:text-[10px] print:mb-2">
            The following must be verified before apprentice placement at this training site:
          </p>
          <div className="space-y-2 text-sm print:text-[10px]">
            {[
              'Active Indiana barbershop license displayed at shop',
              'Licensed barber supervisor present during all apprentice training hours',
              'Sanitation station properly set up with EPA-registered disinfectant',
              'Tool disinfection procedures in place and followed',
              'Proper sharps disposal container available',
              'Chemical products stored safely and labeled',
              'Clean, safe, and well-maintained training environment',
              'First aid kit accessible',
              'Fire extinguisher accessible and current',
              'Shop insurance covers apprentice training activities',
            ].map((item, i) => (
              <div key={i} className="flex gap-3">
                <span>☐</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Confirmation Statement */}
        <div className="border-2 border-gray-900 rounded-lg p-5 mb-6 print:p-4 print:mb-5">
          <h2 className="font-bold text-base mb-3 print:text-[12px] print:mb-2">Supervisor Confirmation</h2>
          <p className="text-sm text-gray-700 leading-relaxed print:text-[10px]">
            I confirm that I am a licensed barber in the State of Indiana and will directly supervise
            the above-named apprentice&apos;s on-the-job training at the above-named licensed barbershop.
            I agree to:
          </p>
          <ul className="list-disc pl-6 text-sm text-gray-700 mt-2 space-y-1 print:text-[10px]">
            <li>Provide structured hands-on training aligned with the apprenticeship competency rubric</li>
            <li>Complete monthly OJT evaluation forms using standardized assessment criteria</li>
            <li>Verify and sign OJT hours logs accurately</li>
            <li>Maintain a safe, sanitary, and compliant training environment</li>
            <li>Cooperate with Program Holder and Sponsor for progress reviews and evaluations</li>
            <li>Notify Elevate immediately if shop license or supervisor license status changes</li>
          </ul>
        </div>

        {/* Signatures */}
        <div className="border-t-2 border-gray-900 pt-6 print:pt-4">
          <h2 className="font-bold text-base mb-4 print:text-[12px] print:mb-3">Signatures</h2>
          <div className="space-y-6 print:space-y-4">
            <div className="border-2 rounded-lg p-4 print:p-3 print:border-gray-400">
              <p className="font-bold text-sm mb-3 print:text-[11px] print:mb-2">Supervising Barber</p>
              <div className="grid grid-cols-2 gap-3 text-sm print:text-[10px] print:gap-2">
                <div>Print Name: ________________________________</div>
                <div>Indiana Barber License #: ________________________________</div>
                <div className="col-span-2">Signature: ________________________________________________________________</div>
                <div>Date: ________________________________</div>
              </div>
            </div>

            <div className="border-2 rounded-lg p-4 print:p-3 print:border-gray-400">
              <p className="font-bold text-sm mb-3 print:text-[11px] print:mb-2">Shop Owner (if different from supervisor)</p>
              <div className="grid grid-cols-2 gap-3 text-sm print:text-[10px] print:gap-2">
                <div>Print Name: ________________________________</div>
                <div>Shop License #: ________________________________</div>
                <div className="col-span-2">Signature: ________________________________________________________________</div>
                <div>Date: ________________________________</div>
              </div>
            </div>

            <div className="border-2 rounded-lg p-4 print:p-3 print:border-gray-400">
              <p className="font-bold text-sm mb-3 print:text-[11px] print:mb-2">Elevate for Humanity (Sponsor Verification)</p>
              <div className="grid grid-cols-2 gap-3 text-sm print:text-[10px] print:gap-2">
                <div>Verified By: ________________________________</div>
                <div>Title: ________________________________</div>
                <div>Site Visit Completed: ☐ Yes &nbsp; Date: __________</div>
                <div>Approved for Apprentice Placement: ☐ Yes</div>
                <div className="col-span-2">Signature: ________________________________________________________________</div>
                <div>Date: ________________________________</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t pt-4 mt-8 text-center text-xs text-gray-500 print:text-[9px] print:pt-3 print:mt-4">
          <p>This form must be completed before apprentice placement and maintained in the compliance file.</p>
          <p>Elevate for Humanity | RAPIDS ID: 2025-IN-132301 | Indianapolis, Indiana</p>
        </div>
      </div>

      {/* Screen nav */}
      <div className="py-8 bg-slate-50 print:hidden">
        <div className="max-w-3xl mx-auto px-4 flex flex-wrap gap-3">
          <Link href="/compliance/competency-verification/barber" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700 transition">
            Barber Rubric Overview
          </Link>
          <Link href="/compliance/competency-verification/barber/apprenticeship-agreement" className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
            Apprenticeship Agreement
          </Link>
          <Link href="/compliance/competency-verification/barber/ojt-hours-log" className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
            OJT Hours Log
          </Link>
        </div>
      </div>
    </div>
  );
}
