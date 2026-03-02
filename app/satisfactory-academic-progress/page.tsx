import { Metadata } from 'next';
import { Phone } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Satisfactory Academic Progress (SAP) Policy | Elevate for Humanity',
  description: 'Academic progress requirements for students at Elevate for Humanity. Understand pace, completion, and standing requirements.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/satisfactory-academic-progress',
  },
};

export default function SAPPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Satisfactory Academic Progress" }]} />
      </div>
{/* Header */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-4">Satisfactory Academic Progress (SAP) Policy</h1>
          <p className="text-xl text-gray-300">
            Standards for maintaining good academic standing
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Introduction */}
        <section className="mb-10">
          <p className="text-gray-700 text-lg">
            Elevate for Humanity requires all students to maintain Satisfactory Academic Progress (SAP) 
            to remain enrolled in their program. This policy establishes the standards for academic 
            achievement and the pace at which students must progress through their program.
          </p>
        </section>

        {/* SAP Components */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">SAP Requirements</h2>
          
          <p className="text-gray-700 mb-6">
            Students must meet <strong>all three</strong> of the following requirements to maintain SAP:
          </p>

          <div className="space-y-6">
            {/* Qualitative */}
            <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-3">1. Qualitative Standard (Academic Achievement)</h3>
              <p className="text-gray-700 mb-4">
                Students must maintain a minimum cumulative grade average of <strong>70%</strong> (C or equivalent) 
                across all coursework, including:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Online module assessments</li>
                <li>Quizzes and exams</li>
                <li>Assignments and projects</li>
                <li>Practical skills evaluations</li>
              </ul>
            </div>

            {/* Quantitative - Pace */}
            <div className="bg-brand-green-50 border border-brand-green-200 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-3">2. Quantitative Standard (Pace of Completion)</h3>
              <p className="text-gray-700 mb-4">
                Students must successfully complete at least <strong>67%</strong> of all attempted coursework 
                at each evaluation point. This is calculated as:
              </p>
              <div className="bg-white border border-gray-200 rounded p-4 mb-4">
                <p className="text-gray-700 font-mono text-center">
                  Pace = (Completed Hours or Modules) ÷ (Attempted Hours or Modules) × 100
                </p>
              </div>
              <p className="text-gray-700">
                <strong>Example:</strong> A student who has attempted 10 modules must have successfully 
                completed at least 7 modules (70%) to meet the pace requirement.
              </p>
            </div>

            {/* Maximum Timeframe */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-3">3. Maximum Timeframe</h3>
              <p className="text-gray-700 mb-4">
                Students must complete their program within <strong>150%</strong> of the published program length.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse mt-4">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-3 border">Program</th>
                      <th className="text-left p-3 border">Published Length</th>
                      <th className="text-left p-3 border">Maximum Timeframe</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 border">Barber Apprenticeship</td>
                      <td className="p-3 border">12 months</td>
                      <td className="p-3 border">18 months</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="p-3 border">HVAC Technician</td>
                      <td className="p-3 border">9 months</td>
                      <td className="p-3 border">13.5 months</td>
                    </tr>
                    <tr>
                      <td className="p-3 border">Medical Assistant</td>
                      <td className="p-3 border">12 weeks</td>
                      <td className="p-3 border">18 weeks</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="p-3 border">CNA</td>
                      <td className="p-3 border">6 weeks</td>
                      <td className="p-3 border">9 weeks</td>
                    </tr>
                    <tr>
                      <td className="p-3 border">CDL</td>
                      <td className="p-3 border">6 weeks</td>
                      <td className="p-3 border">9 weeks</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Evaluation Points */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">SAP Evaluation Points</h2>
          
          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-gray-700 mb-4">
              SAP is evaluated at the following points:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>Programs 12 weeks or less:</strong> At the midpoint and end of the program</li>
              <li><strong>Programs longer than 12 weeks:</strong> At the end of each month or module, whichever is more frequent</li>
              <li><strong>Clock hour programs:</strong> At each 450-hour increment or monthly, whichever is more frequent</li>
            </ul>
            <p className="text-gray-700 mt-4">
              Students will receive written notification of their SAP status after each evaluation.
            </p>
          </div>
        </section>

        {/* Academic Standing */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Academic Standing</h2>
          
          <div className="space-y-4">
            <div className="bg-brand-green-50 border border-brand-green-200 rounded-lg p-6">
              <h3 className="font-bold text-brand-green-800 mb-2">Good Standing</h3>
              <p className="text-gray-700">
                Students meeting all SAP requirements are in good standing and may continue 
                in their program without restriction.
              </p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="font-bold text-yellow-800 mb-2">SAP Warning</h3>
              <p className="text-gray-700 mb-3">
                Students who fail to meet SAP requirements at an evaluation point will be 
                placed on SAP Warning for the next evaluation period. During warning:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Student may continue in the program</li>
                <li>Student must meet with academic advisor</li>
                <li>An academic improvement plan will be developed</li>
                <li>Student must meet SAP by the next evaluation to return to good standing</li>
              </ul>
            </div>
            
            <div className="bg-brand-orange-50 border border-brand-orange-200 rounded-lg p-6">
              <h3 className="font-bold text-brand-orange-800 mb-2">SAP Probation</h3>
              <p className="text-gray-700 mb-3">
                Students who fail to meet SAP after the warning period and have successfully 
                appealed may be placed on SAP Probation. During probation:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Student may continue under strict academic plan</li>
                <li>Weekly check-ins with academic advisor required</li>
                <li>Specific milestones must be met</li>
                <li>Failure to meet milestones results in dismissal</li>
              </ul>
            </div>
            
            <div className="bg-brand-red-50 border border-brand-red-200 rounded-lg p-6">
              <h3 className="font-bold text-brand-red-800 mb-2">Academic Dismissal</h3>
              <p className="text-gray-700">
                Students who fail to meet SAP after the warning period (without successful appeal) 
                or who fail to meet probation requirements will be academically dismissed from 
                the program. Dismissed students may apply for re-enrollment after a minimum of 
                one enrollment period.
              </p>
            </div>
          </div>
        </section>

        {/* Appeal Process */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">SAP Appeal Process</h2>
          
          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-gray-700 mb-4">
              Students who fail to meet SAP may appeal if extenuating circumstances affected 
              their academic performance. Extenuating circumstances may include:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 mb-6">
              <li>Serious illness or injury (student or immediate family member)</li>
              <li>Death of an immediate family member</li>
              <li>Significant personal crisis (documented)</li>
              <li>Other circumstances beyond the student's control</li>
            </ul>
            
            <h3 className="font-bold text-gray-900 mb-3">To Appeal:</h3>
            <ol className="list-decimal list-inside text-gray-700 space-y-2">
              <li>Submit a written appeal within 5 business days of SAP notification</li>
              <li>Explain the circumstances that affected your performance</li>
              <li>Provide supporting documentation</li>
              <li>Describe what has changed that will allow you to meet SAP going forward</li>
              <li>Submit to: Student Services, our contact form</li>
            </ol>
            
            <p className="text-gray-700 mt-6">
              Appeals are reviewed by the Academic Standards Committee. Students will receive 
              a written decision within 10 business days. The committee's decision is final.
            </p>
          </div>
        </section>

        {/* Re-establishing SAP */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Re-establishing SAP</h2>
          
          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-gray-700 mb-4">
              Students on Warning or Probation can return to Good Standing by:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Achieving a cumulative grade average of 70% or higher</li>
              <li>Achieving a pace of completion of 67% or higher</li>
              <li>Remaining within the maximum timeframe</li>
              <li>Meeting all requirements of their academic improvement plan</li>
            </ul>
            <p className="text-gray-700 mt-4">
              Once SAP is re-established, the student returns to Good Standing and the 
              warning/probation status is removed from their record.
            </p>
          </div>
        </section>

        {/* Incomplete Grades */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Incomplete Grades and Withdrawals</h2>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-2">Incomplete (I) Grades</h3>
              <p className="text-gray-700">
                Incomplete grades count as attempted but not completed for pace calculations. 
                Students have 14 days to complete outstanding work before the grade converts 
                to a failing grade.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-2">Withdrawals (W)</h3>
              <p className="text-gray-700">
                Withdrawn courses count as attempted but not completed for pace calculations. 
                Withdrawals do not affect the qualitative (grade) calculation.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-2">Repeated Coursework</h3>
              <p className="text-gray-700">
                Students may repeat failed coursework once. Both attempts count toward 
                attempted hours for pace calculation, but only the higher grade is used 
                for the qualitative calculation.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t">
          <p className="text-gray-600 text-sm mb-4">
            <strong>Effective Date:</strong> January 2026
          </p>
          <p className="text-gray-600 text-sm mb-6">
            Questions about SAP? Contact Student Services at Visit Support Center or our contact form
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/disclosures" className="text-brand-orange-600 hover:underline">Student Disclosures</Link>
            <Link href="/attendance-policy" className="text-brand-orange-600 hover:underline">Attendance Policy</Link>
            <Link href="/refund-policy" className="text-brand-orange-600 hover:underline">Refund Policy</Link>
            <Link href="/grievance" className="text-brand-orange-600 hover:underline">Grievance Policy</Link>
          </div>
        </div>
      {/* CTA Section */}
      <section className="bg-brand-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Start Your Career?</h2>
          <p className="text-brand-blue-100 mb-6">Check your eligibility for funded career training programs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center bg-white text-brand-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Apply Now
            </Link>
            <a
              href="/support"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-blue-800 transition"
            >
              <Phone className="w-4 h-4" />
              Visit Support Center
            </a>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
