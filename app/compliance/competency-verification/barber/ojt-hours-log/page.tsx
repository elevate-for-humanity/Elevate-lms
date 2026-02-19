import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PrintButton } from '../PrintButton';

export const metadata: Metadata = {
  title: 'OJT Hours Log — Barber Apprenticeship | Elevate for Humanity',
  description: 'On-the-Job Training hours log sheet for barber apprenticeship. Tracks daily hours, skills practiced, and supervisor verification.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/compliance/competency-verification/barber/ojt-hours-log' },
};

const SKILL_CATEGORIES = [
  'Haircut Techniques (clipper, shear, fade)',
  'Razor & Shaving Services',
  'Sanitation & Safety',
  'Client Consultation & Service',
  'Shop Operations & Maintenance',
  'Other',
];

export default function OJTHoursLogPage() {
  // Generate 25 blank rows for the daily log
  const rows = Array.from({ length: 25 }, (_, i) => i);

  return (
    <div className="bg-white min-h-screen print:bg-white print:text-[10px]">
      {/* Screen nav */}
      <div className="bg-slate-50 border-b print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Compliance', href: '/compliance' },
            { label: 'Barber Rubric', href: '/compliance/competency-verification/barber' },
            { label: 'OJT Hours Log' },
          ]} />
        </div>
      </div>

      {/* Screen header */}
      <div className="print:hidden py-8 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">OJT Hours Log Sheet</h1>
          <p className="text-gray-600 mb-4">
            Daily OJT hours tracking. One sheet per month. Supervisor initials required for each entry.
          </p>
          <PrintButton />
        </div>
      </div>

      {/* Print header */}
      <div className="hidden print:block px-6 pt-6 pb-3 border-b-2 border-gray-900">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[8px] uppercase tracking-widest text-gray-500 mb-0.5">Elevate for Humanity</p>
            <h1 className="text-base font-bold">ON-THE-JOB TRAINING (OJT) HOURS LOG</h1>
            <p className="text-[9px] text-gray-600">Barbering Apprenticeship | RAPIDS ID: 2025-IN-132301</p>
          </div>
          <div className="text-right text-[9px] text-gray-500">
            <p>One sheet per month</p>
            <p>Supervisor initials required</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 print:px-6 print:py-4 print:max-w-none">
        {/* Apprentice & Shop Info */}
        <div className="border-2 rounded-lg p-4 mb-5 print:p-3 print:mb-4 print:border-gray-400">
          <div className="grid grid-cols-2 gap-3 text-sm print:text-[10px] print:gap-2">
            <div>Apprentice Name: ________________________________</div>
            <div>Month / Year: ________________________________</div>
            <div>Barbershop: ________________________________</div>
            <div>Shop License #: ________________________________</div>
            <div>Licensed Supervisor: ________________________________</div>
            <div>Supervisor License #: ________________________________</div>
          </div>
        </div>

        {/* Daily Hours Log Table */}
        <div className="mb-5 print:mb-4">
          <h2 className="font-bold text-sm mb-2 print:text-[10px] print:mb-1">Daily OJT Hours</h2>
          <table className="w-full border-collapse text-sm print:text-[9px]">
            <thead>
              <tr className="bg-gray-900 text-white print:bg-gray-100 print:text-gray-900">
                <th className="p-2 border font-semibold text-left w-24 print:p-1">Date</th>
                <th className="p-2 border font-semibold text-center w-16 print:p-1">Start</th>
                <th className="p-2 border font-semibold text-center w-16 print:p-1">End</th>
                <th className="p-2 border font-semibold text-center w-14 print:p-1">Hours</th>
                <th className="p-2 border font-semibold text-left print:p-1">Skills Practiced / Tasks Performed</th>
                <th className="p-2 border font-semibold text-center w-16 print:p-1">Supv. Initials</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50 print:bg-white'}>
                  <td className="p-1.5 border print:p-1">&nbsp;</td>
                  <td className="p-1.5 border text-center print:p-1">&nbsp;</td>
                  <td className="p-1.5 border text-center print:p-1">&nbsp;</td>
                  <td className="p-1.5 border text-center print:p-1">&nbsp;</td>
                  <td className="p-1.5 border print:p-1">&nbsp;</td>
                  <td className="p-1.5 border text-center print:p-1">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Monthly Summary by Category */}
        <div className="border-2 rounded-lg p-4 mb-5 print:p-3 print:mb-4 print:border-gray-400 print:break-inside-avoid">
          <h2 className="font-bold text-sm mb-2 print:text-[10px] print:mb-1">Monthly Hours by Competency Category</h2>
          <table className="w-full border-collapse text-sm print:text-[9px]">
            <thead>
              <tr className="bg-gray-100 print:bg-gray-50">
                <th className="p-2 border font-semibold text-left print:p-1">Competency Category</th>
                <th className="p-2 border font-semibold text-center w-28 print:p-1">Hours This Month</th>
                <th className="p-2 border font-semibold text-center w-28 print:p-1">Cumulative Total</th>
              </tr>
            </thead>
            <tbody>
              {SKILL_CATEGORIES.map((cat, i) => (
                <tr key={i}>
                  <td className="p-2 border print:p-1">{cat}</td>
                  <td className="p-2 border text-center print:p-1">&nbsp;</td>
                  <td className="p-2 border text-center print:p-1">&nbsp;</td>
                </tr>
              ))}
              <tr className="font-semibold bg-gray-50">
                <td className="p-2 border print:p-1">TOTAL</td>
                <td className="p-2 border text-center print:p-1">&nbsp;</td>
                <td className="p-2 border text-center print:p-1">&nbsp;</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Monthly Totals & Signatures */}
        <div className="border-t-2 border-gray-900 pt-5 print:pt-3 print:break-inside-avoid">
          <div className="grid grid-cols-3 gap-4 text-sm print:text-[10px] print:gap-3 mb-5 print:mb-3">
            <div className="border rounded-lg p-3 text-center print:p-2 print:border-gray-400">
              <p className="text-xs text-gray-500 print:text-[8px]">Total Hours This Month</p>
              <p className="text-2xl font-bold text-gray-900 mt-1 print:text-lg">&nbsp;</p>
            </div>
            <div className="border rounded-lg p-3 text-center print:p-2 print:border-gray-400">
              <p className="text-xs text-gray-500 print:text-[8px]">Cumulative OJT Hours</p>
              <p className="text-2xl font-bold text-gray-900 mt-1 print:text-lg">&nbsp;</p>
            </div>
            <div className="border rounded-lg p-3 text-center print:p-2 print:border-gray-400">
              <p className="text-xs text-gray-500 print:text-[8px]">Required OJT Hours</p>
              <p className="text-2xl font-bold text-gray-900 mt-1 print:text-lg">1,500</p>
            </div>
          </div>

          <div className="space-y-4 print:space-y-3">
            <div className="border-2 rounded-lg p-4 print:p-3 print:border-gray-400">
              <p className="font-bold text-sm mb-2 print:text-[10px] print:mb-1">Licensed Barbershop Supervisor</p>
              <p className="text-xs text-gray-600 mb-3 print:text-[9px] print:mb-2">
                I verify that the hours recorded above are accurate and that all training occurred under my direct supervision at a licensed barbershop.
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm print:text-[10px] print:gap-2">
                <div>Print Name: ________________________________</div>
                <div>Indiana Barber License #: ________________________________</div>
                <div className="col-span-2">Signature: ________________________________________________________________</div>
                <div>Date: ________________________________</div>
              </div>
            </div>

            <div className="border-2 rounded-lg p-4 print:p-3 print:border-gray-400">
              <p className="font-bold text-sm mb-2 print:text-[10px] print:mb-1">Apprentice Acknowledgment</p>
              <p className="text-xs text-gray-600 mb-3 print:text-[9px] print:mb-2">
                I confirm that the hours and activities recorded above are accurate.
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm print:text-[10px] print:gap-2">
                <div>Print Name: ________________________________</div>
                <div>Date: ________________________________</div>
                <div className="col-span-2">Signature: ________________________________________________________________</div>
              </div>
            </div>

            <div className="border-2 rounded-lg p-4 print:p-3 print:border-gray-400">
              <p className="font-bold text-sm mb-2 print:text-[10px] print:mb-1">Program Holder Review</p>
              <div className="grid grid-cols-2 gap-3 text-sm print:text-[10px] print:gap-2">
                <div>Reviewed By: ________________________________</div>
                <div>Date: ________________________________</div>
                <div>LMS Hours Reconciled: ☐ Yes</div>
                <div className="col-span-2">Signature: ________________________________________________________________</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t pt-3 mt-6 text-center text-xs text-gray-500 print:text-[8px] print:pt-2 print:mt-4">
          <p>Maintain original in apprentice compliance file. Copy to LMS records.</p>
          <p>Elevate for Humanity | RAPIDS ID: 2025-IN-132301</p>
        </div>
      </div>

      {/* Screen nav */}
      <div className="py-8 bg-slate-50 print:hidden">
        <div className="max-w-4xl mx-auto px-4 flex flex-wrap gap-3">
          <Link href="/compliance/competency-verification/barber" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700 transition">
            Barber Rubric Overview
          </Link>
          <Link href="/compliance/competency-verification/barber/monthly-ojt-evaluation" className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
            Monthly OJT Evaluation
          </Link>
          <Link href="/compliance/competency-verification/barber/supervisor-verification" className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
            Supervisor Verification
          </Link>
        </div>
      </div>
    </div>
  );
}
