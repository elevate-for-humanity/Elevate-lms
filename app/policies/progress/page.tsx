import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Academic Progress Policy | Elevate for Humanity',
  description: 'Standards for measuring and reporting student progress, satisfactory academic progress requirements, and probation procedures.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/policies/progress',
  },
};

export default function ProgressPage() {
  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Policies", href: "/policies" }, { label: "Progress" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <article className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-black mb-4">Academic Progress Policy</h1>
            <p className="text-sm text-gray-600">Last Updated: January 11, 2026</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Purpose</h2>
            <p className="text-black mb-6">
              This policy establishes standards for Satisfactory Academic Progress (SAP) that students must maintain 
              to continue enrollment and remain eligible for financial aid. Federal regulations require institutions 
              to monitor student progress toward program completion.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Satisfactory Academic Progress Standards</h2>
            
            <div className="bg-brand-blue-50 rounded-xl p-6 border-2 border-brand-blue-200 mb-6">
              <h3 className="text-xl font-bold text-black mb-4">Three Components of SAP</h3>
              <p className="text-black mb-4">
                Students must meet ALL three standards:
              </p>
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-black mb-2">1. Qualitative Standard (GPA)</h4>
                  <ul className="list-disc pl-6 text-black space-y-1">
                    <li>Maintain minimum 2.0 cumulative GPA</li>
                    <li>Calculated on 4.0 scale</li>
                    <li>Includes all attempted courses</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-black mb-2">2. Quantitative Standard (Completion Rate)</h4>
                  <ul className="list-disc pl-6 text-black space-y-1">
                    <li>Complete at least 67% of attempted credits/hours</li>
                    <li>Calculated cumulatively</li>
                    <li>Includes withdrawals and incompletes</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-black mb-2">3. Maximum Timeframe</h4>
                  <ul className="list-disc pl-6 text-black space-y-1">
                    <li>Complete program within 150% of published length</li>
                    <li>Example: 12-week program must finish within 18 weeks</li>
                    <li>Includes all enrollment periods</li>
                  </ul>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Progress Evaluation</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Evaluation Schedule</h3>
            <p className="text-black mb-4">
              SAP is evaluated:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>At the end of each payment period (for financial aid)</li>
              <li>At mid-program checkpoints</li>
              <li>Upon program completion</li>
              <li>Before re-enrollment in new programs</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">What Counts in Evaluation</h3>
            <div className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-6">
              <p className="text-black mb-4">
                <strong>Included in SAP calculation:</strong>
              </p>
              <ul className="list-disc pl-6 text-black space-y-2">
                <li>All courses attempted (passed, failed, withdrawn)</li>
                <li>Repeated courses</li>
                <li>Transfer credits accepted</li>
                <li>Incompletes (count as attempted but not completed)</li>
              </ul>
              <p className="text-black mt-4 mb-4">
                <strong>Not included:</strong>
              </p>
              <ul className="list-disc pl-6 text-black space-y-2">
                <li>Courses dropped before add/drop deadline</li>
                <li>Audited courses</li>
                <li>Non-credit courses</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Academic Standing Categories</h2>
            
            <div className="bg-brand-green-50 border-l-4 border-brand-green-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-2">Good Standing</h3>
              <p className="text-black mb-2">
                Student meets all three SAP standards:
              </p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>GPA ≥ 2.0</li>
                <li>Completion rate ≥ 67%</li>
                <li>Within maximum timeframe</li>
              </ul>
              <p className="text-black mt-3">
                <strong>Status:</strong> Eligible for continued enrollment and financial aid
              </p>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-2">Academic Warning</h3>
              <p className="text-black mb-2">
                Student fails to meet one or more SAP standards for first time:
              </p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Notified of deficiency</li>
                <li>Required to meet with advisor</li>
                <li>Develop improvement plan</li>
                <li>One evaluation period to improve</li>
              </ul>
              <p className="text-black mt-3">
                <strong>Status:</strong> Remains eligible for financial aid during warning period
              </p>
            </div>

            <div className="bg-brand-orange-50 border-l-4 border-brand-orange-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-2">Academic Probation</h3>
              <p className="text-black mb-2">
                Student on warning fails to meet SAP standards again:
              </p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Placed on probation</li>
                <li>Must appeal to continue</li>
                <li>Academic plan required</li>
                <li>Frequent progress monitoring</li>
                <li>May have enrollment restrictions</li>
              </ul>
              <p className="text-black mt-3">
                <strong>Status:</strong> Financial aid eligibility suspended unless appeal approved
              </p>
            </div>

            <div className="bg-brand-red-50 border-l-4 border-brand-red-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-2">Academic Dismissal</h3>
              <p className="text-black mb-2">
                Student on probation fails to meet SAP standards or academic plan:
              </p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Dismissed from program</li>
                <li>Financial aid terminated</li>
                <li>May reapply after one term</li>
                <li>Must demonstrate readiness to succeed</li>
              </ul>
              <p className="text-black mt-3">
                <strong>Status:</strong> Not eligible for enrollment or financial aid
              </p>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Appeal Process</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Grounds for Appeal</h3>
            <p className="text-black mb-4">
              Students may appeal SAP suspension due to:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Serious illness or injury</li>
              <li>Death of immediate family member</li>
              <li>Significant personal or family emergency</li>
              <li>Other extraordinary circumstances beyond student control</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">How to Appeal</h3>
            <div className="bg-gray-50 rounded-xl p-8 border-2 border-gray-200 mb-6">
              <ol className="list-decimal pl-6 text-black space-y-3">
                <li>
                  <strong>Submit written appeal within 10 business days</strong>
                  <p className="mt-1">Include explanation of circumstances and how they affected performance</p>
                </li>
                <li>
                  <strong>Provide documentation</strong>
                  <p className="mt-1">Medical records, death certificates, police reports, etc.</p>
                </li>
                <li>
                  <strong>Develop academic plan</strong>
                  <p className="mt-1">Work with advisor to create plan for meeting SAP standards</p>
                </li>
                <li>
                  <strong>Committee review</strong>
                  <p className="mt-1">SAP Appeals Committee reviews appeal and supporting documents</p>
                </li>
                <li>
                  <strong>Decision notification</strong>
                  <p className="mt-1">Receive decision within 15 business days</p>
                </li>
              </ol>
            </div>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Appeal Outcomes</h3>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li><strong>Approved:</strong> Placed on probation with academic plan; financial aid reinstated</li>
              <li><strong>Denied:</strong> Dismissal stands; may reapply after one term</li>
              <li><strong>Conditional:</strong> Additional requirements or restrictions imposed</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Academic Plans</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Plan Requirements</h3>
            <p className="text-black mb-4">
              Academic plans must include:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Specific, measurable goals for each evaluation period</li>
              <li>Strategies for improving performance</li>
              <li>Support services to be utilized (tutoring, counseling, etc.)</li>
              <li>Timeline for meeting SAP standards</li>
              <li>Consequences for not meeting plan requirements</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Monitoring</h3>
            <p className="text-black mb-6">
              Students on academic plans are monitored closely:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Regular meetings with advisor</li>
              <li>Progress checks at mid-point</li>
              <li>Mandatory use of support services</li>
              <li>Attendance tracking</li>
              <li>Grade monitoring</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Special Circumstances</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Course Repeats</h3>
            <p className="text-black mb-6">
              Students may repeat failed courses. Both attempts count in SAP calculation. Only the highest 
              grade counts toward GPA, but all attempts count toward completion rate and maximum timeframe.
            </p>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Withdrawals</h3>
            <p className="text-black mb-6">
              Withdrawals count as attempted but not completed credits. Multiple withdrawals significantly 
              impact completion rate. Students should consult advisors before withdrawing.
            </p>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Program Changes</h3>
            <p className="text-black mb-6">
              Changing programs may affect SAP. All attempted credits count, even if not applicable to new 
              program. Consult with registrar before changing programs.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Financial Aid Impact</h2>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-3">SAP and Financial Aid</h3>
              <p className="text-black mb-4">
                Federal regulations require financial aid recipients to maintain SAP:
              </p>
              <ul className="list-disc pl-6 text-black space-y-2">
                <li>Failure to meet SAP results in loss of federal aid</li>
                <li>Includes Pell Grants, student loans, work-study</li>
                <li>Also affects state and institutional aid</li>
                <li>Aid can be reinstated after meeting SAP or successful appeal</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Reinstatement</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Regaining Good Standing</h3>
            <p className="text-black mb-4">
              To regain good standing:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Meet all three SAP standards</li>
              <li>Complete requirements of academic plan (if applicable)</li>
              <li>Demonstrate sustained improvement</li>
              <li>Clear any conduct or financial holds</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Contact Information</h2>
            <p className="text-black mb-4">
              For questions about academic progress:
            </p>
            <ul className="list-none mb-6 text-black space-y-2">
              <li><strong>Email:</strong> info@elevateforhumanity.org</li>
              <li><strong>Phone:</strong> (317) 314-3757</li>
              <li><strong>SAP Appeals:</strong> info@elevateforhumanity.org</li>
              <li><strong>Office Hours:</strong> Monday-Friday, 9:00 AM - 5:00 PM EST</li>
            </ul>

            <div className="bg-brand-blue-50 border-l-4 border-brand-blue-400 p-6 mt-8">
              <p className="text-black mb-2">
                <strong>Related Policies:</strong>
              </p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li><a href="/policies/attendance" className="text-brand-blue-600 hover:underline">Attendance Policy</a></li>
                <li><a href="/policies/academic-integrity" className="text-brand-blue-600 hover:underline">Academic Integrity Policy</a></li>
                <li><a href="/policies/credentials" className="text-brand-blue-600 hover:underline">Credentials Policy</a></li>
              </ul>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
