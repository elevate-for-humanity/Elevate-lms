import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PrintButton } from '../PrintButton';

export const metadata: Metadata = {
  title: 'Monthly OJT Evaluation — Barber Apprenticeship | Elevate for Humanity',
  description: 'Standardized monthly on-the-job training evaluation form for barbershop supervisors. Structured checklist for technical skills, sanitation, client service, professionalism, and attendance.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/compliance/competency-verification/barber/monthly-ojt-evaluation' },
};

const EVAL_CATEGORIES = [
  {
    category: 'Technical Skill Development',
    items: [
      'Clipper technique accuracy and consistency',
      'Fade quality (low, mid, high)',
      'Shear cutting and blending proficiency',
      'Razor handling safety and precision',
      'Beard shaping and line-up accuracy',
      'Hair texture adaptation (straight, wavy, curly, coily)',
    ],
  },
  {
    category: 'Sanitation & Safety Compliance',
    items: [
      'Tool disinfection between every client',
      'Workstation cleaned before and after each service',
      'Proper PPE usage (gloves for chemical/razor services)',
      'Sharps disposal in designated container',
      'Chemical storage and handling compliance',
      'Blood spill protocol knowledge demonstrated',
    ],
  },
  {
    category: 'Client Service Quality',
    items: [
      'Professional client consultation conducted',
      'Client expectations confirmed before starting',
      'Service completed to client satisfaction',
      'Appropriate product recommendations offered',
      'Professional handling of client concerns',
      'Repeat client bookings observed',
    ],
  },
  {
    category: 'Professional Conduct',
    items: [
      'Professional appearance and dress code',
      'Respectful interaction with coworkers and clients',
      'Appropriate phone/device usage during work',
      'Positive attitude and willingness to learn',
      'Adherence to shop policies and procedures',
      'Initiative in shop maintenance tasks',
    ],
  },
  {
    category: 'Attendance & Reliability',
    items: [
      'On-time arrival for all scheduled shifts',
      'Advance notice provided for any absences',
      'Weekly hour commitment consistently met',
      'No unexcused absences this evaluation period',
    ],
  },
];

export default function MonthlyOJTEvaluationPage() {
  return (
    <div className="bg-white min-h-screen print:bg-white print:text-[11px]">
      {/* Screen nav */}
      <div className="bg-slate-50 border-b print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Compliance', href: '/compliance' },
            { label: 'Competency Verification', href: '/compliance/competency-verification' },
            { label: 'Barber', href: '/compliance/competency-verification/barber' },
            { label: 'Monthly OJT Evaluation' },
          ]} />
        </div>
      </div>

      {/* Print header */}
      <div className="hidden print:block px-6 pt-6 pb-3 border-b-2 border-gray-900">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-lg font-bold">Monthly OJT Evaluation — Barber Apprenticeship</h1>
            <p className="text-[10px] text-gray-600">Elevate for Humanity | RAPIDS ID: 2025-IN-132301</p>
          </div>
          <div className="text-right text-[10px] text-gray-500">
            <p>Completed by: Licensed Barbershop Supervisor</p>
            <p>Frequency: Monthly</p>
          </div>
        </div>
      </div>

      {/* Screen header */}
      <div className="print:hidden py-8 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Monthly OJT Evaluation</h1>
          <p className="text-gray-600 mb-4">
            Standardized monthly evaluation form for barbershop supervisors. Print and complete for each apprentice every month.
          </p>
          <PrintButton />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-8 print:px-6 print:pb-4">
        {/* Apprentice & Shop Info */}
        <div className="border-2 rounded-lg p-4 mb-6 print:p-3 print:mb-4 print:border-gray-400">
          <h2 className="font-bold text-sm mb-3 print:text-[11px] print:mb-2">Apprentice & Shop Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm print:text-[10px] print:gap-2">
            <div>Apprentice Name: ________________________________</div>
            <div>Evaluation Month: ________________________________</div>
            <div>Shop Name: ________________________________</div>
            <div>Shop License #: ________________________________</div>
            <div>Supervisor Name: ________________________________</div>
            <div>Supervisor License #: ________________________________</div>
            <div>OJT Hours This Month: ________________________________</div>
            <div>Cumulative OJT Hours: ________________________________</div>
          </div>
        </div>

        {/* Scoring legend */}
        <div className="border rounded-lg p-3 mb-6 print:p-2 print:mb-4 print:border-gray-400">
          <p className="font-bold text-sm mb-2 print:text-[10px] print:mb-1">Rating Scale</p>
          <div className="grid grid-cols-4 gap-1 text-xs print:text-[9px] text-center">
            <div className="border rounded py-1 bg-gray-50 print:bg-white"><strong>1</strong> — Needs Improvement</div>
            <div className="border rounded py-1 bg-gray-50 print:bg-white"><strong>2</strong> — Developing</div>
            <div className="border rounded py-1 bg-gray-50 print:bg-white"><strong>3</strong> — Meets Standard</div>
            <div className="border rounded py-1 bg-gray-50 print:bg-white"><strong>4</strong> — Exceeds Standard</div>
          </div>
        </div>

        {/* Evaluation categories */}
        {EVAL_CATEGORIES.map((cat, ci) => (
          <div key={ci} className="mb-6 print:mb-4 print:break-inside-avoid">
            <div className="bg-gray-900 text-white px-4 py-2 rounded-t print:rounded-none">
              <h2 className="font-bold text-sm print:text-[11px]">{cat.category}</h2>
            </div>
            <table className="w-full border-collapse text-sm print:text-[10px]">
              <thead>
                <tr className="bg-gray-100 print:bg-gray-50">
                  <th className="text-left p-2 border font-semibold print:p-1">Evaluation Item</th>
                  <th className="text-center p-2 border font-semibold w-20 print:p-1">Rating (1–4)</th>
                  <th className="text-left p-2 border font-semibold w-40 print:p-1 print:w-28">Comments</th>
                </tr>
              </thead>
              <tbody>
                {cat.items.map((item, ii) => (
                  <tr key={ii}>
                    <td className="p-2 border print:p-1">{item}</td>
                    <td className="p-2 border text-center print:p-1">&nbsp;</td>
                    <td className="p-2 border print:p-1">&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {/* Competency hours log */}
        <div className="border-2 rounded-lg p-4 mb-6 print:p-3 print:mb-4 print:border-gray-400 print:break-inside-avoid">
          <h2 className="font-bold text-sm mb-3 print:text-[11px] print:mb-2">OJT Hours by Competency Category</h2>
          <table className="w-full border-collapse text-sm print:text-[10px]">
            <thead>
              <tr className="bg-gray-100 print:bg-gray-50">
                <th className="text-left p-2 border font-semibold print:p-1">Category</th>
                <th className="text-center p-2 border font-semibold w-24 print:p-1">Hours This Month</th>
                <th className="text-center p-2 border font-semibold w-24 print:p-1">Cumulative Hours</th>
              </tr>
            </thead>
            <tbody>
              {['Haircut Techniques (clipper, shear, fade)', 'Razor & Shaving Services', 'Sanitation & Safety', 'Client Consultation & Service', 'Shop Operations & Maintenance', 'Other (specify)'].map((cat, i) => (
                <tr key={i}>
                  <td className="p-2 border print:p-1">{cat}</td>
                  <td className="p-2 border text-center print:p-1">&nbsp;</td>
                  <td className="p-2 border text-center print:p-1">&nbsp;</td>
                </tr>
              ))}
              <tr className="font-semibold bg-gray-50">
                <td className="p-2 border print:p-1">Total</td>
                <td className="p-2 border text-center print:p-1">&nbsp;</td>
                <td className="p-2 border text-center print:p-1">&nbsp;</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Overall assessment */}
        <div className="border-2 rounded-lg p-4 mb-6 print:p-3 print:mb-4 print:border-gray-400 print:break-inside-avoid">
          <h2 className="font-bold text-sm mb-3 print:text-[11px] print:mb-2">Overall Monthly Assessment</h2>
          <div className="grid grid-cols-3 gap-3 text-sm print:text-[10px] mb-4">
            <div className="border rounded p-3 text-center print:p-2">
              <p className="font-semibold">☐ On Track</p>
              <p className="text-xs text-gray-500">Progressing as expected</p>
            </div>
            <div className="border rounded p-3 text-center print:p-2">
              <p className="font-semibold">☐ Needs Attention</p>
              <p className="text-xs text-gray-500">Specific areas require focus</p>
            </div>
            <div className="border rounded p-3 text-center print:p-2">
              <p className="font-semibold">☐ At Risk</p>
              <p className="text-xs text-gray-500">Intervention required</p>
            </div>
          </div>
          <div className="space-y-3 text-sm print:text-[10px]">
            <div>
              <p className="font-semibold mb-1">Strengths observed this month:</p>
              <div className="border rounded p-2 min-h-[3rem] print:min-h-[2rem]">&nbsp;</div>
            </div>
            <div>
              <p className="font-semibold mb-1">Areas for improvement:</p>
              <div className="border rounded p-2 min-h-[3rem] print:min-h-[2rem]">&nbsp;</div>
            </div>
            <div>
              <p className="font-semibold mb-1">Goals for next month:</p>
              <div className="border rounded p-2 min-h-[3rem] print:min-h-[2rem]">&nbsp;</div>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="border-t-2 border-gray-900 pt-6 print:pt-4 print:break-inside-avoid">
          <h2 className="font-bold text-sm mb-4 print:text-[11px] print:mb-3">Signatures</h2>
          <div className="space-y-4 print:space-y-3">
            {[
              { role: 'Barbershop Supervisor (Licensed Barber)', fields: ['Name', 'License #', 'Signature', 'Date'] },
              { role: 'Apprentice', fields: ['Name', 'Signature', 'Date'] },
              { role: 'Program Holder (reviewed)', fields: ['Name', 'Signature', 'Date'] },
            ].map((signer, i) => (
              <div key={i} className="border rounded-lg p-3 print:p-2 print:border-gray-400">
                <p className="font-semibold text-sm mb-2 print:text-[10px] print:mb-1">{signer.role}</p>
                <div className="grid grid-cols-2 gap-3 text-xs print:text-[9px] print:gap-2">
                  {signer.fields.map((field, fi) => (
                    <div key={fi}>{field}: ________________________________</div>
                  ))}
                </div>
              </div>
            ))}
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
          <Link href="/compliance/competency-verification/barber/final-signoff" className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
            Final Sign-Off Form
          </Link>
        </div>
      </div>
    </div>
  );
}
