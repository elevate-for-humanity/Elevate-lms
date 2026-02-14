import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Data Retention Policy | Elevate for Humanity',
  description: 'How long we keep student and institutional data, retention schedules, and secure deletion procedures.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/policies/data-retention',
  },
};

export default function DataRetentionPage() {
  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Policies", href: "/policies" }, { label: "Data Retention" }]} />
      </div>
<div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <article className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-black mb-4">Data Retention Policy</h1>
            <p className="text-sm text-gray-600">Last Updated: January 11, 2026</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Purpose</h2>
            <p className="text-black mb-6">
              This Data Retention Policy establishes how long Elevate for Humanity retains different types of 
              data, when and how data is deleted, and the legal and operational reasons for our retention 
              schedules. We balance our need to maintain records with privacy principles and legal requirements.
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Retention Principles</h2>
            <p className="text-black mb-4">
              Our data retention practices are guided by:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li><strong>Legal Compliance:</strong> Meet federal and state record-keeping requirements</li>
              <li><strong>Operational Need:</strong> Maintain data necessary for operations and services</li>
              <li><strong>Privacy Protection:</strong> Delete data when no longer needed</li>
              <li><strong>Security:</strong> Protect data throughout its lifecycle</li>
              <li><strong>Transparency:</strong> Clear communication about retention practices</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Student Records Retention</h2>
            
            <div className="bg-brand-blue-50 rounded-xl p-6 border-2 border-brand-blue-200 mb-6">
              <h3 className="text-xl font-bold text-black mb-4">Academic Records</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-black mb-2">Permanent Retention:</h4>
                  <ul className="list-disc pl-6 text-black space-y-1">
                    <li>Official transcripts</li>
                    <li>Degrees and certificates awarded</li>
                    <li>Enrollment dates and programs completed</li>
                    <li>Final grades and credits earned</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-black mb-2">7 Years After Last Enrollment:</h4>
                  <ul className="list-disc pl-6 text-black space-y-1">
                    <li>Course syllabi and materials</li>
                    <li>Assignment submissions and grades</li>
                    <li>Attendance records</li>
                    <li>Progress reports and evaluations</li>
                    <li>Disciplinary records</li>
                    <li>Accommodation documentation</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-black mb-2">3 Years After Last Enrollment:</h4>
                  <ul className="list-disc pl-6 text-black space-y-1">
                    <li>Course discussion posts</li>
                    <li>Peer interactions and feedback</li>
                    <li>Non-graded assignments</li>
                    <li>Draft work and notes</li>
                  </ul>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Admissions and Application Data</h3>
            <div className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-6">
              <ul className="space-y-3 text-black">
                <li><strong>Enrolled Students:</strong> Retained as part of student record (7 years after last enrollment)</li>
                <li><strong>Accepted but Not Enrolled:</strong> 3 years from acceptance date</li>
                <li><strong>Denied Applications:</strong> 2 years from denial date</li>
                <li><strong>Incomplete Applications:</strong> 1 year from last activity</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Financial Records Retention</h2>
            
            <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200 mb-6">
              <h3 className="text-xl font-bold text-black mb-4">Financial Data</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-black mb-2">7 Years (IRS Requirement):</h4>
                  <ul className="list-disc pl-6 text-black space-y-1">
                    <li>Tuition and fee payments</li>
                    <li>Payment plans and agreements</li>
                    <li>Refunds and adjustments</li>
                    <li>Financial aid records</li>
                    <li>Invoices and receipts</li>
                    <li>1098-T tax forms</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-black mb-2">3 Years:</h4>
                  <ul className="list-disc pl-6 text-black space-y-1">
                    <li>Payment method information (last 4 digits only)</li>
                    <li>Transaction logs</li>
                    <li>Billing correspondence</li>
                  </ul>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Employment and HR Records</h2>
            
            <div className="bg-brand-blue-50 rounded-xl p-6 border-2 border-brand-blue-200 mb-6">
              <h3 className="text-xl font-bold text-black mb-4">Employee Records</h3>
              <ul className="space-y-3 text-black">
                <li><strong>Personnel Files:</strong> 7 years after employment ends</li>
                <li><strong>Payroll Records:</strong> 7 years (IRS requirement)</li>
                <li><strong>I-9 Forms:</strong> 3 years after hire or 1 year after termination (whichever is later)</li>
                <li><strong>Benefits Records:</strong> 6 years after plan year ends</li>
                <li><strong>Applications (Not Hired):</strong> 1 year from application date</li>
                <li><strong>Performance Reviews:</strong> Duration of employment + 3 years</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Operational and Business Records</h2>
            
            <div className="bg-orange-50 rounded-xl p-6 border-2 border-orange-200 mb-6">
              <h3 className="text-xl font-bold text-black mb-4">Business Records</h3>
              <ul className="space-y-3 text-black">
                <li><strong>Contracts and Agreements:</strong> 7 years after expiration</li>
                <li><strong>Corporate Records:</strong> Permanent</li>
                <li><strong>Insurance Policies:</strong> Permanent</li>
                <li><strong>Property Records:</strong> Permanent</li>
                <li><strong>Audit Reports:</strong> 7 years</li>
                <li><strong>Tax Returns:</strong> Permanent</li>
                <li><strong>Meeting Minutes:</strong> Permanent</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Technology and System Data</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">System Logs and Analytics</h3>
            <div className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-6">
              <ul className="space-y-3 text-black">
                <li><strong>Access Logs:</strong> 90 days</li>
                <li><strong>Security Logs:</strong> 1 year</li>
                <li><strong>System Backups:</strong> 30 days (rolling)</li>
                <li><strong>Website Analytics:</strong> 26 months</li>
                <li><strong>Email Logs:</strong> 90 days</li>
                <li><strong>Error Logs:</strong> 90 days</li>
              </ul>
            </div>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">User Account Data</h3>
            <div className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-6">
              <ul className="space-y-3 text-black">
                <li><strong>Active Accounts:</strong> Retained while account is active</li>
                <li><strong>Inactive Accounts (Students):</strong> 7 years after last login</li>
                <li><strong>Inactive Accounts (Applicants):</strong> 2 years after last login</li>
                <li><strong>Deleted Accounts:</strong> 30 days in recovery, then permanently deleted</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Communication Records</h2>
            
            <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200 mb-6">
              <h3 className="text-xl font-bold text-black mb-4">Email and Messages</h3>
              <ul className="space-y-3 text-black">
                <li><strong>Student Communications:</strong> 7 years after last enrollment</li>
                <li><strong>Administrative Email:</strong> 3 years</li>
                <li><strong>Marketing Communications:</strong> Until unsubscribe + 30 days</li>
                <li><strong>Support Tickets:</strong> 3 years after resolution</li>
                <li><strong>Chat Logs:</strong> 1 year</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Legal and Compliance Records</h2>
            
            <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200 mb-6">
              <h3 className="text-xl font-bold text-black mb-4">Legal Documents</h3>
              <ul className="space-y-3 text-black">
                <li><strong>Litigation Files:</strong> Permanent (until statute of limitations expires + 7 years)</li>
                <li><strong>Complaints and Investigations:</strong> 7 years after resolution</li>
                <li><strong>Compliance Reports:</strong> 7 years</li>
                <li><strong>Incident Reports:</strong> 7 years</li>
                <li><strong>FERPA Disclosures:</strong> 5 years</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Data Deletion Procedures</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Secure Deletion Methods</h3>
            <p className="text-black mb-4">
              When data reaches end of retention period:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li><strong>Digital Data:</strong> Securely overwritten using industry-standard methods</li>
              <li><strong>Databases:</strong> Records permanently deleted and not recoverable</li>
              <li><strong>Backups:</strong> Data removed from all backup systems</li>
              <li><strong>Physical Records:</strong> Shredded using cross-cut shredders</li>
              <li><strong>Electronic Media:</strong> Degaussed or physically destroyed</li>
            </ul>

            <h3 className="text-xl font-bold text-black mt-6 mb-3">Deletion Schedule</h3>
            <p className="text-black mb-6">
              Data deletion occurs:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Automatically when retention period expires</li>
              <li>Quarterly review of data eligible for deletion</li>
              <li>Annual audit of retention compliance</li>
              <li>Upon user request (where legally permitted)</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Exceptions to Retention Schedules</h2>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6">
              <h3 className="text-lg font-bold text-black mb-3">Legal Holds</h3>
              <p className="text-black mb-4">
                Data may be retained beyond normal schedules when:
              </p>
              <ul className="list-disc pl-6 text-black space-y-2">
                <li>Subject to litigation or investigation</li>
                <li>Required by court order or subpoena</li>
                <li>Part of ongoing audit or compliance review</li>
                <li>Needed for legal defense</li>
              </ul>
              <p className="text-black mt-4">
                Legal holds override normal deletion schedules until released by legal counsel.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Your Rights</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Access and Deletion Requests</h3>
            <p className="text-black mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Request access to your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of data (subject to legal requirements)</li>
              <li>Request data portability</li>
              <li>Object to certain data processing</li>
            </ul>
            <p className="text-black mb-6">
              Note: Some data cannot be deleted due to legal requirements (e.g., transcripts, financial records 
              during retention period).
            </p>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Data Retention Compliance</h2>
            
            <h3 className="text-xl font-bold text-black mt-6 mb-3">Monitoring and Auditing</h3>
            <p className="text-black mb-4">
              We ensure compliance through:
            </p>
            <ul className="list-disc pl-6 mb-6 text-black space-y-2">
              <li>Annual data retention audits</li>
              <li>Automated retention policy enforcement</li>
              <li>Staff training on retention requirements</li>
              <li>Regular policy reviews and updates</li>
              <li>Documentation of retention decisions</li>
            </ul>

            <h2 className="text-2xl font-bold text-black mt-8 mb-4">Contact Information</h2>
            <p className="text-black mb-4">
              For questions about data retention or to request data access/deletion:
            </p>
            <ul className="list-none mb-6 text-black space-y-2">
              <li><strong>Email:</strong> elevate4humanityedu@gmail.com</li>
              <li><strong>Phone:</strong> (317) 314-3757</li>
              <li><strong>Mail:</strong> Privacy Officer, Elevate for Humanity</li>
              <li className="ml-6">3737 N Meridian St, Suite 200</li>
              <li className="ml-6">Indianapolis, IN 46208</li>
              <li><strong>Office Hours:</strong> Monday-Friday, 9:00 AM - 5:00 PM EST</li>
            </ul>

            <div className="bg-brand-blue-50 border-l-4 border-brand-blue-400 p-6 mt-8">
              <p className="text-black mb-2">
                <strong>Related Policies:</strong>
              </p>
              <ul className="list-disc pl-6 text-black space-y-1">
                <li><a href="/policies/privacy" className="text-brand-blue-600 hover:underline">Privacy Policy</a></li>
                <li><a href="/policies/ferpa" className="text-brand-blue-600 hover:underline">FERPA Policy</a></li>
                <li><a href="/policies/verification" className="text-brand-blue-600 hover:underline">Verification Policy</a></li>
              </ul>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
