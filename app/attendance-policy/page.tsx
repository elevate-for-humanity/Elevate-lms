import { Metadata } from 'next';
import { Phone } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Attendance Policy | Elevate for Humanity',
  description: 'Attendance requirements for hybrid programs at Elevate for Humanity. Understand expectations for online and in-person components.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/attendance-policy',
  },
};

export default function AttendancePolicyPage() {
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Attendance Policy" }]} />
      </div>
{/* Header */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-4">Attendance Policy</h1>
          <p className="text-xl text-gray-300">
            Requirements for hybrid program participation
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Introduction */}
        <section className="mb-10">
          <p className="text-gray-700 text-lg">
            Regular attendance is essential for successful completion of your program. 
            Elevate for Humanity programs use hybrid delivery, combining online coursework 
            with in-person instruction. This policy outlines attendance requirements for both components.
          </p>
        </section>

        {/* Hybrid Attendance Definition */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Hybrid Attendance Definition</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-3">Online Component</h3>
              <p className="text-gray-700 mb-3">Attendance is measured by:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Logging into the Learning Management System (LMS)</li>
                <li>Completing assigned lessons and modules</li>
                <li>Submitting assignments by deadlines</li>
                <li>Participating in discussion forums (if required)</li>
                <li>Completing quizzes and assessments</li>
              </ul>
            </div>
            
            <div className="bg-brand-green-50 border border-brand-green-200 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-3">In-Person Component</h3>
              <p className="text-gray-700 mb-3">Attendance is measured by:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Physical presence at scheduled training sessions</li>
                <li>Sign-in/sign-out documentation</li>
                <li>Participation in hands-on activities</li>
                <li>Completion of lab hours (where applicable)</li>
                <li>Supervised practical experience hours</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Attendance Requirements */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Attendance Requirements</h2>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="font-bold text-gray-900 mb-3">Minimum Attendance Standard</h3>
            <p className="text-gray-700 mb-4">
              Students must maintain a minimum of <strong>80% attendance</strong> in both online 
              and in-person components to remain in good standing and be eligible for program completion.
            </p>
            <div className="bg-white border border-gray-200 rounded p-4">
              <p className="text-gray-700">
                <strong>Example:</strong> For a program with 100 scheduled in-person hours, 
                students must attend at least 80 hours. For online coursework, students must 
                complete at least 80% of assigned modules and activities.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-bold text-gray-900 mb-3">Clock Hour Programs</h3>
            <p className="text-gray-700">
              Programs that require specific clock hours for certification or licensing 
              (such as Barber Apprenticeship with 2,000 hours) must complete <strong>100%</strong> of 
              required hours. These hours are tracked separately and reported to relevant 
              licensing boards.
            </p>
          </div>
        </section>

        {/* Tracking and Documentation */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Attendance Tracking</h2>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-3">Online Tracking</h3>
              <p className="text-gray-700">
                The Learning Management System (LMS) automatically tracks:
              </p>
              <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                <li>Login dates and times</li>
                <li>Time spent on each module</li>
                <li>Assignment submission timestamps</li>
                <li>Quiz and assessment completion</li>
                <li>Overall course progress percentage</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-3">In-Person Tracking</h3>
              <p className="text-gray-700">
                In-person attendance is documented through:
              </p>
              <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                <li>Daily sign-in sheets</li>
                <li>Instructor attendance records</li>
                <li>Time clock systems (where applicable)</li>
                <li>Supervisor verification for practical hours</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Absences */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Absences and Tardiness</h2>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-3">Excused Absences</h3>
              <p className="text-gray-700 mb-3">
                The following may be considered excused absences with proper documentation:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Illness (with doctor's note for extended absences)</li>
                <li>Family emergency</li>
                <li>Court appearance (with documentation)</li>
                <li>Military duty</li>
                <li>Pre-approved absence for work or personal reasons</li>
              </ul>
              <p className="text-gray-700 mt-3">
                <strong>Note:</strong> Excused absences still count toward the attendance calculation 
                but may be eligible for make-up work.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-3">Unexcused Absences</h3>
              <p className="text-gray-700">
                Absences without prior approval or documentation are considered unexcused. 
                Three consecutive unexcused absences from in-person sessions will trigger 
                an attendance warning.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-3">Tardiness</h3>
              <p className="text-gray-700">
                Arriving more than 15 minutes late to an in-person session is considered tardy. 
                Three tardies equal one absence for attendance calculation purposes.
              </p>
            </div>
          </div>
        </section>

        {/* Make-Up Work */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Make-Up Work</h2>
          
          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-6">
            <h3 className="font-bold text-gray-900 mb-3">Online Coursework</h3>
            <p className="text-gray-700 mb-4">
              Students who fall behind on online coursework may request an extension by 
              contacting their instructor. Extensions are granted at the instructor's discretion 
              and typically do not exceed 7 days.
            </p>
            
            <h3 className="font-bold text-gray-900 mb-3">In-Person Sessions</h3>
            <p className="text-gray-700 mb-4">
              Make-up sessions for missed in-person training may be available depending on:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Availability of instructors and facilities</li>
              <li>Nature of the missed content</li>
              <li>Student's overall attendance record</li>
            </ul>
            <p className="text-gray-700 mt-4">
              Make-up sessions must be completed within 14 days of the original session. 
              Contact your program coordinator to arrange make-up work.
            </p>
          </div>
        </section>

        {/* Consequences */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Attendance Warnings and Withdrawal</h2>
          
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-3">Attendance Warning</h3>
              <p className="text-gray-700">
                Students whose attendance falls below 85% will receive a written warning. 
                The warning will include:
              </p>
              <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                <li>Current attendance percentage</li>
                <li>Specific absences or missed work</li>
                <li>Steps required to return to good standing</li>
                <li>Deadline for improvement</li>
              </ul>
            </div>
            
            <div className="bg-brand-orange-50 border border-brand-orange-200 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-3">Attendance Probation</h3>
              <p className="text-gray-700">
                Students whose attendance falls below 80% will be placed on attendance probation. 
                During probation, students must meet with their program coordinator to develop 
                an attendance improvement plan.
              </p>
            </div>
            
            <div className="bg-brand-red-50 border border-brand-red-200 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-3">Withdrawal for Non-Attendance</h3>
              <p className="text-gray-700 mb-3">
                Students may be administratively withdrawn from the program if:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Attendance remains below 80% after probation period</li>
                <li>No contact with the School for 14 consecutive days</li>
                <li>Failure to complete the attendance improvement plan</li>
              </ul>
              <p className="text-gray-700 mt-3">
                Students withdrawn for non-attendance may be eligible for re-enrollment 
                in a future cohort. See the <Link href="/refund-policy" className="text-brand-orange-600 hover:underline">Refund Policy</Link> for 
                financial implications of withdrawal.
              </p>
            </div>
          </div>
        </section>

        {/* Appeals */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Appeals</h2>
          <p className="text-gray-700 mb-4">
            Students who believe their attendance record is inaccurate or who have extenuating 
            circumstances may appeal attendance-related decisions through the <Link href="/grievance" className="text-brand-orange-600 hover:underline">Grievance Process</Link>.
          </p>
          <p className="text-gray-700">
            Appeals must be submitted in writing within 5 business days of receiving an 
            attendance warning, probation notice, or withdrawal notification.
          </p>
        </section>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t">
          <p className="text-gray-600 text-sm mb-4">
            <strong>Effective Date:</strong> January 2026
          </p>
          <p className="text-gray-600 text-sm mb-6">
            Questions about attendance? Contact your program coordinator or call Get Help Online.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/disclosures" className="text-brand-orange-600 hover:underline">Student Disclosures</Link>
            <Link href="/satisfactory-academic-progress" className="text-brand-orange-600 hover:underline">SAP Policy</Link>
            <Link href="/refund-policy" className="text-brand-orange-600 hover:underline">Refund Policy</Link>
            <Link href="/grievance" className="text-brand-orange-600 hover:underline">Grievance Policy</Link>
          </div>
        </div>
      {/* CTA Section */}
      <section className="bg-brand-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Start Your Career?</h2>
          <p className="text-brand-blue-100 mb-6">Apply today for free career training programs.</p>
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
              Get Help Online
            </a>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
