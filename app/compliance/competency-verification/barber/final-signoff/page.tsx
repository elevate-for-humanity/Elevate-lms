
import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PrintButton } from '../PrintButton';
import { BARBER_SECTIONS, BARBER_STATS } from '../barber-rubric-data';

export const metadata: Metadata = {
  title: 'Final Competency Sign-Off — Barber Apprenticeship | Elevate for Humanity',
  description: 'Tri-party final competency sign-off form for barber apprenticeship completion. RTI Instructor, Employer Supervisor, Program Holder, and Sponsor verification.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/compliance/competency-verification/barber/final-signoff' },
};

export default function FinalSignoffPage() {

  return (
    <div className="bg-white min-h-screen print:bg-white print:text-[11px]">
      {/* Screen nav */}
      <div className="bg-slate-50 border-b print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Compliance', href: '/compliance' },
            { label: 'Competency Verification', href: '/compliance/competency-verification' },
            { label: 'Barber', href: '/compliance/competency-verification/barber' },
            { label: 'Final Sign-Off' },
          ]} />
        </div>
      </div>

      {/* Print header */}
      <div className="hidden print:block px-6 pt-6 pb-3 border-b-2 border-gray-900">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-lg font-bold">Final Competency Sign-Off — Barber Apprenticeship</h1>
            <p className="text-[10px] text-gray-600">Elevate for Humanity | RAPIDS ID: 2025-IN-132301 | Occupation: Barber (330.371-010)</p>
          </div>
          <div className="text-right text-[10px] text-gray-500">
            <p>Tri-Party Verification</p>
            <p>Total: 2,000 hours | {BARBER_STATS.totalCompetencies} competencies</p>
          </div>
        </div>
      </div>

      {/* Screen header */}
      <div className="print:hidden py-8 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Final Competency Sign-Off</h1>
          <p className="text-gray-600 mb-4">
            Tri-party final verification form. All four parties must sign before apprenticeship completion is documented.
          </p>
          <PrintButton />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-8 print:px-6 print:pb-4">
        {/* Apprentice Information */}
        <div className="border-2 rounded-lg p-4 mb-6 print:p-3 print:mb-4 print:border-gray-400">
          <h2 className="font-bold text-sm mb-3 print:text-[11px] print:mb-2">Apprentice Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm print:text-[10px] print:gap-2">
            <div>Apprentice Name: ________________________________</div>
            <div>Date of Birth: ________________________________</div>
            <div>Apprenticeship Start Date: ________________________________</div>
            <div>Completion Date: ________________________________</div>
            <div>RAPIDS Registration: 2025-IN-132301</div>
            <div>Occupation: Barber (330.371-010)</div>
          </div>
        </div>

        {/* Training Site Information */}
        <div className="border-2 rounded-lg p-4 mb-6 print:p-3 print:mb-4 print:border-gray-400">
          <h2 className="font-bold text-sm mb-3 print:text-[11px] print:mb-2">Training Site Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm print:text-[10px] print:gap-2">
            <div>Barbershop Name: ________________________________</div>
            <div>Shop License #: ________________________________</div>
            <div>Shop Address: ________________________________</div>
            <div>Supervisor Name: ________________________________</div>
            <div>Supervisor License #: ________________________________</div>
            <div>Supervisor Phone: ________________________________</div>
          </div>
        </div>

        {/* Hour Completion Verification */}
        <div className="border-2 rounded-lg p-4 mb-6 print:p-3 print:mb-4 print:border-gray-400 print:break-inside-avoid">
          <h2 className="font-bold text-sm mb-3 print:text-[11px] print:mb-2">Hour Completion Verification</h2>
          <table className="w-full border-collapse text-sm print:text-[10px]">
            <thead>
              <tr className="bg-gray-100 print:bg-gray-50">
                <th className="text-left p-2 border font-semibold print:p-1">Category</th>
                <th className="text-center p-2 border font-semibold w-24 print:p-1">Required</th>
                <th className="text-center p-2 border font-semibold w-24 print:p-1">Completed</th>
                <th className="text-center p-2 border font-semibold w-20 print:p-1">Verified</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border print:p-1">Related Technical Instruction (RTI)</td>
                <td className="p-2 border text-center print:p-1">144 hours</td>
                <td className="p-2 border text-center print:p-1">&nbsp;</td>
                <td className="p-2 border text-center print:p-1">☐</td>
              </tr>
              <tr>
                <td className="p-2 border print:p-1">On-the-Job Training (OJT)</td>
                <td className="p-2 border text-center print:p-1">2,000 hours</td>
                <td className="p-2 border text-center print:p-1">&nbsp;</td>
                <td className="p-2 border text-center print:p-1">☐</td>
              </tr>
              <tr>
                <td className="p-2 border print:p-1">Supplemental Hours (LMS, mentoring)</td>
                <td className="p-2 border text-center print:p-1">356 hours</td>
                <td className="p-2 border text-center print:p-1">&nbsp;</td>
                <td className="p-2 border text-center print:p-1">☐</td>
              </tr>
              <tr className="font-semibold bg-gray-50">
                <td className="p-2 border print:p-1">Total Program Hours</td>
                <td className="p-2 border text-center print:p-1">2,000 hours</td>
                <td className="p-2 border text-center print:p-1">&nbsp;</td>
                <td className="p-2 border text-center print:p-1">☐</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section Competency Summary */}
        <div className="border-2 rounded-lg p-4 mb-6 print:p-3 print:mb-4 print:border-gray-400 print:break-inside-avoid">
          <h2 className="font-bold text-sm mb-3 print:text-[11px] print:mb-2">Competency Section Verification</h2>
          <table className="w-full border-collapse text-sm print:text-[10px]">
            <thead>
              <tr className="bg-gray-100 print:bg-gray-50">
                <th className="text-left p-2 border font-semibold print:p-1">Section</th>
                <th className="text-center p-2 border font-semibold w-20 print:p-1">Items</th>
                <th className="text-center p-2 border font-semibold w-20 print:p-1">All ≥ 3?</th>
                <th className="text-left p-2 border font-semibold w-32 print:p-1 print:w-24">Verified By</th>
              </tr>
            </thead>
            <tbody>
              {BARBER_SECTIONS.map((section) => (
                <tr key={section.section}>
                  <td className="p-2 border print:p-1">
                    <span className="font-medium">S{section.section}:</span> {section.title}
                  </td>
                  <td className="p-2 border text-center print:p-1">{section.items.length}</td>
                  <td className="p-2 border text-center print:p-1">☐ Yes &nbsp; ☐ No</td>
                  <td className="p-2 border print:p-1">&nbsp;</td>
                </tr>
              ))}
              <tr className="font-semibold bg-gray-50">
                <td className="p-2 border print:p-1">Total Competencies</td>
                <td className="p-2 border text-center print:p-1">{BARBER_STATS.totalCompetencies}</td>
                <td className="p-2 border text-center print:p-1">☐ Yes &nbsp; ☐ No</td>
                <td className="p-2 border print:p-1">&nbsp;</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* State Board Readiness */}
        <div className="border-2 rounded-lg p-4 mb-6 print:p-3 print:mb-4 print:border-gray-400 print:break-inside-avoid">
          <h2 className="font-bold text-sm mb-3 print:text-[11px] print:mb-2">Indiana State Board Exam Readiness</h2>
          <div className="space-y-2 text-sm print:text-[10px]">
            <div className="flex gap-4">
              <span>☐</span>
              <span>All required RTI hours completed and documented</span>
            </div>
            <div className="flex gap-4">
              <span>☐</span>
              <span>All required OJT hours completed and verified by licensed supervisor</span>
            </div>
            <div className="flex gap-4">
              <span>☐</span>
              <span>All competency rubric sections scored ≥ 3 (Competent)</span>
            </div>
            <div className="flex gap-4">
              <span>☐</span>
              <span>State board exam preparation module completed in LMS</span>
            </div>
            <div className="flex gap-4">
              <span>☐</span>
              <span>Practice written exam score ≥ 75%</span>
            </div>
            <div className="flex gap-4">
              <span>☐</span>
              <span>Practice practical exam completed successfully</span>
            </div>
            <div className="flex gap-4">
              <span>☐</span>
              <span>Apprentice recommended for Indiana PLA barber exam</span>
            </div>
          </div>
        </div>

        {/* Completion Determination */}
        <div className="border-2 border-gray-900 rounded-lg p-4 mb-6 print:p-3 print:mb-4">
          <h2 className="font-bold text-lg mb-3 print:text-sm print:mb-2">Completion Determination</h2>
          <div className="grid grid-cols-3 gap-3 text-sm print:text-[10px] mb-4">
            <div className="border-2 rounded p-3 text-center print:p-2">
              <p className="font-bold text-brand-green-700">☐ APPRENTICESHIP COMPLETE</p>
              <p className="text-xs text-gray-500 mt-1">All hours, competencies, and evaluations verified</p>
            </div>
            <div className="border-2 rounded p-3 text-center print:p-2">
              <p className="font-bold text-brand-orange-600">☐ REMEDIATION REQUIRED</p>
              <p className="text-xs text-gray-500 mt-1">Specific competencies below standard</p>
            </div>
            <div className="border-2 rounded p-3 text-center print:p-2">
              <p className="font-bold text-brand-red-600">☐ NOT COMPLETE</p>
              <p className="text-xs text-gray-500 mt-1">Hours or competencies not met</p>
            </div>
          </div>
          <div className="text-sm print:text-[10px]">
            <p className="font-semibold mb-1">Comments / Conditions:</p>
            <div className="border rounded p-2 min-h-[4rem] print:min-h-[2.5rem]">&nbsp;</div>
          </div>
        </div>

        {/* Tri-Party + Sponsor Signatures */}
        <div className="border-t-2 border-gray-900 pt-6 print:pt-4">
          <h2 className="font-bold text-lg mb-2 print:text-sm print:mb-1">Tri-Party Verification & Sponsor Sign-Off</h2>
          <p className="text-xs text-gray-500 mb-4 print:mb-3">
            All four parties must sign to complete the apprenticeship record. This form is filed with RAPIDS documentation.
          </p>

          <div className="space-y-5 print:space-y-3">
            {/* Party 1: RTI Instructor */}
            <div className="border-2 rounded-lg p-4 print:p-3 print:border-gray-400">
              <h3 className="font-bold text-sm mb-1 print:text-[11px]">1. Credential Partner — RTI Instructor (Licensed Barber)</h3>
              <p className="text-xs text-gray-500 mb-3 print:text-[9px] print:mb-2">
                I verify that the apprentice has completed all Related Technical Instruction requirements, demonstrated competency in all RTI-assessed areas (Sections 1–3, 5), and is prepared for the Indiana state board examination.
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs print:text-[9px] print:gap-2">
                <div>Instructor Name: ________________________________</div>
                <div>Indiana Barber License #: ________________________________</div>
                <div>Training Provider: ________________________________</div>
                <div>Date: ________________________________</div>
              </div>
              <div className="mt-3 text-xs print:text-[9px]">
                Signature: ________________________________________________________________
              </div>
            </div>

            {/* Party 2: Employer */}
            <div className="border-2 rounded-lg p-4 print:p-3 print:border-gray-400">
              <h3 className="font-bold text-sm mb-1 print:text-[11px]">2. Employer — Barbershop Supervisor (Licensed Barber)</h3>
              <p className="text-xs text-gray-500 mb-3 print:text-[9px] print:mb-2">
                I verify that the apprentice has completed all required On-the-Job Training hours under my direct supervision at a licensed barbershop, demonstrated competency in all OJT-assessed areas (Sections 4–6), and is ready for independent practice.
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs print:text-[9px] print:gap-2">
                <div>Supervisor Name: ________________________________</div>
                <div>Indiana Barber License #: ________________________________</div>
                <div>Shop Name: ________________________________</div>
                <div>Shop License #: ________________________________</div>
                <div>Total OJT Hours Supervised: ________________________________</div>
                <div>Date: ________________________________</div>
              </div>
              <div className="mt-3 text-xs print:text-[9px]">
                Signature: ________________________________________________________________
              </div>
            </div>

            {/* Party 3: Program Holder */}
            <div className="border-2 rounded-lg p-4 print:p-3 print:border-gray-400">
              <h3 className="font-bold text-sm mb-1 print:text-[11px]">3. Program Holder — RTI Coordinator</h3>
              <p className="text-xs text-gray-500 mb-3 print:text-[9px] print:mb-2">
                I verify that all competency rubric sections have been completed and scored, all evaluation checkpoints (30-day, midpoint, final) have been conducted, and all documentation is recorded in the institutional LMS.
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs print:text-[9px] print:gap-2">
                <div>Program Holder Name: ________________________________</div>
                <div>Title: ________________________________</div>
                <div>LMS Record Verified: ☐ Yes</div>
                <div>Date: ________________________________</div>
              </div>
              <div className="mt-3 text-xs print:text-[9px]">
                Signature: ________________________________________________________________
              </div>
            </div>

            {/* Party 4: Sponsor */}
            <div className="border-2 border-gray-900 rounded-lg p-4 print:p-3">
              <h3 className="font-bold text-sm mb-1 print:text-[11px]">4. Elevate for Humanity — Apprenticeship Sponsor</h3>
              <p className="text-xs text-gray-500 mb-3 print:text-[9px] print:mb-2">
                As the registered apprenticeship sponsor (RAPIDS ID: 2025-IN-132301), I verify that all program requirements have been met, all tri-party verifications are complete, and the apprentice is approved for completion documentation and credential pursuit.
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs print:text-[9px] print:gap-2">
                <div>Authorized Representative: ________________________________</div>
                <div>Title: ________________________________</div>
                <div>Completion Certificate Issued: ☐ Yes &nbsp; Date: __________</div>
                <div>RAPIDS Completion Filed: ☐ Yes &nbsp; Date: __________</div>
              </div>
              <div className="mt-3 text-xs print:text-[9px]">
                Signature: ________________________________________________________________
              </div>
            </div>
          </div>
        </div>

        {/* Credential Issuance */}
        <div className="border-2 rounded-lg p-4 mt-6 print:p-3 print:mt-4 print:border-gray-400 print:break-inside-avoid">
          <h2 className="font-bold text-sm mb-3 print:text-[11px] print:mb-2">Credential Issuance Record</h2>
          <div className="space-y-2 text-sm print:text-[10px]">
            <div className="grid grid-cols-2 gap-3">
              <div>Indiana State Board Exam Date: ________________________________</div>
              <div>Exam Result: ☐ Pass &nbsp; ☐ Fail &nbsp; ☐ Pending</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>Indiana Barber License #: ________________________________</div>
              <div>License Issue Date: ________________________________</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>Elevate Completion Certificate #: ________________________________</div>
              <div>DOL Apprenticeship Certificate: ☐ Filed &nbsp; ☐ Pending</div>
            </div>
          </div>
        </div>
      </div>

      {/* Screen nav */}
      <div className="py-8 bg-slate-50 print:hidden">
        <div className="max-w-4xl mx-auto px-4 flex flex-wrap gap-3">
          <Link href="/compliance/competency-verification/barber" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700 transition">
            Barber Rubric Overview
          </Link>
          <Link href="/compliance/competency-verification/barber/scoring-sheet" className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
            Scoring Sheet
          </Link>
          <Link href="/compliance/competency-verification/barber/monthly-ojt-evaluation" className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
            Monthly OJT Evaluation
          </Link>
        </div>
      </div>
    </div>
  );
}
