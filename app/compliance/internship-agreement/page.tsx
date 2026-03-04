export const dynamic = 'force-static';
import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Internship Agreement Template | Elevate for Humanity',
  description: 'Structured internship agreement for work-based learning placements under the Finance, Bookkeeping & Accounting Credential Pathway.',
};

export default function InternshipAgreementPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 py-3">
          <Breadcrumbs items={[
            { label: 'Compliance', href: '/compliance' },
            { label: 'Internship Agreement' },
          ]} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <p className="text-brand-red-600 font-bold text-xs uppercase tracking-wider mb-2">Compliance Document</p>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Structured Internship Agreement</h1>
        <p className="text-slate-500 mb-4">Work-Based Learning Placement — Finance, Bookkeeping &amp; Accounting Credential Pathway</p>
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4 mb-8 text-sm text-brand-blue-800">
          <p className="font-semibold mb-1">WorkOne Coordination</p>
          <p>For WIOA-funded participants, this agreement is submitted alongside the WorkOne OJT contract or work experience authorization. The assigned WorkOne career advisor or case manager must approve the placement before the internship begins. Wage structure and reimbursement terms are governed by local workforce development board policy (Region 5 / Indianapolis).</p>
        </div>

        <div className="prose prose-slate max-w-none">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-bold text-slate-900 mt-0">Agreement Parties</h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold text-slate-700 mb-1">Sponsor Organization</p>
                <p className="text-slate-600">Elevate for Humanity Career &amp; Technical Institute<br />A program of 2Exclusive LLC-S<br />Indianapolis, IN (Marion County)</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700 mb-1">Participant</p>
                <p className="text-slate-600">Name: ___________________________<br />Program: Finance, Bookkeeping &amp; Accounting<br />Tier Completed: ☐ Tier 1 &nbsp; ☐ Tier 2 &nbsp; ☐ Tier 3</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700 mb-1">Host Employer / Training Site</p>
                <p className="text-slate-600">Organization: ___________________________<br />Supervisor: ___________________________<br />Address: ___________________________</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700 mb-1">Internship Period</p>
                <p className="text-slate-600">Start Date: ___________________________<br />End Date: ___________________________<br />Total Hours: ___________________________</p>
              </div>
            </div>
          </div>

          <h2 className="text-lg font-bold text-slate-900">1. Purpose</h2>
          <p className="text-sm text-slate-700">This agreement establishes a structured, supervised internship placement as part of the Finance, Bookkeeping &amp; Accounting Credential Pathway. The internship is designed to provide applied work experience that reinforces classroom instruction and credential attainment.</p>

          <h2 className="text-lg font-bold text-slate-900">2. Learning Objectives</h2>
          <p className="text-sm text-slate-700 mb-2">The participant will demonstrate competency in the following areas during the internship period:</p>
          <div className="bg-white border border-slate-200 rounded-lg p-4 text-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 text-slate-700 font-semibold">Objective</th>
                  <th className="text-center py-2 text-slate-700 font-semibold w-24">Target Date</th>
                  <th className="text-center py-2 text-slate-700 font-semibold w-24">Met?</th>
                </tr>
              </thead>
              <tbody className="text-slate-600">
                <tr className="border-b border-slate-100"><td className="py-2">Prepare individual tax returns (Form 1040) with accuracy</td><td className="text-center">____</td><td className="text-center">☐</td></tr>
                <tr className="border-b border-slate-100"><td className="py-2">Process client intake and maintain data security</td><td className="text-center">____</td><td className="text-center">☐</td></tr>
                <tr className="border-b border-slate-100"><td className="py-2">Use professional tax software for e-filing</td><td className="text-center">____</td><td className="text-center">☐</td></tr>
                <tr className="border-b border-slate-100"><td className="py-2">Perform bookkeeping entries in QuickBooks</td><td className="text-center">____</td><td className="text-center">☐</td></tr>
                <tr className="border-b border-slate-100"><td className="py-2">Reconcile bank accounts and generate reports</td><td className="text-center">____</td><td className="text-center">☐</td></tr>
                <tr><td className="py-2">Demonstrate professional client communication</td><td className="text-center">____</td><td className="text-center">☐</td></tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-lg font-bold text-slate-900">3. Compensation</h2>
          <div className="text-sm text-slate-700 space-y-1">
            <p>☐ <strong>Workforce-Funded Work Experience</strong> — Stipend/wage paid by workforce board: $____/hr</p>
            <p>☐ <strong>OJT Reimbursement Model</strong> — W-2 hire at $____/hr, workforce reimburses ____% for ____ weeks</p>
            <p>☐ <strong>Employer-Funded Placement</strong> — Employer pays $____/hr directly, no reimbursement</p>
          </div>

          <h2 className="text-lg font-bold text-slate-900">4. Schedule</h2>
          <p className="text-sm text-slate-700">Hours per week: ____ &nbsp; Days: ____ &nbsp; Total internship hours: ____</p>

          <h2 className="text-lg font-bold text-slate-900">5. Supervision &amp; Evaluation</h2>
          <ul className="text-sm text-slate-700">
            <li>Site supervisor will provide daily oversight and weekly check-ins</li>
            <li>Elevate program coordinator will conduct midpoint and final evaluations</li>
            <li>Participant will maintain a weekly activity log</li>
            <li>Formal evaluation at midpoint (week ____) and completion (week ____)</li>
          </ul>

          <h2 className="text-lg font-bold text-slate-900">6. Compliance</h2>
          <ul className="text-sm text-slate-700">
            <li>Internship activities are structured training, not solely productive labor</li>
            <li>Participant will not displace regular employees</li>
            <li>All applicable labor laws and minimum wage requirements apply</li>
            <li>Confidentiality of client financial data must be maintained per IRS Pub 4557</li>
            <li>For WIOA-funded placements: participant must be registered in Indiana Career Connect with active enrollment</li>
            <li>Weekly progress updates provided to assigned WorkOne career advisor or case manager</li>
            <li>Credential attainment reported to local workforce board within 5 business days</li>
          </ul>

          <h2 className="text-lg font-bold text-slate-900">7. Termination</h2>
          <p className="text-sm text-slate-700">Either party may terminate this agreement with 5 business days written notice. Grounds for immediate termination include violation of confidentiality, safety violations, or failure to meet attendance requirements.</p>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mt-8">
            <h2 className="text-lg font-bold text-slate-900 mt-0">Signatures</h2>
            <div className="grid sm:grid-cols-2 gap-6 text-sm text-slate-600">
              <div>
                <p className="mb-4">Participant: ___________________________</p>
                <p className="mb-4">Date: ___________________________</p>
              </div>
              <div>
                <p className="mb-4">Site Supervisor: ___________________________</p>
                <p className="mb-4">Date: ___________________________</p>
              </div>
              <div>
                <p className="mb-4">Elevate Program Coordinator: ___________________________</p>
                <p className="mb-4">Date: ___________________________</p>
              </div>
              <div>
                <p className="mb-4">Workforce Case Manager (if applicable): ___________________________</p>
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
