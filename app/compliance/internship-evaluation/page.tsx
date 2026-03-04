export const dynamic = 'force-static';
import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Internship Evaluation Form | Elevate for Humanity',
  description: 'Supervisor evaluation form for structured internship placements. Midpoint and final competency assessment.',
};

const competencies = [
  { area: 'Tax Return Preparation', items: ['Accurately prepares Form 1040 with common schedules', 'Identifies applicable deductions and credits', 'Uses tax software proficiently for e-filing', 'Follows quality review procedures'] },
  { area: 'Bookkeeping & Accounting', items: ['Records transactions accurately in QuickBooks', 'Performs bank reconciliation', 'Generates financial reports (P&L, Balance Sheet)', 'Processes accounts payable/receivable'] },
  { area: 'Client Communication', items: ['Conducts professional client intake', 'Explains tax concepts clearly to clients', 'Maintains confidentiality per IRS Pub 4557', 'Follows up on outstanding items'] },
  { area: 'Workplace Professionalism', items: ['Arrives on time and meets attendance requirements', 'Follows office procedures and dress code', 'Works independently with appropriate supervision', 'Accepts feedback and applies corrections'] },
];

export default function InternshipEvaluationPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 py-3">
          <Breadcrumbs items={[
            { label: 'Compliance', href: '/compliance' },
            { label: 'Internship Evaluation' },
          ]} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <p className="text-brand-red-600 font-bold text-xs uppercase tracking-wider mb-2">Compliance Document</p>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Internship Evaluation Form</h1>
        <p className="text-slate-500 mb-4">Supervisor Assessment — Finance, Bookkeeping &amp; Accounting Credential Pathway</p>
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4 mb-8 text-sm text-brand-blue-800">
          <p className="font-semibold mb-1">WorkOne Reporting</p>
          <p>Completed evaluations are shared with the assigned WorkOne career advisor or case manager for WIOA performance reporting. Midpoint evaluations inform continuation decisions. Final evaluations support credential attainment and employment outcome documentation required by the local workforce development board.</p>
        </div>

        <div className="prose prose-slate max-w-none">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-bold text-slate-900 mt-0">Evaluation Details</h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-600">Participant: ___________________________</p>
                <p className="text-slate-600">Evaluation Type: ☐ Midpoint &nbsp; ☐ Final</p>
                <p className="text-slate-600">Date: ___________________________</p>
              </div>
              <div>
                <p className="text-slate-600">Evaluator: ___________________________</p>
                <p className="text-slate-600">Title: ___________________________</p>
                <p className="text-slate-600">Hours Completed to Date: ____</p>
              </div>
            </div>
          </div>

          <h2 className="text-lg font-bold text-slate-900">Competency Assessment</h2>
          <p className="text-sm text-slate-600 mb-4">Rate each item: <strong>1</strong> = Not yet competent &nbsp; <strong>2</strong> = Developing &nbsp; <strong>3</strong> = Competent &nbsp; <strong>4</strong> = Exceeds expectations &nbsp; <strong>N/A</strong> = Not applicable this period</p>

          <div className="space-y-6">
            {competencies.map((comp) => (
              <div key={comp.area} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                  <h3 className="font-bold text-slate-900 text-sm">{comp.area}</h3>
                </div>
                <div className="p-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-2 text-slate-600 font-medium">Competency</th>
                        <th className="text-center py-2 text-slate-600 font-medium w-10">1</th>
                        <th className="text-center py-2 text-slate-600 font-medium w-10">2</th>
                        <th className="text-center py-2 text-slate-600 font-medium w-10">3</th>
                        <th className="text-center py-2 text-slate-600 font-medium w-10">4</th>
                        <th className="text-center py-2 text-slate-600 font-medium w-10">N/A</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-700">
                      {comp.items.map((item) => (
                        <tr key={item} className="border-b border-slate-50">
                          <td className="py-2">{item}</td>
                          <td className="text-center">☐</td>
                          <td className="text-center">☐</td>
                          <td className="text-center">☐</td>
                          <td className="text-center">☐</td>
                          <td className="text-center">☐</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-lg font-bold text-slate-900 mt-8">Overall Assessment</h2>
          <div className="bg-white border border-slate-200 rounded-lg p-5 text-sm text-slate-700 space-y-3">
            <p>☐ <strong>On Track</strong> — Participant is meeting or exceeding expectations for this stage</p>
            <p>☐ <strong>Needs Improvement</strong> — Specific areas require additional support (detail below)</p>
            <p>☐ <strong>Not Meeting Requirements</strong> — Performance plan or reassignment recommended</p>
            <p>☐ <strong>Ready for Employment Transition</strong> — (Final evaluation only) Participant demonstrates readiness for independent work</p>
          </div>

          <h2 className="text-lg font-bold text-slate-900 mt-8">Supervisor Comments</h2>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
            <p className="text-sm text-slate-500 mb-2">Strengths observed:</p>
            <div className="h-16 border-b border-slate-300 mb-4" />
            <p className="text-sm text-slate-500 mb-2">Areas for improvement:</p>
            <div className="h-16 border-b border-slate-300 mb-4" />
            <p className="text-sm text-slate-500 mb-2">Recommended next steps:</p>
            <div className="h-16 border-b border-slate-300" />
          </div>

          <h2 className="text-lg font-bold text-slate-900 mt-8">Employment Recommendation (Final Evaluation Only)</h2>
          <div className="bg-white border border-slate-200 rounded-lg p-5 text-sm text-slate-700 space-y-2">
            <p>☐ Recommend for permanent hire at this organization</p>
            <p>☐ Recommend for placement at partner organization</p>
            <p>☐ Recommend for continued mentorship / self-employment track</p>
            <p>☐ Recommend additional training before placement</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mt-8">
            <h2 className="text-lg font-bold text-slate-900 mt-0">Signatures</h2>
            <div className="grid sm:grid-cols-2 gap-6 text-sm text-slate-600">
              <div>
                <p className="mb-4">Site Supervisor: ___________________________</p>
                <p className="mb-4">Date: ___________________________</p>
              </div>
              <div>
                <p className="mb-4">Participant: ___________________________</p>
                <p className="mb-4">Date: ___________________________</p>
              </div>
              <div>
                <p className="mb-4">Elevate Program Coordinator: ___________________________</p>
                <p className="mb-4">Date: ___________________________</p>
              </div>
              <div>
                <p className="mb-4">WorkOne Career Advisor (if applicable): ___________________________</p>
                <p className="mb-4">Date: ___________________________</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <Link href="/programs/finance-bookkeeping-accounting" className="text-brand-red-600 font-semibold text-sm hover:underline">
            ← Back to Finance Pathway
          </Link>
        </div>
      </div>
    </div>
  );
}
