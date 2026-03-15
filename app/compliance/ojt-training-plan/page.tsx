export const dynamic = 'force-static';
import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'OJT Training Plan Template | Elevate for Humanity',
  description: 'On-the-Job Training plan template for WIOA-funded work-based learning placements. Defines skills, timeline, and evaluation criteria.',
};

export default function OJTTrainingPlanPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 py-3">
          <Breadcrumbs items={[
            { label: 'Compliance', href: '/compliance' },
            { label: 'OJT Training Plan' },
          ]} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <p className="text-brand-red-600 font-bold text-xs uppercase tracking-wider mb-2">Compliance Document</p>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">On-the-Job Training Plan</h1>
        <p className="text-slate-500 mb-4">WIOA-Aligned Work-Based Learning — Finance, Bookkeeping &amp; Accounting Credential Pathway</p>
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4 mb-8 text-sm text-brand-blue-800">
          <p className="font-semibold mb-1">Workforce Board Coordination</p>
          <p>This OJT plan is designed for coordination with the local workforce development board through WorkOne Indianapolis (Region 5). OJT contracts, wage reimbursement rates, and participant eligibility are determined by the assigned WorkOne career advisor or case manager. Elevate submits this training plan as part of the OJT agreement package required by the local board.</p>
        </div>

        <div className="prose prose-slate max-w-none">
          <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-bold text-slate-900 mt-0">Training Plan Summary</h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold text-slate-700 mb-1">Participant</p>
                <p className="text-slate-600">Name: ___________________________<br />WIOA Case #: ___________________________<br />Credential Tier: ☐ 1 &nbsp; ☐ 2 &nbsp; ☐ 3</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700 mb-1">Employer</p>
                <p className="text-slate-600">Organization: ___________________________<br />FEIN: ___________________________<br />Supervisor: ___________________________</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700 mb-1">OJT Details</p>
                <p className="text-slate-600">Job Title: ___________________________<br />SOC Code: ___________________________<br />Wage: $____/hr</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700 mb-1">Reimbursement</p>
                <p className="text-slate-600">Rate: ____% of wages<br />Duration: ____ weeks<br />Max Reimbursement: $____</p>
              </div>
            </div>
          </div>

          <h2 className="text-lg font-bold text-slate-900">Skills Training Schedule</h2>
          <p className="text-sm text-slate-700 mb-3">Each skill area includes specific competencies, target completion dates, and evaluation criteria.</p>

          <div className="space-y-4">
            {[
              {
                week: 'Weeks 1–2',
                title: 'Orientation & Systems',
                skills: ['Office procedures and compliance protocols', 'Tax software setup and navigation', 'Client intake workflow and data security (IRS Pub 4557)', 'Filing systems and document management'],
              },
              {
                week: 'Weeks 3–4',
                title: 'Tax Return Preparation',
                skills: ['Individual return preparation (Form 1040)', 'Income documentation review (W-2, 1099)', 'Deduction and credit identification', 'Quality review process and e-filing'],
              },
              {
                week: 'Weeks 5–6',
                title: 'Bookkeeping & Accounting',
                skills: ['QuickBooks transaction entry and categorization', 'Bank reconciliation procedures', 'Accounts payable/receivable processing', 'Financial report generation'],
              },
              {
                week: 'Weeks 7–8',
                title: 'Client Management & Independence',
                skills: ['Independent client consultations (supervised)', 'Small business return preparation (Schedule C)', 'Payroll processing fundamentals', 'Professional communication and follow-up'],
              },
            ].map((phase) => (
              <div key={phase.week} className="bg-white border border-slate-200 rounded-lg p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-bold text-white px-2.5 py-1 rounded bg-slate-800">{phase.week}</span>
                  <h3 className="font-bold text-slate-900 text-sm">{phase.title}</h3>
                </div>
                <ul className="space-y-1.5">
                  {phase.skills.map((skill) => (
                    <li key={skill} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="text-slate-500 mt-0.5">☐</span>
                      {skill}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  Supervisor initials: ____ &nbsp; Date completed: ____ &nbsp; Competency met: ☐ Yes ☐ Needs more time
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-lg font-bold text-slate-900 mt-8">Evaluation Schedule</h2>
          <div className="bg-white border border-slate-200 rounded-lg p-4 text-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 text-slate-700 font-semibold">Evaluation</th>
                  <th className="text-left py-2 text-slate-700 font-semibold">Timing</th>
                  <th className="text-left py-2 text-slate-700 font-semibold">Conducted By</th>
                  <th className="text-center py-2 text-slate-700 font-semibold w-20">Done</th>
                </tr>
              </thead>
              <tbody className="text-slate-600">
                <tr className="border-b border-slate-100"><td className="py-2">Initial skills assessment</td><td>Week 1</td><td>Site supervisor</td><td className="text-center">☐</td></tr>
                <tr className="border-b border-slate-100"><td className="py-2">Midpoint evaluation</td><td>Week 4</td><td>Supervisor + Elevate coordinator</td><td className="text-center">☐</td></tr>
                <tr className="border-b border-slate-100"><td className="py-2">Final competency evaluation</td><td>Week 8</td><td>Supervisor + Elevate coordinator</td><td className="text-center">☐</td></tr>
                <tr><td className="py-2">Employment transition review</td><td>Week 8</td><td>Elevate career services</td><td className="text-center">☐</td></tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-lg font-bold text-slate-900 mt-8">Compliance Notes</h2>
          <ul className="text-sm text-slate-700">
            <li>OJT participant is a W-2 employee of the host employer for the duration of training</li>
            <li>Reimbursement covers extraordinary costs of training — not productive labor</li>
            <li>Participant may not displace current employees or fill vacant positions without training justification</li>
            <li>Hours must be tracked and reported to the local workforce board per WIOA Sec. 134(c)(3)(D)</li>
            <li>Employer must maintain workers&apos; compensation and liability coverage</li>
          </ul>

          <h2 className="text-lg font-bold text-slate-900 mt-8">WorkOne Coordination Requirements</h2>
          <ul className="text-sm text-slate-700">
            <li>OJT contract must be approved by the WorkOne career advisor before training begins</li>
            <li>Reimbursement rate (50–75%) is set by the local workforce development board policy — not by Elevate</li>
            <li>Participant must be registered in Indiana Career Connect with an active WIOA enrollment</li>
            <li>Weekly progress reports are sent to the assigned case manager</li>
            <li>Midpoint and final evaluations are shared with WorkOne for performance reporting</li>
            <li>Credential attainment is reported to the local board within 5 business days of exam completion</li>
            <li>Employment outcomes (hire date, wage, retention) are tracked for WIOA performance measures</li>
          </ul>

          <div className="bg-white border border-slate-200 rounded-lg p-6 mt-8">
            <h2 className="text-lg font-bold text-slate-900 mt-0">Approvals</h2>
            <div className="grid sm:grid-cols-2 gap-6 text-sm text-slate-600">
              <div>
                <p className="mb-4">Employer Representative: ___________________________</p>
                <p className="mb-4">Date: ___________________________</p>
              </div>
              <div>
                <p className="mb-4">Elevate Program Director: ___________________________</p>
                <p className="mb-4">Date: ___________________________</p>
              </div>
              <div>
                <p className="mb-4">Workforce Case Manager: ___________________________</p>
                <p className="mb-4">Date: ___________________________</p>
              </div>
              <div>
                <p className="mb-4">Participant: ___________________________</p>
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
