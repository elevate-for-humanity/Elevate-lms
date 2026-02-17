import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Student Code of Conduct | Elevate for Humanity',
  description: 'Expected behaviors, prohibited conduct, and disciplinary procedures for students.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/policies/student-code',
  },
};

export default function StudentCodePage() {
  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Policies", href: "/policies" }, { label: "Student Code" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <article className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-black mb-4">Student Code of Conduct</h1>
            <p className="text-sm text-gray-600">Last Updated: January 11, 2026</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Purpose</h2>
            <p className="text-black mb-6">
              The Student Code of Conduct establishes behavioral expectations and standards for all students at 
              Elevate for Humanity. This code promotes a safe, respectful, and productive learning environment 
              where all community members can thrive. Violations may result in disciplinary action up to and 
              including dismissal from programs.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Core Values</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-brand-blue-50 rounded-lg p-6 border-2 border-brand-blue-200">
                <h3 className="text-xl font-bold text-black mb-3">Respect</h3>
                <p className="text-black">
                  Treat all individuals with dignity, courtesy, and consideration regardless of differences.
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200">
                <h3 className="text-xl font-bold text-black mb-3">Integrity</h3>
                <p className="text-black">
                  Act honestly and ethically in all academic and personal conduct.
                </p>
              </div>

              <div className="bg-brand-blue-50 rounded-lg p-6 border-2 border-brand-blue-200">
                <h3 className="text-xl font-bold text-black mb-3">Responsibility</h3>
                <p className="text-black">
                  Take ownership of your actions, decisions, and their consequences.
                </p>
              </div>

              <div className="bg-orange-50 rounded-lg p-6 border-2 border-orange-200">
                <h3 className="text-xl font-bold text-black mb-3">Professionalism</h3>
                <p className="text-black">
                  Conduct yourself in a manner appropriate for future career success.
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Expected Behaviors</h2>
            
            <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200 mb-6">
              <h3 className="text-xl font-bold text-black mb-4">Students Are Expected To:</h3>
              <ul className="list-disc pl-6 text-black space-y-2">
                <li><strong>Attend Regularly:</strong> Maintain required attendance and arrive on time</li>
                <li><strong>Participate Actively:</strong> Engage in classes, discussions, and activities</li>
                <li><strong>Complete Work:</strong> Submit assignments and assessments on time</li>
                <li><strong>Communicate Respectfully:</strong> Use appropriate language and tone</li>
                <li><strong>Follow Instructions:</strong> Comply with instructor and staff directions</li>
                <li><strong>Respect Property:</strong> Care for facilities, equipment, and materials</li>
                <li><strong>Maintain Professionalism:</strong> Dress and behave appropriately</li>
                <li><strong>Support Peers:</strong> Help create a positive learning environment</li>
                <li><strong>Report Concerns:</strong> Notify staff of safety or conduct issues</li>
                <li><strong>Follow Policies:</strong> Comply with all institutional policies</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Prohibited Conduct</h2>
            
            <div className="bg-red-50 border-l-4 border-red-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-3">Harassment and Discrimination</h3>
              <p className="text-black mb-2">Strictly prohibited:</p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Harassment based on race, color, national origin, sex, disability, age, religion, sexual orientation, or gender identity</li>
                <li>Sexual harassment or unwelcome sexual advances</li>
                <li>Bullying, intimidation, or threatening behavior</li>
                <li>Hate speech or discriminatory language</li>
                <li>Stalking or persistent unwanted contact</li>
                <li>Creating a hostile environment for others</li>
              </ul>
            </div>

            <div className="bg-red-50 border-l-4 border-red-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-3">Violence and Safety Violations</h3>
              <p className="text-black mb-2">Zero tolerance for:</p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Physical violence or assault</li>
                <li>Threats of violence or harm</li>
                <li>Weapons possession on campus</li>
                <li>Arson or fire safety violations</li>
                <li>Bomb threats or false alarms</li>
                <li>Endangering health or safety of others</li>
              </ul>
            </div>

            <div className="bg-orange-50 border-l-4 border-orange-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-3">Substance Abuse</h3>
              <p className="text-black mb-2">Prohibited:</p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Possession, use, or distribution of illegal drugs</li>
                <li>Alcohol possession or consumption on campus</li>
                <li>Attending class under the influence</li>
                <li>Misuse of prescription medications</li>
                <li>Sale or distribution of controlled substances</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-3">Theft and Property Damage</h3>
              <p className="text-black mb-2">Prohibited:</p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Theft of property belonging to institution or others</li>
                <li>Vandalism or intentional property damage</li>
                <li>Unauthorized use of facilities or equipment</li>
                <li>Tampering with safety equipment</li>
                <li>Graffiti or defacement</li>
              </ul>
            </div>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Academic Misconduct</h3>
            <p className="text-black mb-4">
              See <a href="/policies/academic-integrity" className="text-brand-blue-600 hover:underline">Academic Integrity Policy</a> for:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Cheating and plagiarism</li>
              <li>Unauthorized collaboration</li>
              <li>Fabrication of data or information</li>
              <li>Academic dishonesty</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Technology Misuse</h3>
            <p className="text-black mb-4">
              See <a href="/policies/acceptable-use" className="text-brand-blue-600 hover:underline">Acceptable Use Policy</a> for:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Unauthorized access to systems</li>
              <li>Cyberbullying or online harassment</li>
              <li>Distribution of malware</li>
              <li>Violation of privacy</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Other Prohibited Conduct</h3>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Disruptive behavior in class or on campus</li>
              <li>Failure to comply with staff directions</li>
              <li>Unauthorized recording of classes or individuals</li>
              <li>Gambling on campus</li>
              <li>Solicitation without permission</li>
              <li>Misuse of identification or credentials</li>
              <li>Providing false information to staff</li>
              <li>Retaliation against those who report violations</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Disciplinary Process</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Reporting Violations</h3>
            <p className="text-black mb-4">
              Violations can be reported by:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Students, staff, or instructors</li>
              <li>Email: info@elevateforhumanity.org</li>
              <li>Phone: (317) 314-3757</li>
              <li>In-person to any staff member</li>
              <li>Anonymous reporting through student portal</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Investigation Process</h3>
            <div className="bg-gray-50 rounded-xl p-8 border-2 border-gray-200 mb-6">
              <div className="space-y-6">
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    1
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-black mb-2">Report Received</h4>
                    <p className="text-black">
                      Conduct office receives report and determines if investigation is warranted.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    2
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-black mb-2">Notification</h4>
                    <p className="text-black">
                      Student notified of allegations and rights. Interim measures may be implemented.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    3
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-black mb-2">Investigation</h4>
                    <p className="text-black">
                      Conduct officer gathers information, interviews witnesses, reviews evidence.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    4
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-black mb-2">Meeting</h4>
                    <p className="text-black">
                      Student meets with conduct officer to discuss findings and provide response.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                    5
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-black mb-2">Decision</h4>
                    <p className="text-black">
                      Determination made and sanctions imposed if violation found. Student notified in writing.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Sanctions</h2>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-2">Minor Violations</h3>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Verbal or written warning</li>
                <li>Required meeting with staff</li>
                <li>Educational assignment or training</li>
                <li>Community service</li>
                <li>Loss of privileges (temporary)</li>
              </ul>
            </div>

            <div className="bg-orange-50 border-l-4 border-orange-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-2">Moderate Violations</h3>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Disciplinary probation</li>
                <li>Suspension from specific activities</li>
                <li>Restitution for damages</li>
                <li>Mandatory counseling or assessment</li>
                <li>Suspension from program (1-30 days)</li>
              </ul>
            </div>

            <div className="bg-red-50 border-l-4 border-red-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-2">Severe Violations</h3>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li>Dismissal from program</li>
                <li>Permanent ban from campus</li>
                <li>Revocation of credentials</li>
                <li>No refund of tuition or fees</li>
                <li>Referral to law enforcement</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Appeals</h2>
            <p className="text-black mb-4">
              Students may appeal disciplinary decisions on these grounds:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Procedural error that affected outcome</li>
              <li>New evidence not available during investigation</li>
              <li>Sanction disproportionate to violation</li>
            </ul>
            <p className="text-black mb-4">
              Appeal process:
            </p>
            <ol className="list-decimal pl-6 mb-6 text-black space-y-2">
              <li>Submit written appeal within 5 business days</li>
              <li>Include grounds for appeal and supporting evidence</li>
              <li>Appeal reviewed by Student Conduct Committee</li>
              <li>Decision rendered within 10 business days</li>
              <li>Committee decision is final</li>
            </ol>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Student Rights</h2>
            <p className="text-black mb-4">
              During disciplinary process, students have the right to:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Written notice of allegations</li>
              <li>Explanation of process and rights</li>
              <li>Review evidence against them</li>
              <li>Present their side of the story</li>
              <li>Provide witnesses or evidence</li>
              <li>Bring an advisor to meetings</li>
              <li>Appeal decisions</li>
              <li>Confidentiality (to extent possible)</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Contact Information</h2>
            <p className="text-black mb-4">
              For questions or to report conduct violations:
            </p>
            <ul className="list-none mb-6 text-black space-y-2">
              <li><strong>Email:</strong> info@elevateforhumanity.org</li>
              <li><strong>Phone:</strong> (317) 314-3757</li>
              <li><strong>Office Hours:</strong> Monday-Friday, 9:00 AM - 5:00 PM EST</li>
              <li><strong>Emergency:</strong> Call 911, then (317) 314-3757 ext. 911</li>
            </ul>

            <div className="bg-brand-blue-50 border-l-4 border-brand-blue-400 p-6 mt-8">
              <p className="text-black mb-2">
                <strong>Related Policies:</strong>
              </p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li><a href="/policies/academic-integrity" className="text-brand-blue-600 hover:underline">Academic Integrity Policy</a></li>
                <li><a href="/policies/community-guidelines" className="text-brand-blue-600 hover:underline">Community Guidelines</a></li>
                <li><a href="/policies/acceptable-use" className="text-brand-blue-600 hover:underline">Acceptable Use Policy</a></li>
                <li><a href="/policies/attendance" className="text-brand-blue-600 hover:underline">Attendance Policy</a></li>
              </ul>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
