
import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BARBER_SECTIONS, BARBER_STATS } from '../barber-rubric-data';
import { PrintButton } from '../PrintButton';

export const metadata: Metadata = {
  title: 'Barber Apprenticeship Scoring Sheet | Elevate for Humanity',
  description: 'Printable master competency scoring rubric for barber apprenticeship. 30 competencies, 0–5 scale, evaluator signature lines.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/compliance/competency-verification/barber/scoring-sheet' },
};

export default function BarberScoringSheetPage() {

  return (
    <div className="bg-white min-h-screen print:bg-white print:text-[11px]">
      {/* Screen nav */}
      <div className="bg-slate-50 border-b print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Compliance', href: '/compliance' },
            { label: 'Competency Verification', href: '/compliance/competency-verification' },
            { label: 'Barber', href: '/compliance/competency-verification/barber' },
            { label: 'Scoring Sheet' },
          ]} />
        </div>
      </div>

      {/* Print-only header */}
      <div className="hidden print:block px-6 pt-6 pb-3 border-b-2 border-gray-900">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-lg font-bold">Barber Apprenticeship — Competency Scoring Sheet</h1>
            <p className="text-[10px] text-gray-600">Elevate for Humanity | RAPIDS ID: 2025-IN-132301 | Occupation: Barber (330.371-010)</p>
          </div>
          <div className="text-right text-[10px] text-gray-500">
            <p>Total: 2,000 hours (144 RTI + 1,500 OJT)</p>
            <p>{BARBER_STATS.totalCompetencies} competencies | {BARBER_STATS.sections} sections</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-4 text-[10px] border-t pt-2">
          <div>Apprentice Name: ________________________________</div>
          <div>RAPIDS ID: ________________________________</div>
          <div>Evaluation Date: ________________________________</div>
        </div>
      </div>

      {/* Screen header */}
      <div className="print:hidden py-8 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Barber Apprenticeship Scoring Sheet</h1>
          <p className="text-gray-600 mb-4">
            Printable master scoring rubric. Print this page or save as PDF to use during competency evaluations.
          </p>
          <PrintButton />
        </div>
      </div>

      {/* Scoring scale legend */}
      <div className="max-w-4xl mx-auto px-4 py-4 print:px-6 print:py-2">
        <div className="border rounded-lg p-3 print:p-2 print:border-gray-400">
          <p className="font-bold text-sm mb-2 print:text-[10px] print:mb-1">Scoring Scale</p>
          <div className="grid grid-cols-6 gap-1 text-xs print:text-[9px] text-center">
            <div className="border rounded py-1 bg-gray-50 print:bg-white"><strong>0</strong><br />Not Demonstrated</div>
            <div className="border rounded py-1 bg-gray-50 print:bg-white"><strong>1</strong><br />Needs Direct Supervision</div>
            <div className="border rounded py-1 bg-gray-50 print:bg-white"><strong>2</strong><br />Developing</div>
            <div className="border rounded py-1 bg-gray-50 print:bg-white"><strong>3</strong><br />Competent (Job-Ready)</div>
            <div className="border rounded py-1 bg-gray-50 print:bg-white"><strong>4</strong><br />Advanced</div>
            <div className="border rounded py-1 bg-gray-50 print:bg-white"><strong>5</strong><br />Independent Mastery</div>
          </div>
          <p className="text-xs text-gray-500 mt-2 print:text-[9px] print:mt-1">
            Minimum passing standard: Score of 3 (Competent) in all core competencies. Sanitation failures require automatic remediation.
          </p>
        </div>
      </div>

      {/* Rubric sections */}
      <div className="max-w-4xl mx-auto px-4 pb-8 print:px-6 print:pb-4">
        {BARBER_SECTIONS.map((section) => (
          <div key={section.section} className="mb-6 print:mb-4 print:break-inside-avoid">
            <div className="bg-gray-900 text-white px-4 py-2 rounded-t print:rounded-none">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-sm print:text-[11px]">
                  Section {section.section}: {section.title}
                </h2>
                <span className="text-xs text-gray-300 print:text-[9px]">{section.items.length} competencies</span>
              </div>
            </div>

            <table className="w-full border-collapse text-sm print:text-[10px]">
              <thead>
                <tr className="bg-gray-100 print:bg-gray-50">
                  <th className="text-left p-2 border font-semibold w-8 print:p-1">ID</th>
                  <th className="text-left p-2 border font-semibold print:p-1">Competency</th>
                  <th className="text-center p-2 border font-semibold w-12 print:p-1">RTI</th>
                  <th className="text-center p-2 border font-semibold w-12 print:p-1">OJT</th>
                  <th className="text-center p-2 border font-semibold w-16 print:p-1">Score (0–5)</th>
                  <th className="text-left p-2 border font-semibold w-32 print:p-1 print:w-24">Notes</th>
                </tr>
              </thead>
              <tbody>
                {section.items.map((item) => (
                  <tr key={item.id} className="print:break-inside-avoid">
                    <td className="p-2 border text-xs font-mono print:p-1 print:text-[9px]">{item.id}</td>
                    <td className="p-2 border print:p-1">{item.competency}</td>
                    <td className="p-2 border text-center print:p-1">{item.rtiHours > 0 ? `${item.rtiHours}h` : '—'}</td>
                    <td className="p-2 border text-center print:p-1">{item.ojtHours > 0 ? `${item.ojtHours}h` : '—'}</td>
                    <td className="p-2 border text-center print:p-1">
                      <span className="print:hidden text-gray-400">___</span>
                      <span className="hidden print:inline">&nbsp;</span>
                    </td>
                    <td className="p-2 border print:p-1">
                      <span className="print:hidden text-gray-400 text-xs">Notes</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {/* Signature block */}
        <div className="border-t-2 border-gray-900 pt-6 mt-8 print:pt-4 print:mt-4">
          <h2 className="font-bold text-lg mb-4 print:text-sm print:mb-3">Evaluator Sign-Off</h2>
          <div className="grid grid-cols-1 gap-6 print:gap-3">
            {[
              { role: 'RTI Instructor (Credential Partner)', scope: 'Sections 1–3, 5 — Technical & theoretical competencies' },
              { role: 'Employer Barbershop Supervisor', scope: 'Sections 4–6 — OJT performance & workplace readiness' },
              { role: 'Program Holder (RTI Coordinator)', scope: 'Rubric completion verification & LMS documentation' },
              { role: 'Elevate for Humanity (Sponsor)', scope: 'Final completion validation & apprenticeship documentation' },
            ].map((signer, i) => (
              <div key={i} className="border rounded-lg p-4 print:p-2 print:border-gray-400">
                <p className="font-semibold text-sm print:text-[10px]">{signer.role}</p>
                <p className="text-xs text-gray-500 mb-3 print:text-[9px] print:mb-2">{signer.scope}</p>
                <div className="grid grid-cols-3 gap-4 text-xs print:text-[9px]">
                  <div>Name: ________________________________</div>
                  <div>Signature: ________________________________</div>
                  <div>Date: ________________</div>
                </div>
                {i === 0 && (
                  <div className="mt-2 text-xs print:text-[9px]">
                    License #: ________________________________
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Overall result */}
        <div className="border-2 border-gray-900 rounded-lg p-4 mt-6 print:p-3 print:mt-4">
          <h3 className="font-bold text-sm mb-2 print:text-[11px]">Overall Competency Determination</h3>
          <div className="grid grid-cols-3 gap-4 text-sm print:text-[10px]">
            <div className="border rounded p-3 text-center print:p-2">
              <p className="font-semibold">☐ Competent</p>
              <p className="text-xs text-gray-500">All core competencies ≥ 3</p>
            </div>
            <div className="border rounded p-3 text-center print:p-2">
              <p className="font-semibold">☐ Remediation Required</p>
              <p className="text-xs text-gray-500">One or more competencies &lt; 3</p>
            </div>
            <div className="border rounded p-3 text-center print:p-2">
              <p className="font-semibold">☐ Not Yet Assessed</p>
              <p className="text-xs text-gray-500">Evaluation incomplete</p>
            </div>
          </div>
          <div className="mt-3 text-xs print:text-[9px]">
            Comments: ________________________________________________________________________________
          </div>
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
          <Link href="/compliance/competency-verification/barber/final-signoff" className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
            Final Sign-Off Form
          </Link>
        </div>
      </div>
    </div>
  );
}
