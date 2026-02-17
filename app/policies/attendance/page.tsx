import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Attendance Policy | Elevate for Humanity',
  description: 'Requirements for class attendance, participation, and procedures for absences and tardiness.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/policies/attendance',
  },
};

export default function AttendancePage() {
  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Policies", href: "/policies" }, { label: "Attendance" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <article className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-black mb-4">Attendance Policy</h1>
            <p className="text-sm text-gray-600">Last Updated: January 11, 2026</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Purpose</h2>
            <p className="text-black mb-6">
              Regular attendance is essential for academic success and program completion. This policy establishes 
              attendance requirements, procedures for reporting absences, and consequences for excessive absences. 
              Many of our programs are funded by government agencies that require strict attendance tracking.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Attendance Requirements</h2>
            
            <div className="bg-brand-blue-50 rounded-xl p-6 border-2 border-brand-blue-200 mb-6">
              <h3 className="text-xl font-bold text-black mb-4">Minimum Attendance</h3>
              <p className="text-black mb-4">
                Students must maintain:
              </p>
              <ul className="list-disc pl-6 text-black space-y-2">
                <li><strong>80% attendance</strong> for all scheduled class sessions</li>
                <li><strong>100% attendance</strong> for clinical rotations and externships</li>
                <li><strong>On-time arrival</strong> for all sessions (tardiness counts as partial absence)</li>
                <li><strong>Full participation</strong> when present (not just physical presence)</li>
              </ul>
            </div>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">What Counts as Attendance</h3>
            <p className="text-black mb-4">
              To be marked present, students must:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Arrive within 15 minutes of class start time</li>
              <li>Remain for the entire class session</li>
              <li>Actively participate in class activities</li>
              <li>Complete any in-class assignments or assessments</li>
              <li>Sign attendance sheet or check in electronically</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Types of Absences</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Excused Absences</h3>
            <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200 mb-6">
              <p className="text-black mb-4">
                Absences may be excused for:
              </p>
              <ul className="list-disc pl-6 text-black space-y-2">
                <li><strong>Illness:</strong> Personal illness with doctor's note (for absences over 2 days)</li>
                <li><strong>Family Emergency:</strong> Death or serious illness of immediate family member</li>
                <li><strong>Medical Appointments:</strong> Scheduled medical/dental appointments with documentation</li>
                <li><strong>Court Appearances:</strong> Required court dates with official documentation</li>
                <li><strong>Military Duty:</strong> Active duty or reserve obligations</li>
                <li><strong>Religious Observance:</strong> Major religious holidays (with advance notice)</li>
                <li><strong>School-Sanctioned Events:</strong> Pre-approved educational activities</li>
              </ul>
              <p className="text-black mt-4">
                <strong>Note:</strong> Excused absences still count toward your total absences but may allow 
                for makeup work and do not trigger immediate consequences.
              </p>
            </div>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Unexcused Absences</h3>
            <div className="bg-red-50 rounded-lg p-6 border-2 border-red-200 mb-6">
              <p className="text-black mb-4">
                Absences are unexcused when:
              </p>
              <ul className="list-disc pl-6 text-black space-y-2">
                <li>No notification is provided to instructor</li>
                <li>Reason does not meet excused absence criteria</li>
                <li>Required documentation is not submitted</li>
                <li>Student leaves class early without permission</li>
                <li>Student is asked to leave due to behavior or intoxication</li>
              </ul>
            </div>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Tardiness</h3>
            <p className="text-black mb-4">
              Tardiness policy:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li><strong>1-15 minutes late:</strong> Marked tardy (3 tardies = 1 absence)</li>
              <li><strong>16-30 minutes late:</strong> Marked as half absence</li>
              <li><strong>More than 30 minutes late:</strong> Marked as full absence</li>
              <li><strong>Leaving early:</strong> Same rules apply in reverse</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Reporting Absences</h2>
            
            <div className="bg-gray-50 rounded-xl p-8 border-2 border-gray-200 mb-6">
              <h3 className="text-xl font-bold text-black mb-4">Notification Procedure</h3>
              <div className="space-y-6">
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    1
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-black mb-2">Before Class</h4>
                    <p className="text-black">
                      Notify your instructor BEFORE the class start time via:
                    </p>
                    <ul className="list-disc pl-6 text-black mt-2 space-y-1">
                      <li>Email to instructor</li>
                      <li>Phone call to main office: (317) 314-3757</li>
                      <li>Student portal absence reporting form</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    2
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-black mb-2">Provide Reason</h4>
                    <p className="text-black">
                      Briefly explain the reason for your absence. Be honest and specific.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    3
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-black mb-2">Submit Documentation</h4>
                    <p className="text-black mb-2">
                      For excused absences, submit documentation within 3 business days:
                    </p>
                    <ul className="list-disc pl-6 text-black space-y-1">
                      <li>Doctor's notes</li>
                      <li>Court documents</li>
                      <li>Death certificates or obituaries</li>
                      <li>Military orders</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    4
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-black mb-2">Make Up Work</h4>
                    <p className="text-black">
                      Contact instructor within 1 week to arrange makeup work for excused absences.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Consequences for Excessive Absences</h2>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-2">Warning Level (10-15% absences)</h3>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Verbal warning from instructor</li>
                <li>Email notification to student</li>
                <li>Meeting with instructor to discuss attendance</li>
                <li>Development of attendance improvement plan</li>
              </ul>
            </div>

            <div className="bg-orange-50 border-l-4 border-orange-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-2">Probation Level (16-20% absences)</h3>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Written warning placed in student file</li>
                <li>Meeting with program director</li>
                <li>Attendance probation status</li>
                <li>Notification to funding source (if applicable)</li>
                <li>Risk of course failure</li>
              </ul>
            </div>

            <div className="bg-red-50 border-l-4 border-red-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-2">Dismissal Level (Over 20% absences)</h3>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Automatic course failure</li>
                <li>Dismissal from program</li>
                <li>Loss of funding eligibility</li>
                <li>No refund of tuition or fees</li>
                <li>Must reapply for future enrollment</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Special Circumstances</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Extended Absences</h3>
            <p className="text-black mb-4">
              For extended absences (more than 3 consecutive days):
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Contact program director immediately</li>
              <li>Provide medical or other documentation</li>
              <li>Discuss options: makeup work, leave of absence, or withdrawal</li>
              <li>Extended absences may require program restart</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Leave of Absence</h3>
            <p className="text-black mb-4">
              Students may request a leave of absence for:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Serious medical conditions</li>
              <li>Family emergencies</li>
              <li>Military deployment</li>
              <li>Other extraordinary circumstances</li>
            </ul>
            <p className="text-black mb-6">
              Leave of absence must be approved in advance and may affect funding and completion timeline.
            </p>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Online/Hybrid Programs</h3>
            <p className="text-black mb-6">
              For online or hybrid programs, attendance is tracked through:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Login activity and participation in online sessions</li>
              <li>Completion of assignments by deadlines</li>
              <li>Participation in discussion forums</li>
              <li>Attendance at required in-person sessions</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Funding Source Requirements</h2>
            <p className="text-black mb-4">
              Students with government funding must be aware:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li><strong>WIOA:</strong> Requires 80% attendance; excessive absences may result in funding termination</li>
              <li><strong>Vocational Rehabilitation:</strong> Must notify counselor of attendance issues</li>
              <li><strong>Veterans Benefits:</strong> VA requires reporting of absences; may affect benefits</li>
              <li><strong>Employer Sponsorship:</strong> Employer may have additional attendance requirements</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Appeals</h2>
            <p className="text-black mb-4">
              Students may appeal attendance-related dismissals:
            </p>
            <ol className="list-decimal pl-6 mb-6 text-black space-y-2">
              <li>Submit written appeal within 5 business days of dismissal notification</li>
              <li>Include documentation of extenuating circumstances</li>
              <li>Appeal reviewed by Academic Affairs Committee</li>
              <li>Decision rendered within 10 business days</li>
              <li>Committee decision is final</li>
            </ol>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Contact Information</h2>
            <p className="text-black mb-4">
              For attendance questions or to report absences:
            </p>
            <ul className="list-none mb-6 text-black space-y-2">
              <li><strong>Email:</strong> info@elevateforhumanity.org</li>
              <li><strong>Phone:</strong> (317) 314-3757</li>
              <li><strong>Office Hours:</strong> Monday-Friday, 8:00 AM - 6:00 PM EST</li>
              <li><strong>Emergency Line:</strong> (317) 314-3757 ext. 911 (after hours)</li>
            </ul>

            <div className="bg-brand-blue-50 border-l-4 border-brand-blue-400 p-6 mt-8">
              <p className="text-black mb-2">
                <strong>Related Policies:</strong>
              </p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li><a href="/policies/progress" className="text-brand-blue-600 hover:underline">Progress Policy</a></li>
                <li><a href="/policies/student-code" className="text-brand-blue-600 hover:underline">Student Code of Conduct</a></li>
                <li><a href="/policies/academic-integrity" className="text-brand-blue-600 hover:underline">Academic Integrity Policy</a></li>
              </ul>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
